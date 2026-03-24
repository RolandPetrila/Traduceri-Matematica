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
echo  [1/5] Oprire procese vechi...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM python.exe >nul 2>&1
timeout /t 2 /nobreak >nul
echo        OK

REM --- 2. Curatare cache ---
echo  [2/5] Curatare cache...
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
echo  [3/5] Verificare dependinte...
if not exist "frontend\node_modules\next" (
    echo        Instalare npm...
    pushd frontend
    call npm install
    popd
)
python -c "import pypdf, docx, PIL, markdown, fpdf" >nul 2>&1
if !ERRORLEVEL! NEQ 0 (
    echo        Instalare dependinte Python...
    pip install -r api/requirements.txt
)
echo        OK

REM --- 4. Pornire Python API server (background) ---
echo  [4/5] Pornire Python API server pe port 8000...
start /min "Python API Server" cmd /c "cd /d %~dp0 && python dev_server.py"
timeout /t 2 /nobreak >nul
echo        OK

REM --- 5. Pornire Next.js dev server ---
echo  [5/5] Pornire Next.js dev server...
echo.

REM Deschide browser automat dupa 10 secunde
start /min "" cmd /c "timeout /t 10 /nobreak >nul & start http://localhost:3000 & exit"

echo  ================================================
echo   Frontend:  http://localhost:3000
echo   API:       http://localhost:8000
echo   Loguri:    data/logs/local_debug.log
echo.
echo   Traduceri, conversii, health - TOATE MERG LOCAL
echo   Oprire: Ctrl+C (apoi inchide fereastra Python)
echo  ================================================
echo.

cd frontend
npm run dev

pause
