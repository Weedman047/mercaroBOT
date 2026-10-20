@echo off
chcp 65001 >nul
echo ========================================================
echo  RESTAURANDO BANCO DE DADOS FIREBASE PARA O ESTADO V10
echo ========================================================
echo.
echo ATENCAO: Esta acao enviara o arquivo de backup para o Firebase.
echo Pressione qualquer tecla para continuar ou feche a janela para cancelar.
pause >nul

cd /d "%~dp0"

echo.
echo [1/2] Enviando koch_loja_1408.json para o Firebase...
curl.exe -k -X PUT "https://mercaro-e6035-default-rtdb.firebaseio.com/koch_loja_1408.json" --data-binary "@firebase_db\koch_loja_1408.json" -H "Content-Type: application/json"

echo.
echo [2/2] Enviando robo_controle.json para o Firebase...
curl.exe -k -X PUT "https://mercaro-e6035-default-rtdb.firebaseio.com/robo_controle.json" --data-binary "@firebase_db\robo_controle.json" -H "Content-Type: application/json"

echo.
echo ========================================================
echo  BANCO DO FIREBASE RESTAURADO COM SUCESSO!
echo ========================================================
pause
