@echo off
setlocal EnableDelayedExpansion
title Traduceri Matematica - Dev Local
cd /d "%~dp0"

echo.
echo  ================================================
echo   Traduceri Matematica - Pornire Mediu Local
echo  ================================================
echo.

REM --- 1. Oprire procese vechi ---
echo  [1/4] Oprire procese vechi (node, vercel)...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM vercel.exe >nul 2>&1
timeout /t 2 /nobreak >nul
echo        OK

REM --- 2. Curatare cache ---
echo  [2/4] Curatare cache...
if exist "frontend\.next" (
    rmdir /s /q "frontend\.next" >nul 2>&1
    echo        .next - sters
)
if exist "frontend\node_modules\.cache" (
    rmdir /s /q "frontend\node_modules\.cache" >nul 2>&1
    echo        node_modules/.cache - sters
)
if exist "api\__pycache__" (
    rmdir /s /q "api\__pycache__" >nul 2>&1
    echo        api/__pycache__ - sters
)
if exist "data\logs\local_debug.log" (
    del "data\logs\local_debug.log" >nul 2>&1
    echo        local_debug.log - resetat
)
echo        OK

REM --- 3. Verificare dependinte ---
echo  [3/4] Verificare dependinte...
if not exist "frontend\node_modules\next" (
    echo        Instalare npm...
    pushd frontend
    call npm install
    popd
)
echo        OK

REM --- 4. Pornire server ---
echo  [4/4] Pornire server...
echo.
echo  ================================================
echo   Server:  http://localhost:3000
echo   Mod:     Vercel Dev (Next.js + Python API)
echo   Loguri:  data/logs/local_debug.log
echo   Oprire:  Ctrl+C
echo  ================================================
echo.

REM Deschide browser automat dupa 12 secunde
start /min "" cmd /c "timeout /t 12 /nobreak >nul & start http://localhost:3000 & exit"

vercel dev --listen 3000

if !ERRORLEVEL! NEQ 0 (
    echo.
    echo  [!] Vercel dev a esuat. Pornire cu npm run dev...
    echo.
    cd frontend
    npm run dev
)

pause
