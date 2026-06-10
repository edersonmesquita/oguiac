# oguiac

Repositorio local conectado ao GitHub:

- Remote: `https://github.com/edersonmesquita/oguiac.git`
- Branch principal: `main`

Deploy automatico:

- Workflow: `.github/workflows/deploy-webroot.yml`
- Origem publicada: `deploy-webroot/`
- Gatilho: `push` na branch `main`

SQL do site:

- Arquivo de migracao MySQL adicionado em `deploy-webroot/migrar_dados.sql`
- Uso esperado: importar esse arquivo no banco MySQL do site depois da estrutura base

Para ativar o deploy no GitHub Actions, cadastre estes secrets no repositorio:

- `FTP_SERVER`
- `FTP_USERNAME`
- `FTP_PASSWORD`
- `FTP_SERVER_DIR`
- `FTP_PROTOCOL` opcional, ex.: `ftp` ou `ftps`
- `FTP_PORT` opcional, ex.: `21` ou `990`

Depois disso, qualquer alteracao enviada para `main` dentro de `deploy-webroot/` sera publicada automaticamente no servidor.
