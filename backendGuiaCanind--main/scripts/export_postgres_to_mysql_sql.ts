import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

function esc(v: unknown): string {
  if (v === null || v === undefined) return 'NULL';
  const s = String(v)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'");
  return `'${s}'`;
}

function dt(v: Date | string | null | undefined): string {
  if (!v) return 'NOW()';
  const d = typeof v === 'string' ? new Date(v) : v;
  const iso = d.toISOString().slice(0, 19).replace('T', ' ');
  return esc(iso);
}

function categoryKey(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

async function main() {
  const rawCategories = await prisma.category.findMany({
    orderBy: { createdAt: 'asc' },
  });
  const companies = await prisma.company.findMany({
    orderBy: { createdAt: 'asc' },
  });
  const ratings = await prisma.rating.findMany({
    orderBy: { createdAt: 'asc' },
  });

  const lines: string[] = [];

  const normalizedCategoryMap = new Map<
    string,
    { id: string; name: string; description: string | null; createdAt: Date; updatedAt: Date }
  >();
  const categoryIdMap = new Map<string, string>();

  for (const c of rawCategories) {
    const normalizedName = c.name.replace(/\s+/g, ' ').trim();
    const key = categoryKey(normalizedName);
    if (!normalizedCategoryMap.has(key)) {
      normalizedCategoryMap.set(key, {
        id: c.id,
        name: normalizedName,
        description: c.description,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      });
    }
    categoryIdMap.set(c.id, normalizedCategoryMap.get(key)!.id);
  }

  const categories = [...normalizedCategoryMap.values()];
  lines.push('USE gcan;');
  lines.push('SET FOREIGN_KEY_CHECKS=0;');
  lines.push('TRUNCATE TABLE ratings;');
  lines.push('TRUNCATE TABLE companies;');
  lines.push('TRUNCATE TABLE categories;');

  for (const c of categories) {
    lines.push(
      `INSERT INTO categories (id,name,description,createdAt,updatedAt) VALUES (${esc(c.id)},${esc(c.name)},${esc(
        c.description
      )},${dt(c.createdAt)},${dt(c.updatedAt)});`
    );
  }

  for (const c of companies) {
    const mappedCategoryId = categoryIdMap.get(c.categoryId) || c.categoryId;
    lines.push(
      `INSERT INTO companies (id,name,whatsapp,address,logo,instagram,approved,facebook,youtube,website,categoryId,email,password,planId,description,createdAt,updatedAt)` +
        ` VALUES (${esc(c.id)},${esc(c.name)},${esc(c.whatsapp)},${esc(c.address)},${esc(c.logo)},${esc(
          c.instagram
        )},${c.approved ? 1 : 0},${esc(c.facebook)},${esc(c.youtube)},${esc(c.website)},${esc(
          mappedCategoryId
        )},${esc(
          c.email
        )},${esc(c.password)},${esc(c.planId)},${esc(c.description)},${dt(c.createdAt)},${dt(c.updatedAt)});`
    );
  }

  for (const r of ratings) {
    lines.push(
      `INSERT INTO ratings (id,stars,companyId,userId,createdAt,updatedAt) VALUES (${esc(r.id)},${r.stars},${esc(
        r.companyId
      )},${esc(r.userId)},${dt(r.createdAt)},${dt(r.updatedAt)});`
    );
  }

  lines.push('SET FOREIGN_KEY_CHECKS=1;');

  const outFile = path.resolve(
    'C:/xampp/htdocs/gcan/php-backend/database/migrate_postgres_to_mysql_data.sql'
  );
  fs.writeFileSync(outFile, `${lines.join('\n')}\n`, 'utf8');

  console.log(`Arquivo gerado: ${outFile}`);
  console.log(`Categorias (deduplicadas): ${categories.length}`);
  console.log(`Empresas: ${companies.length}`);
  console.log(`Avaliacoes: ${ratings.length}`);
}

main()
  .catch((err) => {
    console.error('Falha ao gerar SQL de migração:', err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
