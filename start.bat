@echo off
cd /d c:\Users\w103354\devoxx2026
REM Installer npm packages
echo Installing dependencies...
call npm install
REM Lancer le serveur dev
echo Starting dev server...
call npm run dev
