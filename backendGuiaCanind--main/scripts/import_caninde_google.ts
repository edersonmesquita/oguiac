import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

type GoogleTextSearchResponse = {
  results?: Array<{
    place_id: string;
    name: string;
    formatted_address?: string;
    vicinity?: string;
    website?: string;
    photos?: Array<{ photo_reference: string }>;
    types?: string[];
  }>;
  next_page_token?: string;
  status: string;
  error_message?: string;
};

type GooglePlaceDetailsResponse = {
  result?: {
    place_id: string;
    name: string;
    formatted_phone_number?: string;
    international_phone_number?: string;
    website?: string;
    formatted_address?: string;
    editorial_summary?: { overview?: string };
    photos?: Array<{ photo_reference: string }>;
  };
  status: string;
  error_message?: string;
};

const prisma = new PrismaClient();
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const CITY_QUERY = process.env.IMPORT_CITY_QUERY || 'Canindé, Ceará, Brasil';
const AUTO_APPROVE = process.env.IMPORT_AUTO_APPROVE === 'true';
const ONLY_CATEGORY = process.env.IMPORT_ONLY_CATEGORY?.trim().toLowerCase();
const LIMIT_PER_CATEGORY = Number(process.env.IMPORT_LIMIT_PER_CATEGORY || '25');

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizePhone(raw?: string): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;

  // Already with Brazilian country code.
  if (digits.startsWith('55') && digits.length >= 12 && digits.length <= 13) {
    return digits;
  }

  // Local BR number without country code (10 or 11 digits).
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  return null;
}

function toDescription(input?: string): string | undefined {
  if (!input) return undefined;
  const trimmed = input.trim();
  if (!trimmed) return undefined;
  return trimmed.length > 300 ? `${trimmed.slice(0, 297)}...` : trimmed;
}

async function fetchTextSearch(query: string, pageToken?: string): Promise<GoogleTextSearchResponse> {
  const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
  url.searchParams.set('query', query);
  url.searchParams.set('language', 'pt-BR');
  url.searchParams.set('region', 'br');
  url.searchParams.set('key', GOOGLE_MAPS_API_KEY as string);
  if (pageToken) {
    url.searchParams.set('pagetoken', pageToken);
  }

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`TextSearch HTTP ${res.status}`);
  }
  return res.json() as Promise<GoogleTextSearchResponse>;
}

async function fetchPlaceDetails(placeId: string): Promise<GooglePlaceDetailsResponse> {
  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
  url.searchParams.set('place_id', placeId);
  url.searchParams.set(
    'fields',
    'place_id,name,formatted_phone_number,international_phone_number,website,formatted_address,editorial_summary,photos'
  );
  url.searchParams.set('language', 'pt-BR');
  url.searchParams.set('region', 'br');
  url.searchParams.set('key', GOOGLE_MAPS_API_KEY as string);

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`PlaceDetails HTTP ${res.status}`);
  }
  return res.json() as Promise<GooglePlaceDetailsResponse>;
}

function buildPhotoUrl(photoReference?: string): string | undefined {
  if (!photoReference) return undefined;
  const url = new URL('https://maps.googleapis.com/maps/api/place/photo');
  url.searchParams.set('maxwidth', '800');
  url.searchParams.set('photo_reference', photoReference);
  url.searchParams.set('key', GOOGLE_MAPS_API_KEY as string);
  return url.toString();
}

