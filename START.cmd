@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 22.18 or newer is required.
  pause
  exit /b 1
)
echo Open http://127.0.0.1:4173 in your browser.
node scripts\serve-dist.mjs
pause
