import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const categories = [
    { name: 'Restaurantes', description: 'Restaurantes e lanchonetes' },
    { name: 'Serviços', description: 'Prestadores de serviços diversos' },
    { name: 'Comércio', description: 'Lojas e estabelecimentos comerciais' },
    { name: 'Saúde', description: 'Clínicas, farmácias e serviços de saúde' },
    { name: 'Educação', description: 'Escolas, cursos e professores' },
  ];

  console.log('Iniciando seed...');

  for (const category of categories) {
    const exists = await prisma.category.findUnique({
      where: { name: category.name },
    });

    if (!exists) {
      await prisma.category.create({
        data: category,
      });
      console.log(`Categoria criada: ${category.name}`);
    } else {
      console.log(`Categoria já existe: ${category.name}`);
    }
  }

  console.log('Seed finalizado!');
}

main()
  .catch((e) => {
    console.error('Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 