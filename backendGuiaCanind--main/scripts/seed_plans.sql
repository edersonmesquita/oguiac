-- Delete existing plans (to avoid duplicates)
DELETE FROM "plans";

-- Insert Free Plan (R$0)
INSERT INTO "plans" ("id", "name", "description", "features", "price", "createdAt", "updatedAt") 
VALUES (
  gen_random_uuid(), 
  'Plano Grátis',
  'Listagem básica no diretório',
  ARRAY['Informações básicas da empresa', 'Contato via WhatsApp', 'Apenas informações básicas'],
  0.00,
  NOW(),
  NOW()
);

-- Insert Basic Plan (R$10/month)
INSERT INTO "plans" ("id", "name", "description", "features", "price", "createdAt", "updatedAt") 
VALUES (
  gen_random_uuid(), 
  'Plano Básico',
  'Essencial para sua presença digital',
  ARRAY['Listagem no diretório', 'Informações básicas da empresa', 'Contato via WhatsApp', 'Galeria de imagens (3 fotos)', 'Horário de funcionamento'],
  10.00,
  NOW(),
  NOW()
);

-- Insert Pro Plan (R$20/month)
INSERT INTO "plans" ("id", "name", "description", "features", "price", "createdAt", "updatedAt") 
VALUES (
  gen_random_uuid(), 
  'Plano Pro',
  'Visibilidade completa para sua empresa',
  ARRAY['Tudo do plano básico', 'Galeria de imagens (20 fotos)', 'Produtos e serviços em destaque', 'Vídeo promocional', 'Posição destacada nas buscas', 'Suporte prioritário'],
  20.00,
  NOW(),
  NOW()
);

-- Show inserted plans
SELECT * FROM "plans"; 