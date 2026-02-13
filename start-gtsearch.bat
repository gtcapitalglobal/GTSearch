@echo off
echo ========================================
echo GTSearch - Property Manager
echo ========================================
echo.

REM Verificar se esta na pasta correta
if not exist "package.json" (
    echo ERRO: package.json nao encontrado!
    echo Execute este arquivo dentro da pasta GTSearch
    pause
    exit /b 1
)

REM Verificar se node_modules existe
if not exist "node_modules" (
    echo Instalando dependencias...
    call npm install
    echo.
)

REM Verificar se .env existe
if not exist ".env" (
    echo Criando arquivo .env...
    echo OFFLINE_MODE=true > .env
    echo PORT=3000 >> .env
    echo.
)

echo Iniciando servidor...
echo.
echo Acesse: http://localhost:3000
echo.
echo Pressione Ctrl+C para parar o servidor
echo ========================================
echo.

npm start
