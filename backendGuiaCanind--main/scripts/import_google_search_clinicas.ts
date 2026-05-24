import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const SEARCH_URL =
  process.env.IMPORT_GOOGLE_SEARCH_URL ||
  'https://www.google.com/search?q=clinicas+em+canind%C3%A9&udm=1';
const AUTO_APPROVE = process.env.IMPORT_AUTO_APPROVE === 'true';
const MAX_LINKS = Number(process.env.IMPORT_MAX_LINKS || '25');

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizePhone(raw?: string): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('55') && digits.length >= 12 && digits.length <= 13) return digits;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return null;
}

function extractPhones(text: string): string[] {
  const matches = text.match(/(?:\+?55\s*)?(?:\(?\d{2}\)?\s*)?(?:9?\d{4}[-\s]?\d{4})/g) || [];
  const normalized = matches.map(normalizePhone).filter((v): v is string => !!v);
  return [...new Set(normalized)];
}

function extractAddress(text: string): string | undefined {
  const m =
    text.match(/(?:R\.|Rua|Av\.|Avenida)[^,\n]{3,120},?\s*\d{0,6}[^.\n]{0,120}Canind[ée][^.\n]{0,40}/i) ||
    text.match(/Canind[ée]\s*-\s*CE[^.\n]{0,120}/i);
  return m?.[0]?.trim();
}

function extractTitle(html: string): string {
  const t = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '';
  return t.replace(/\s+/g, ' ').trim();
}

function extractOgImage(html: string): string | undefined {
  const m =
    html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  return m?.[1];
}

async function fetchGoogleResultLinks(): Promise<string[]> {
  const res = await fetch(SEARCH_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'text/html' },
  });
  if (!res.ok) throw new Error(`Google Search HTTP ${res.status}`);
  const html = await res.text();

  // Google result links usually come as /url?q=<target>&...
  const rawLinks = [...html.matchAll(/href="\/url\?q=([^"&]+)[^"]*"/g)].map((m) => decodeURIComponent(m[1]));
  const links = [...new Set(rawLinks)]
    .filter((l) => l.startsWith('http'))
    .filter((l) => !l.includes('google.com'))
    .slice(0, MAX_LINKS);

  return links;
}

async function resolveClinicaCategoryId(): Promise<string> {
  const categories = await prisma.category.findMany({ select: { id: true, name: true } });
  const match =
    categories.find((c) => c.name.toLowerCase().includes('clinica')) ||
    categories.find((c) => c.name.toLowerCase().includes('saúde')) ||
    categories.find((c) => c.name.toLowerCase().includes('serviços'));

  if (!match) throw new Error('Nenhuma categoria adequada (Clínica/Saúde/Serviços) encontrada no banco.');
  return match.id;
}

async function importLink(url: string, categoryId: string) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'text/html' },
  });
  if (!res.ok) return { created: false, reason: 'fetch_failed' as const };

  const html = await res.text();
  const title = extractTitle(html);
  const text = stripTags(html);
  const combined = `${title} ${text}`;

  if (!/canind[ée]/i.test(combined)) return { created: false, reason: 'not_caninde' as const };

  const phones = extractPhones(combined);
  const whatsapp = phones[0];
  if (!whatsapp) return { created: false, reason: 'no_whatsapp' as const };

  const name = title
    .replace(/\s+\|.*$/, '')
    .replace(/\s+-\s+.*$/, '')
    .trim()
    .slice(0, 120);
  if (!name || name.length < 3) return { created: false, reason: 'no_name' as const };

  const existing = await prisma.company.findFirst({
    where: {
      OR: [{ whatsapp }, { name: { equals: name, mode: 'insensitive' } }],
    },
    select: { id: true },
  });
  if (existing) return { created: false, reason: 'duplicate' as const };

  const logo = extractOgImage(html);
  const address = extractAddress(combined) || 'Canindé - CE';
  const description = combined.slice(0, 280);

  await prisma.company.create({
    data: {
      name,
      whatsapp,
      address,
      logo,
      website: url,
      description,
      categoryId,
      approved: AUTO_APPROVE,
    },
  });

  return { created: true as const, reason: 'created' as const };
}

async function main() {
  const categoryId = await resolveClinicaCategoryId();
  const links = await fetchGoogleResultLinks();
  console.log(`Links encontrados no Google: ${links.length}`);

  let created = 0;
  for (const link of links) {
    try {
      const result = await importLink(link, categoryId);
      if (result.created) created += 1;
    } catch (err) {
      console.warn(`Falha ao importar ${link}: ${(err as Error).message}`);
    }
  }

  console.log(`Empresas criadas: ${created}`);
}

main()
  .catch((err) => {
    console.error('Erro no importador Google Search:', err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

