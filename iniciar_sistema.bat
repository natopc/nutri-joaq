@echo off
title Sistema Nutri Joaq
color 0A

echo ========================================================
echo                 SISTEMA NUTRI JOAQ
echo ========================================================
echo.

:: Navega para o diretorio onde o arquivo .bat esta localizado
cd /d "%~dp0"

:: Verifica se o node_modules ja existe para pular a instalacao
if not exist "node_modules\" (
    echo [INFO] Primeira inicializacao detectada.
    echo [INFO] Instalando dependencias necessarias... (Isso pode demorar alguns minutos)
    call npm install
    echo.
)

echo [INFO] Iniciando o servidor local...
echo [INFO] O seu navegador vai abrir automaticamente.
echo [AVISO] Para fechar o sistema, basta fechar esta janela preta.
echo.
echo ========================================================

:: Inicia o Vite e abre o navegador
call npm run dev -- --open
