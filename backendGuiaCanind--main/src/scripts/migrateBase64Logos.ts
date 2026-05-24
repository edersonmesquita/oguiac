// scripts/migrateBase64Logos.ts

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  const empresas = await prisma.company.findMany();
  const uploadDir = path.join(__dirname, '../uploads');

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
  }

  for (const empresa of empresas) {
    if (empresa.logo && empresa.logo.startsWith('data:image')) {
      // Extrai o tipo e os dados base64
      const matches = empresa.logo.match(/^data:(image\/\w+);base64,(.+)$/);
      if (!matches) continue;

      const ext = matches[1].split('/')[1];
      const data = matches[2];
      const buffer = Buffer.from(data, 'base64');
      const fileName = `logo_${empresa.id}.${ext}`;
      const filePath = path.join(uploadDir, fileName);

      fs.writeFileSync(filePath, buffer);

      // Atualiza o campo logo no banco
      await prisma.company.update({
        where: { id: empresa.id },
        data: { logo: `/uploads/${fileName}` },
      });

      console.log(`Migrada logo da empresa ${empresa.name} para /uploads/${fileName}`);
    }
  }

  await prisma.$disconnect();
  console.log('Migração concluída!');
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});