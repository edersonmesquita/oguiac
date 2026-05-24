import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

function csvEscape(value: unknown): string {
  const str = value == null ? '' : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

async function main() {
  const companies = await prisma.company.findMany({
    include: { category: true },
    orderBy: [{ approved: 'desc' }, { name: 'asc' }],
  });

  const header = [
    'id',
    'name',
    'category',
    'whatsapp',
    'address',
    'website',
    'instagram',
    'facebook',
    'youtube',
    'logo',
    'approved',
    'createdAt',
    'updatedAt',
  ];

  const lines = [header.join(',')];

  for (const c of companies) {
    const row = [
      c.id,
      c.name,
      c.category?.name || '',
      c.whatsapp,
      c.address,
      c.website || '',
      c.instagram || '',
      c.facebook || '',
      c.youtube || '',
      c.logo || '',
      c.approved ? 'true' : 'false',
      c.createdAt.toISOString(),
      c.updatedAt.toISOString(),
    ].map(csvEscape);
    lines.push(row.join(','));
  }

  const outDir = path.join(process.cwd(), 'exports');
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `companies_export_${new Date().toISOString().slice(0, 10)}.csv`);
  fs.writeFileSync(outFile, `${lines.join('\n')}\n`, 'utf8');

  console.log(`CSV exportado em: ${outFile}`);
  console.log(`Total de empresas exportadas: ${companies.length}`);
}

main()
  .catch((err) => {
    console.error('Falha na exportação:', err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
