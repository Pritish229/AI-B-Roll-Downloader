@echo off
title AI B-Roll Downloader - Desktop Launcher
color 0A

:: Ensure working directory is set to the project folder
cd /d "%~dp0"

echo =========================================================
echo       LAUNCHING AI B-ROLL DOWNLOADER DESKTOP APP
echo =========================================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% equ 0 (
    for /f "tokens=*" %%v in ('node -v') do set NODE_VER=%%v
    echo [OK] Node.js Status: INSTALLED (Version %NODE_VER%)
    echo.
) else (
    echo [!] Node.js Status: NOT INSTALLED
    echo [!] Automatically downloading and launching Node.js installer...
    echo.
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-desktop.ps1"
    exit /b
)

:: Check if node_modules exist
if not exist "node_modules" (
    echo [!] First-time setup detected. Installing dependencies...
    call npm install
)

echo [1/3] Starting backend & frontend services...
start /min "AI-BRoll-Server" cmd /c "cd /d "%~dp0" && npm run dev"

echo [2/3] Waiting for application server to initialize...
timeout /t 5 /nobreak > nul

echo [3/3] Launching Desktop Window...

:: Check Microsoft Edge
where msedge >nul 2>nul
if %errorlevel% equ 0 (
    start msedge --app=http://localhost:3000 --window-size=1280,850 --user-data-dir="%LOCALAPPDATA%\AI-BRoll-Downloader-Profile"
    goto :done
)

:: Check Google Chrome
where chrome >nul 2>nul
if %errorlevel% equ 0 (
    start chrome --app=http://localhost:3000 --window-size=1280,850 --user-data-dir="%LOCALAPPDATA%\AI-BRoll-Downloader-Profile"
    goto :done
)

:: Fallback default browser launch
start http://localhost:3000

:done
echo.
echo =========================================================
echo  Desktop Application Active at http://localhost:3000
echo =========================================================
