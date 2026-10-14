@echo off
set "SHOOT_ROOT=%~dp0"
start "" powershell.exe -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "%SHOOT_ROOT%local-server.ps1"
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:8767/index.html"
