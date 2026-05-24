const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding plans to database...');
  
  // Delete existing plans
  await prisma.plan.deleteMany({});
  
  // Create Free Plan
  const freePlan = await prisma.plan.create({
    data: {
      name: 'Plano Grátis',
      description: 'Listagem básica no diretório',
      features: [
        'Informações básicas da empresa', 
        'Contato via WhatsApp', 
        'Apenas informações básicas'
      ],
      price: 0.00
    }
  });
  
  // Create Basic Plan
  const basicPlan = await prisma.plan.create({
    data: {
      name: 'Plano Básico',
      description: 'Essencial para sua presença digital',
      features: [
        'Listagem no diretório', 
        'Informações básicas da empresa', 
        'Contato via WhatsApp', 
        'Galeria de imagens (3 fotos)', 
        'Horário de funcionamento'
      ],
      price: 10.00
    }
  });
  
  // Create Pro Plan
  const proPlan = await prisma.plan.create({
    data: {
      name: 'Plano Pro',
      description: 'Visibilidade completa para sua empresa',
      features: [
        'Tudo do plano básico', 
        'Galeria de imagens (20 fotos)', 
        'Produtos e serviços em destaque', 
        'Vídeo promocional', 
        'Posição destacada nas buscas', 
        'Suporte prioritário'
      ],
      price: 20.00
    }
  });
  
  // Show created plans
  const plans = await prisma.plan.findMany();
  console.log('Plans created:');
  console.table(plans);
  
  console.log('Plans seeded successfully!');
}

main()
  .catch(e => {
    console.error('Error seeding plans:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 