async function upsertCompanyFromPlace(categoryId: string, placeId: string) {
  const details = await fetchPlaceDetails(placeId);
  if (details.status !== 'OK' || !details.result) {
    throw new Error(`PlaceDetails status=${details.status} msg=${details.error_message || '-'}`);
  }

  const place = details.result;
  const whatsapp = normalizePhone(place.international_phone_number || place.formatted_phone_number);

  // Requirement: only include with functional WhatsApp/phone.
  if (!whatsapp) {
    return { created: false, skipped: true, reason: 'no_whatsapp' as const };
  }

  const address = place.formatted_address || 'Canindé, CE';
  const logo = buildPhotoUrl(place.photos?.[0]?.photo_reference);
  const description = toDescription(place.editorial_summary?.overview);

  const existing = await prisma.company.findFirst({
    where: {
      OR: [
        { name: { equals: place.name, mode: 'insensitive' } },
        {
          AND: [
            { name: { contains: place.name.split(' ')[0], mode: 'insensitive' } },
            { address: { contains: address.slice(0, 25), mode: 'insensitive' } },
          ],
        },
      ],
    },
    select: { id: true },
  });

  if (existing) {
    return { created: false, skipped: true, reason: 'duplicate' as const };
  }

  await prisma.company.create({
    data: {
      name: place.name,
      whatsapp,
      address,
      categoryId,
      website: place.website || undefined,
      description,
      logo,
      approved: AUTO_APPROVE,
    },
  });

  return { created: true, skipped: false as const };
}

async function main() {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error('Missing GOOGLE_MAPS_API_KEY in environment.');
  }

  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });

  const selectedCategories = ONLY_CATEGORY
    ? categories.filter((c) => c.name.toLowerCase().includes(ONLY_CATEGORY))
    : categories;

  if (!selectedCategories.length) {
    throw new Error('No categories found for import.');
  }

  let totalCreated = 0;
  let totalSkippedNoWhatsapp = 0;
  let totalSkippedDup = 0;

  for (const category of selectedCategories) {
    const query = `${category.name} em ${CITY_QUERY}`;
    console.log(`\n=== Categoria: ${category.name} ===`);
    console.log(`Query: ${query}`);

    const placeIds = new Set<string>();
    let nextPageToken: string | undefined;
    let pages = 0;

    while (pages < 3 && placeIds.size < LIMIT_PER_CATEGORY) {
      if (nextPageToken) {
        // Google needs a short delay before page token becomes valid.
        await sleep(2200);
      }

      const search = await fetchTextSearch(query, nextPageToken);
      if (search.status !== 'OK' && search.status !== 'ZERO_RESULTS') {
        throw new Error(
          `TextSearch status=${search.status} msg=${search.error_message || '-'} (categoria=${category.name})`
        );
      }

      for (const item of search.results || []) {
        if (item.place_id) placeIds.add(item.place_id);
        if (placeIds.size >= LIMIT_PER_CATEGORY) break;
      }

      nextPageToken = search.next_page_token;
      pages += 1;
      if (!nextPageToken) break;
    }

    console.log(`Places coletados: ${placeIds.size}`);

    let created = 0;
    let skippedNoWhatsapp = 0;
    let skippedDup = 0;

    for (const placeId of placeIds) {
      try {
        const result = await upsertCompanyFromPlace(category.id, placeId);
        if (result.created) created += 1;
        if (result.skipped && result.reason === 'no_whatsapp') skippedNoWhatsapp += 1;
        if (result.skipped && result.reason === 'duplicate') skippedDup += 1;
      } catch (err) {
        console.warn(`Falha ao importar place_id=${placeId}: ${(err as Error).message}`);
      }
      await sleep(180);
    }

    totalCreated += created;
    totalSkippedNoWhatsapp += skippedNoWhatsapp;
    totalSkippedDup += skippedDup;

    console.log(
      `Resumo categoria ${category.name}: criadas=${created}, sem_whatsapp=${skippedNoWhatsapp}, duplicadas=${skippedDup}`
    );
  }

  console.log('\n=== RESUMO FINAL ===');
  console.log(`Empresas criadas: ${totalCreated}`);
  console.log(`Ignoradas sem WhatsApp válido: ${totalSkippedNoWhatsapp}`);
  console.log(`Ignoradas por duplicidade: ${totalSkippedDup}`);
}

main()
  .catch((err) => {
    console.error('Erro no importador:', err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
