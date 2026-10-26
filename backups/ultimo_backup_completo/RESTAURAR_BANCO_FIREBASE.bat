@echo off
chcp 65001 >nul
echo ========================================================
echo  RESTAURANDO BANCO DE DADOS FIREBASE (KOCH + FORT + VINCULOS)
echo ========================================================
echo.
echo ATENCAO: Esta acao enviara o backup completo para o seu Firebase.
echo Pressione qualquer tecla para continuar ou feche a janela para cancelar.
pause >nul

cd /d "%~dp0"

echo.
echo [1/4] Enviando koch_loja_1408.json para o Firebase...
curl.exe -k -s -X PUT "https://mercaro-e6035-default-rtdb.firebaseio.com/koch_loja_1408.json" --data-binary "@firebase_db\koch_loja_1408.json" -H "Content-Type: application/json"

echo.
echo [2/4] Enviando fort_loja_1644.json para o Firebase...
curl.exe -k -s -X PUT "https://mercaro-e6035-default-rtdb.firebaseio.com/fort_loja_1644.json" --data-binary "@firebase_db\fort_loja_1644.json" -H "Content-Type: application/json"

echo.
echo [3/4] Enviando vinculos_produtos.json para o Firebase...
curl.exe -k -s -X PUT "https://mercaro-e6035-default-rtdb.firebaseio.com/vinculos_produtos.json" --data-binary "@firebase_db\vinculos_produtos.json" -H "Content-Type: application/json"

echo.
echo [4/4] Enviando robo_controle.json para o Firebase...
curl.exe -k -s -X PUT "https://mercaro-e6035-default-rtdb.firebaseio.com/robo_controle.json" --data-binary "@firebase_db\robo_controle.json" -H "Content-Type: application/json"

echo.
echo ========================================================
echo  BANCO DO FIREBASE RESTAURADO COM SUCESSO!
echo ========================================================
pause