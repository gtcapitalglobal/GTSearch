@echo off
title GTSearch - Atualizacao

REM Verificar se esta na pasta correta
if not exist "package.json" (
    echo ERRO: package.json nao encontrado!
    echo Execute este arquivo dentro da pasta GTSearch
    pause
    exit /b 1
)

echo ========================================
echo GTSearch - Atualizacao Automatica
echo ========================================
echo.

echo [1/4] Parando servidor antigo...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul
echo.

echo [2/4] Baixando atualizacoes do GitHub...
git pull origin main
if errorlevel 1 (
    echo.
    echo ERRO: Falha ao baixar atualizacoes!
    pause
    exit /b 1
)
echo.

echo [3/4] Verificando dependencias...
call npm install
echo.

echo [4/4] Verificando arquivo .env...
if not exist ".env" (
    echo Criando arquivo .env...
    echo OFFLINE_MODE=true > .env
    echo PORT=3000 >> .env
)
echo.

echo ========================================
echo Iniciando servidor...
echo ========================================
echo.

REM Abrir navegador apos 5 segundos
start /B cmd /c "timeout /t 5 /nobreak >nul && start http://localhost:3000"

REM Iniciar servidor
npm start

REM Se chegar aqui, servidor parou
echo.
echo ========================================
echo Servidor parou!
echo ========================================
pause
