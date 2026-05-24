# PHP + MySQL backend (XAMPP)

## 1) Criar banco
- Abra phpMyAdmin
- Execute `database/schema_mysql.sql`

## 2) Configurar ambiente
- Edite `.env`
  - DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME, DB_PASSWORD
  - JWT_SECRET
  - ADMIN_USERNAME, ADMIN_PASSWORD
  - CORS_ORIGIN (frontend)

## 3) Apache/XAMPP
- Garanta mod_rewrite ativo
- URL base local:
  - `http://localhost/gcan/php-backend/public/health`

## 4) Apontar frontend para PHP API
No frontend `.env.local`:
- NEXT_PUBLIC_API_URL=http://localhost/gcan/php-backend/public
- NEXT_PUBLIC_API_URL_FRONTEND=http://localhost/gcan/php-backend/public
- NEXT_PUBLIC_SITE_URL=http://localhost:3000

## 5) Rotas disponíveis
- POST `/api/admin/login`
- GET `/api/admin/verify`
- GET `/api/admin/stats`
- GET `/api/admin/empresas/recent`
- GET `/api/admin/empresas?page=1&limit=10&search=`
- PATCH `/api/admin/empresas/{id}/approve`
- GET `/api/categories`
- GET `/api/categories/{id}`
- GET `/api/companies`
- GET `/api/companies/{id}`
- GET `/api/companies/category/{categoryId}`
- POST `/api/companies`
- PUT `/api/companies/{id}` (admin)
- DELETE `/api/companies/{id}` (admin)
- POST `/api/ratings`
- GET `/api/ratings/company/{companyId}`
- GET `/api/ratings/top-rated`

## 6) Migração de dados (manual inicial)
- Exportar CSV do PostgreSQL/Neon
- Importar em MySQL pelas tabelas `categories`, `companies`, `ratings`

