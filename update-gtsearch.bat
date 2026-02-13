@echo off
echo ========================================
echo GTSearch - Atualizacao Automatica
echo ========================================
echo.

REM Verificar se esta na pasta correta
if not exist "package.json" (
    echo ERRO: package.json nao encontrado!
    echo Execute este arquivo dentro da pasta GTSearch
    pause
    exit /b 1
)

echo [1/5] Parando servidor antigo (se estiver rodando)...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul
echo.

echo [2/5] Baixando atualizacoes do GitHub...
git pull origin main
if errorlevel 1 (
    echo ERRO: Falha ao baixar atualizacoes!
    echo Verifique sua conexao com a internet
    pause
    exit /b 1
)
echo.

echo [3/5] Verificando dependencias...
npm install
echo.

echo [4/5] Verificando arquivo .env...
if not exist ".env" (
    echo Criando arquivo .env...
    echo OFFLINE_MODE=true > .env
    echo PORT=3000 >> .env
    echo.
)

echo [5/5] Iniciando servidor...
echo.
echo ========================================
echo Servidor iniciado com sucesso!
echo Acesse: http://localhost:3000
echo.
echo Pressione Ctrl+C para parar o servidor
echo ========================================
echo.

REM Abrir navegador automaticamente
start http://localhost:3000

REM Iniciar servidor
npm start
