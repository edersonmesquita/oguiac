@echo off
setlocal

echo Iniciando backend e frontend do Guia Caninde...

start "GCAN Backend" cmd /k "cd /d C:\xampp\htdocs\gcan\backendGuiaCanind--main && npm.cmd run dev"
start "GCAN Frontend" cmd /k "cd /d C:\xampp\htdocs\gcan\frontEndGuiaCaninde-main && npm.cmd run dev"

echo.
echo Backend esperado em: http://localhost:3333/health
echo Frontend esperado em: http://localhost:3000
echo.
echo Aguarde alguns segundos e acesse no navegador.

endlocal
