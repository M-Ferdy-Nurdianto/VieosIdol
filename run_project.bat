@echo off
title Running VIEOS Project
echo Starting Server...
start cmd /k "cd /d %~dp0server && npm run dev"
echo Starting Client...
start cmd /k "cd /d %~dp0client && npm run dev"

echo Menunggu Vite berjalan...
timeout /t 5 /nobreak > NUL

echo Membuka browser (Halaman User dan Admin)...
start http://localhost:5173
start http://localhost:5173/admin

echo Project is starting in separate windows and browser.
pause
