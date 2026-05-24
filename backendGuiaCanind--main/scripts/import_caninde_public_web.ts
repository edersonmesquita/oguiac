import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const AUTO_APPROVE = process.env.IMPORT_AUTO_APPROVE === 'true';
const ONLY_CATEGORY = process.env.IMPORT_ONLY_CATEGORY?.trim().toLowerCase();
const LIMIT_RESULTS_PER_CATEGORY = Number(process.env.IMPORT_WEB_RESULTS_PER_CATEGORY || '10');
const LIMIT_PAGES_PER_CATEGORY = Number(process.env.IMPORT_WEB_PAGES_PER_CATEGORY || '8');
const SEARCH_ENDPOINT = 'https://html.duckduckgo.com/html/';

const ALLOWED_HOSTS = [
  'eguias.net',
  'solutudo.com.br',
  'br.todosnegocios.com',
  'diariocidade.com',
  'farmaciaqui.net',
  'cnpj.biz',
  'parafa.com.br',
  'odontologia.net.br',
];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

function extractName(title: string, bodyText: string): string | undefined {
  const t = title.replace(/\s+\|.*$/, '').replace(/\s+-\s+.*$/, '').trim();
  if (t.length >= 3 && !/canind[ée]/i.test(t)) return t;
  const m = bodyText.match(/(?:empresa|cl[ií]nica|pizzaria|farm[aá]cia)\s+([A-Z0-9][^.,;\n]{3,80})/i);
  return m?.[1]?.trim();
}

async function ddgSearch(query: string): Promise<string[]> {
  const url = `${SEARCH_ENDPOINT}?q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'text/html' },
  });
  if (!res.ok) throw new Error(`DuckDuckGo HTTP ${res.status}`);
  const html = await res.text();
  const links = [...html.matchAll(/<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"/g)].map((m) => m[1]);
  const decoded = links
    .map((l) => {
      const m = l.match(/uddg=([^&]+)/);
      return m ? decodeURIComponent(m[1]) : l;
    })
    .filter((l) => l.startsWith('http'));
  return [...new Set(decoded)].slice(0, LIMIT_RESULTS_PER_CATEGORY);
}

async function upsertFromPage(categoryId: string, url: string) {
  const u = new URL(url);
  if (!ALLOWED_HOSTS.some((h) => u.hostname.endsWith(h))) {
    return { created: false, skipped: true, reason: 'host_filtered' as const };
  }

  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'text/html' },
  });
  if (!res.ok) return { created: false, skipped: true, reason: 'fetch_failed' as const };

  const html = await res.text();
  const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '').replace(/\s+/g, ' ').trim();
  const text = stripTags(html);
  if (!/canind[ée]/i.test(text + ' ' + title)) {
    return { created: false, skipped: true, reason: 'not_caninde' as const };
  }

  const phones = extractPhones(text);
  const whatsapp = phones[0];
  if (!whatsapp) return { created: false, skipped: true, reason: 'no_whatsapp' as const };

  const name = extractName(title, text);
  if (!name) return { created: false, skipped: true, reason: 'no_name' as const };

  const address = extractAddress(text) || 'Canindé - CE';
  const description = text.slice(0, 280);

  const existing = await prisma.company.findFirst({
    where: {
      OR: [{ whatsapp }, { name: { equals: name, mode: 'insensitive' } }],
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
      website: url,
      description,
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
  const selected = ONLY_CATEGORY
    ? categories.filter((c) => c.name.toLowerCase().includes(ONLY_CATEGORY))
    : categories;

  let totalCreated = 0;

  for (const cat of selected) {
    const query = `${cat.name} Canindé CE whatsapp`;
    console.log(`\n=== Categoria: ${cat.name} ===`);
    const links = await ddgSearch(query);
    console.log(`Links encontrados: ${links.length}`);

    let created = 0;
    for (const link of links.slice(0, LIMIT_PAGES_PER_CATEGORY)) {
      try {
        const r = await upsertFromPage(cat.id, link);
        if (r.created) created += 1;
      } catch {}
      await sleep(250);
    }
    totalCreated += created;
    console.log(`Criadas na categoria: ${created}`);
  }

  console.log(`\nTotal criado: ${totalCreated}`);
}

main()
  .catch((e) => {
    console.error('Erro no importador web público:', e.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

