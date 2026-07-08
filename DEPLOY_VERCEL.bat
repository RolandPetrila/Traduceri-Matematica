@echo off
REM ============================================================================
REM  DEPLOY_VERCEL.bat  —  dublu-click pentru a deploya v4 pe Vercel (2 proiecte)
REM  Ruleaza scripts\deploy-all-vercel.ps1. Singurul pas manual: `vercel login`
REM  + confirmarile la `vercel link` (raspunzi in fereastra).
REM  Cheile se citesc din Windows env vars si NU se afiseaza.
REM ============================================================================
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\deploy-all-vercel.ps1"
echo.
echo ============================================================
echo  Terminat. Daca a aparut vreo eroare, copiaza tot textul
echo  de mai sus si trimite-l lui Claude ca sa te ajute.
echo ============================================================
pause
