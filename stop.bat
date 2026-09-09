@echo off
title Stop SubSentry Server
cd /d "%~dp0"

echo Stopping SubSentry on port 8000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000" ^| findstr "LISTENING"') do (
    taskkill /f /pid %%a >nul 2>&1
    echo Terminated process PID: %%a
)
echo SubSentry server stopped.
timeout /t 2 >nul

