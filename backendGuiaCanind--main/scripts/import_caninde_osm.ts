import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const AUTO_APPROVE = process.env.IMPORT_AUTO_APPROVE === 'true';
const ONLY_CATEGORY = process.env.IMPORT_ONLY_CATEGORY?.trim().toLowerCase();
const LIMIT_PER_CATEGORY = Number(process.env.IMPORT_LIMIT_PER_CATEGORY || '40');
const OVERPASS_URLS = (
  process.env.OVERPASS_URLS ||
  process.env.OVERPASS_URL ||
  'https://overpass-api.de/api/interpreter,https://overpass.kumi.systems/api/interpreter,https://lz4.overpass-api.de/api/interpreter'
)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const CITY_NAME = process.env.IMPORT_CITY_NAME || 'Canindé';
const STATE_NAME = process.env.IMPORT_STATE_NAME || 'Ceará';
const COUNTRY_NAME = process.env.IMPORT_COUNTRY_NAME || 'Brasil';
const NOMINATIM_URL = process.env.NOMINATIM_URL || 'https://nominatim.openstreetmap.org/search';

type OSMElement = {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

type OverpassResponse = {
  elements: OSMElement[];
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizePhone(raw?: string): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('55') && digits.length >= 12 && digits.length <= 13) return digits;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return null;
}

function toDescription(input?: string): string | undefined {
  if (!input) return undefined;
  const trimmed = input.trim();
  if (!trimmed) return undefined;
  return trimmed.length > 300 ? `${trimmed.slice(0, 297)}...` : trimmed;
}

function safe(v?: string): string | undefined {
  const s = v?.trim();
  return s ? s : undefined;
}

