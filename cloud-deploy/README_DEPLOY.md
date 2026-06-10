# Pacote de Deploy em Nuvem (Guia Canindé)

## Conteúdo
- `backend.env.example` -> variáveis de ambiente do backend (Railway/Render)
- `frontend.env.example` -> variáveis do frontend (Vercel)
- `gcan.sql` -> dump do banco MySQL
- `railway.backend.example.json` -> exemplo de config Railway

## 1) Backend (Node/Express) no Railway
1. Conecte o repositório.
2. Root directory: `backendGuiaCanind--main`
3. Build command: `npm install && npm run build`
4. Start command: `npm run start`
5. Configure as variáveis com base em `backend.env.example`.
6. Após deploy, teste: `https://SEU_BACKEND/health`

## 2) Frontend (Next.js) na Vercel
1. Conecte o repositório.
2. Root directory: `frontEndGuiaCaninde-main`
3. Build command: `npm run build`
4. Configure as variáveis com base em `frontend.env.example`.
5. Redeploy.

## 3) Banco de Dados
### Opção A (recomendada): PostgreSQL (Neon/Supabase)
- Use `DATABASE_URL` PostgreSQL no backend.
- Rode migrations Prisma na nuvem, se necessário:
  - `npx prisma generate`
  - `npx prisma migrate deploy`

### Opção B: MySQL
- Crie um banco MySQL na nuvem.
- Importe `gcan.sql`.
- Para a versao PHP/MySQL do site, use tambem `deploy-webroot/migrar_dados.sql` para inserir categorias e empresas.
- Ajuste backend para driver/ORM de MySQL (o backend atual usa Prisma em PostgreSQL).

## 4) Checklist Final
- Frontend consegue login admin.
- Listagem de empresas/carregamento de categorias funcionando.
- Compartilhamento no WhatsApp com domínio público (`NEXT_PUBLIC_SITE_URL`).
- Upload/logo validado.

## 5) Observação importante
- O backend atual (Node) está configurado para PostgreSQL via Prisma.
- O arquivo `gcan.sql` está aqui para portabilidade de dados, mas usar MySQL exige backend compatível com MySQL.
