@echo off
chcp 65001 >nul
echo ========================================================
echo  RESTAURANDO CODIGO E CONFIGURACOES DO BUSCAPRECO
echo ========================================================
echo.
cd /d "%~dp0..\.."

echo [1/6] Restaurando index.html...
copy /Y "backups\ultimo_backup_completo\codigo_e_configs\index.html" "index.html" >nul

echo [2/6] Restaurando robo.js...
copy /Y "backups\ultimo_backup_completo\codigo_e_configs\robo.js" "robo.js" >nul

echo [3/6] Restaurando netlify.toml e configs...
copy /Y "backups\ultimo_backup_completo\codigo_e_configs\netlify.toml" "netlify.toml" >nul
copy /Y "backups\ultimo_backup_completo\codigo_e_configs\package.json" "package.json" >nul
copy /Y "backups\ultimo_backup_completo\codigo_e_configs\.gitignore" ".gitignore" >nul
if exist "backups\ultimo_backup_completo\codigo_e_configs\icone.png" copy /Y "backups\ultimo_backup_completo\codigo_e_configs\icone.png" "icone.png" >nul

echo [4/6] Restaurando Workflows do GitHub Actions...
if not exist ".github\workflows" mkdir ".github\workflows"
copy /Y "backups\ultimo_backup_completo\codigo_e_configs\.github\workflows\*" ".github\workflows\" >nul

echo [5/6] Restaurando scripts (extrator-cloud.mjs e rotas-mercados.mjs)...
if not exist "scripts" mkdir "scripts"
copy /Y "backups\ultimo_backup_completo\codigo_e_configs\scripts\*" "scripts\" >nul

echo [6/6] Concluido com sucesso!
echo.
echo Codigo e configuracoes restaurados com sucesso.
pause