function buildAddress(tags: Record<string, string>): string {
  const street = tags['addr:street'] || tags['street'] || '';
  const house = tags['addr:housenumber'] || '';
  const suburb = tags['addr:suburb'] || tags['addr:neighbourhood'] || '';
  const city = tags['addr:city'] || CITY_NAME;
  const state = tags['addr:state'] || STATE_NAME;
  const postcode = tags['addr:postcode'] || '';

  const parts = [
    [street, house].filter(Boolean).join(', '),
    suburb,
    city,
    state,
    postcode,
  ].filter(Boolean);

  return parts.length ? parts.join(' - ') : `${CITY_NAME}, ${STATE_NAME}`;
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildCategoryRegex(categoryName: string): string {
  const aliases: Record<string, string[]> = {
    pizzaria: ['pizzaria', 'pizza', 'pizzeria'],
    farmacia: ['farmacia', 'farmácia', 'drogaria'],
    odontologia: ['odontologia', 'odontologica', 'dentista', 'clínica odontológica'],
    grafica: ['grafica', 'gráfica', 'impressao', 'impressão'],
    academia: ['academia', 'gym', 'fitness'],
    gas: ['gás', 'gas', 'botijão', 'ultragaz'],
    telecom: ['telecom', 'internet', 'provedor'],
  };

  const normalized = categoryName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const words = normalized.split(/\s+/).filter((w) => w.length >= 3);
  const matchedAlias = Object.entries(aliases).find(([k]) => normalized.includes(k))?.[1] || [];
  const allTerms = [...new Set([...words, ...matchedAlias])].map(escapeRegExp);
  if (!allTerms.length) return escapeRegExp(categoryName);
  return allTerms.join('|');
}

function buildTagFilters(categoryName: string): string[] {
  const n = categoryName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (n.includes('pizz')) return ['["amenity"="restaurant"]', '["cuisine"~"pizza",i]'];
  if (n.includes('farmac') || n.includes('drog')) return ['["amenity"="pharmacy"]', '["shop"="chemist"]'];
  if (n.includes('acade')) return ['["leisure"="fitness_centre"]', '["sport"]'];
  if (n.includes('restaur') || n.includes('churrasc')) return ['["amenity"="restaurant"]', '["amenity"="fast_food"]'];
  if (n.includes('hamburg')) return ['["amenity"="fast_food"]', '["cuisine"~"burger",i]'];
  if (n.includes('mercad')) return ['["shop"="supermarket"]', '["shop"="convenience"]'];
  if (n.includes('provedor') || n.includes('internet') || n.includes('telecom'))
    return ['["office"="telecommunication"]', '["internet_access"]'];
  if (n.includes('graf')) return ['["shop"="copyshop"]', '["craft"="printmaker"]'];
  if (n.includes('gas') || n.includes('agua')) return ['["shop"="gas"]', '["amenity"="fuel"]'];
  if (n.includes('taxi') || n.includes('moto taxi')) return ['["amenity"="taxi"]'];
  if (n.includes('saude') || n.includes('clinica') || n.includes('dent'))
    return ['["amenity"="clinic"]', '["amenity"="doctors"]', '["healthcare"]', '["amenity"="dentist"]'];

  return ['["amenity"]', '["shop"]', '["office"]'];
}

function buildOverpassQuery(categoryName: string): string {
  const nameRegex = buildCategoryRegex(categoryName);
  const tagFilters = buildTagFilters(categoryName);
  const filterClauses = tagFilters
    .map(
      (f) => `
  node(area.a)${f}["name"~"${nameRegex}",i];
  way(area.a)${f}["name"~"${nameRegex}",i];
  relation(area.a)${f}["name"~"${nameRegex}",i];
`
    )
    .join('\n');

  return `
[out:json][timeout:80];
area["name"="${CITY_NAME}"]["boundary"="administrative"]->.a;
(
${filterClauses}
);
out tags center;
`;
}

type BBox = { south: number; west: number; north: number; east: number };

async function fetchCityBoundingBox(): Promise<BBox> {
  const query = `${CITY_NAME}, ${STATE_NAME}, ${COUNTRY_NAME}`;
  const url = new URL(NOMINATIM_URL);
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', '1');
  url.searchParams.set('addressdetails', '1');

  const res = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'gcan-importer/1.0',
    },
  });

  if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`);
  const rows = (await res.json()) as Array<{ boundingbox?: string[] }>;
  if (!rows?.length || !rows[0].boundingbox || rows[0].boundingbox.length !== 4) {
    throw new Error(`Nominatim sem bounding box para ${query}`);
  }

  const [south, north, west, east] = rows[0].boundingbox.map((v) => Number(v));
  return { south, west, north, east };
}

async function fetchOverpass(categoryName: string): Promise<OverpassResponse> {
  const bbox = await fetchCityBoundingBox();
  const query = buildOverpassQuery(categoryName)
    .replace('area["name"="${CITY_NAME}"]["boundary"="administrative"]->.a;', '')
    .replace(/node\(area\.a\)/g, `node(${bbox.south},${bbox.west},${bbox.north},${bbox.east})`)
    .replace(/way\(area\.a\)/g, `way(${bbox.south},${bbox.west},${bbox.north},${bbox.east})`)
    .replace(/relation\(area\.a\)/g, `relation(${bbox.south},${bbox.west},${bbox.north},${bbox.east})`);
  const body = new URLSearchParams({ data: query });

  let lastError = 'unknown';
  for (const endpoint of OVERPASS_URLS) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          Accept: 'application/json',
          'User-Agent': 'gcan-importer/1.0',
        },
        body,
      });

      if (!res.ok) {
        lastError = `${endpoint} -> HTTP ${res.status}`;
        continue;
      }

      return (await res.json()) as OverpassResponse;
    } catch (err) {
      lastError = `${endpoint} -> ${(err as Error).message}`;
    }
  }

  throw new Error(`Falha em todos endpoints Overpass: ${lastError}`);
}

async function upsertCompanyFromOSM(categoryId: string, element: OSMElement) {
  const tags = element.tags || {};
  const name = safe(tags.name);
  if (!name) return { created: false, skipped: true, reason: 'no_name' as const };

  const whatsapp = normalizePhone(tags.whatsapp || tags.phone || tags['contact:phone'] || tags['contact:whatsapp']);
  if (!whatsapp) return { created: false, skipped: true, reason: 'no_whatsapp' as const };

  const address = buildAddress(tags);
  const website = safe(tags.website || tags['contact:website']);
  const instagram = safe(tags.instagram || tags['contact:instagram']);
  const facebook = safe(tags.facebook || tags['contact:facebook']);
  const description = toDescription(tags.description);
  const logo = safe(tags.image || tags.logo);

  const existing = await prisma.company.findFirst({
    where: {
      OR: [
        { name: { equals: name, mode: 'insensitive' } },
        { whatsapp },
      ],
    },
    select: { id: true },
  });

  if (existing) return { created: false, skipped: true, reason: 'duplicate' as const };

  await prisma.company.create({
    data: {
      name,
      whatsapp,
      address,
      categoryId,
      website,
      instagram,
      facebook,
      description,
      logo,
      approved: AUTO_APPROVE,
    },
  });

  return { created: true, skipped: false as const };
}

async function main() {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });

  const selectedCategories = ONLY_CATEGORY
    ? categories.filter((c) => c.name.toLowerCase().includes(ONLY_CATEGORY))
    : categories;

  if (!selectedCategories.length) throw new Error('No categories found for import.');

  let totalCreated = 0;
  let totalNoWhatsapp = 0;
  let totalDuplicate = 0;
  let totalNoName = 0;

  for (const category of selectedCategories) {
    console.log(`\n=== Categoria: ${category.name} ===`);
    const data = await fetchOverpass(category.name);
    const elements = (data.elements || []).slice(0, LIMIT_PER_CATEGORY);
    console.log(`OSM elementos coletados: ${elements.length}`);

    let created = 0;
    let noWhatsapp = 0;
    let duplicate = 0;
    let noName = 0;

    for (const el of elements) {
      try {
        const result = await upsertCompanyFromOSM(category.id, el);
        if (result.created) created += 1;
        if (result.skipped && result.reason === 'no_whatsapp') noWhatsapp += 1;
        if (result.skipped && result.reason === 'duplicate') duplicate += 1;
        if (result.skipped && result.reason === 'no_name') noName += 1;
      } catch (err) {
        console.warn(`Falha elemento OSM ${el.type}/${el.id}: ${(err as Error).message}`);
      }
      await sleep(120);
    }

    totalCreated += created;
    totalNoWhatsapp += noWhatsapp;
    totalDuplicate += duplicate;
    totalNoName += noName;

    console.log(
      `Resumo ${category.name}: criadas=${created}, sem_whatsapp=${noWhatsapp}, duplicadas=${duplicate}, sem_nome=${noName}`
    );
  }

  console.log('\n=== RESUMO FINAL OSM ===');
  console.log(`Cidade/UF/País: ${CITY_NAME}/${STATE_NAME}/${COUNTRY_NAME}`);
  console.log(`Empresas criadas: ${totalCreated}`);
  console.log(`Ignoradas sem WhatsApp: ${totalNoWhatsapp}`);
  console.log(`Ignoradas duplicadas: ${totalDuplicate}`);
  console.log(`Ignoradas sem nome: ${totalNoName}`);
}

main()
  .catch((err) => {
    console.error('Erro no importador OSM:', err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
