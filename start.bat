@echo off
title SubSentry Server
cd /d "%~dp0"

echo ===================================================
echo           Starting SubSentry Server...
echo ===================================================

:: Check if virtual environment exists
if not exist ".venv\Scripts\python.exe" (
    echo Error: .venv not found. Please setup virtual environment first.
    pause
    exit /b 1
)

:: Open browser automatically after a short delay in background
start "" cmd /c "timeout /t 2 /nobreak >nul && start http://127.0.0.1:8000"

:: Start Uvicorn backend server
.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000

