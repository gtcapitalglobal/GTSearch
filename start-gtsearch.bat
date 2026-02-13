@echo off
title GTSearch Server

REM Verificar se esta na pasta correta
if not exist "package.json" (
    echo ERRO: package.json nao encontrado!
    echo Execute este arquivo dentro da pasta GTSearch
    pause
    exit /b 1
)

echo ========================================
echo GTSearch - Property Manager
echo ========================================
echo.
echo Iniciando servidor...
echo.

REM Matar processos Node.js antigos
taskkill /F /IM node.exe 2>nul

REM Aguardar 2 segundos
timeout /t 2 /nobreak >nul

REM Verificar se .env existe
if not exist ".env" (
    echo Criando arquivo .env...
    echo OFFLINE_MODE=true > .env
    echo PORT=3000 >> .env
    echo.
)

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
