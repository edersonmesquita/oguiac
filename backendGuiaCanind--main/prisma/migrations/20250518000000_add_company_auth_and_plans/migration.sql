-- Adicionar campos de email e senha para autenticação de empresas (sem UNIQUE inicialmente)
ALTER TABLE "companies" ADD COLUMN "email" TEXT;
ALTER TABLE "companies" ADD COLUMN "password" TEXT;
ALTER TABLE "companies" ADD COLUMN "planId" TEXT;

-- Criar nova tabela para planos
CREATE TABLE "plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "features" TEXT[],
    "price" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- Criar chave estrangeira para relacionar empresas com planos
ALTER TABLE "companies" ADD CONSTRAINT "companies_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Comentando a restrição UNIQUE por enquanto, para ser adicionada manualmente depois de verificar duplicatas
-- CREATE UNIQUE INDEX "companies_email_key" ON "companies"("email"); 