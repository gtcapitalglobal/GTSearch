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

echo [1/4] Parando servidor antigo (se estiver rodando)...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul
echo.

echo [2/4] Baixando atualizacoes do GitHub...
git pull origin main
if errorlevel 1 (
    echo.
    echo ERRO: Falha ao baixar atualizacoes!
    echo Verifique sua conexao com a internet
    echo.
    pause
    exit /b 1
)
echo.

echo [3/4] Verificando dependencias...
npm install
echo.

echo [4/4] Verificando arquivo .env...
if not exist ".env" (
    echo Criando arquivo .env...
    echo OFFLINE_MODE=true > .env
    echo PORT=3000 >> .env
    echo.
)

echo ========================================
echo Iniciando servidor em nova janela...
echo ========================================
echo.
echo O servidor vai abrir em uma janela separada.
echo Aguarde 5 segundos e o navegador abrira automaticamente.
echo.
echo Para parar o servidor: feche a janela do servidor
echo ========================================
echo.

REM Abrir servidor em nova janela que nao fecha
start "GTSearch Server" cmd /k "npm start"

REM Aguardar 5 segundos para servidor iniciar
echo Aguardando servidor iniciar...
timeout /t 5 /nobreak >nul

REM Abrir navegador
start http://localhost:3000

echo.
echo ========================================
echo Pronto! Sistema iniciado com sucesso!
echo ========================================
echo.
echo Servidor rodando em: http://localhost:3000
echo Janela do servidor: "GTSearch Server"
echo.
echo Pressione qualquer tecla para fechar esta janela...
pause >nul
