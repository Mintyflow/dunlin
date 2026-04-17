@echo off
:: ============================================================
::  Dunlin Auto-Deploy
::  Double-click to push ALL changes live to getdunlin.com
:: ============================================================

cd /d "%~dp0"

:: Silence CRLF warnings (harmless on Windows but noisy)
git config core.autocrlf true 2>nul

:: Stop tracking .gemini cache files if they snuck in
git rm -r --cached .gemini 2>nul
git rm -r --cached .cursor 2>nul

echo.
echo  ==========================================
echo   DUNLIN AUTO-DEPLOY
echo  ==========================================
echo.

:: Check if there's anything to commit
git status --porcelain > "%TEMP%\dunlin_status.txt" 2>&1
for %%A in ("%TEMP%\dunlin_status.txt") do set SIZE=%%~zA
if %SIZE%==0 (
    echo  No changes detected. Nothing to deploy.
    echo.
    pause
    exit /b
)

:: Show what's changed
echo  Changes detected:
git status --short
echo.

:: Auto-generate commit message with date and time
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set DT=%%I
set MSG=Deploy %DT:~0,4%-%DT:~4,2%-%DT:~6,2% %DT:~8,2%:%DT:~10,2%

echo  Committing: "%MSG%"
echo.

git add -A
git commit -m "%MSG%" 2>&1 | findstr /v "LF will be replaced"
git push

echo.
echo  ==========================================
echo   LIVE at https://getdunlin.com
echo   (Netlify deploys in ~1-2 minutes)
echo  ==========================================
echo.
pause
