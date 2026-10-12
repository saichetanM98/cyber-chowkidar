@echo off
title Adaptive Security Gateway Launcher

cd /d "%~dp0"

echo =====================================================================
echo           Adaptive Security Gateway & ML Detector Launcher
echo =====================================================================
echo.

:: 1. Initialize .env if missing
if not exist ".env" (
    if exist ".env.example" (
        echo [*] Initializing .env from .env.example...
        copy ".env.example" ".env" >nul
    )
)

:: 2. Identify Python executable
set "PY_EXE="
if exist "%~dp0venv\Scripts\python.exe" (
    set "PY_EXE=%~dp0venv\Scripts\python.exe"
    echo [OK] Detected Virtual Environment: venv\
) else if exist "%~dp0.venv\Scripts\python.exe" (
    set "PY_EXE=%~dp0.venv\Scripts\python.exe"
    echo [OK] Detected Virtual Environment: .venv\
) else (
    set "PY_EXE=python"
    echo [!] Using system Python.
)

:: 3. Identify npm
set "NPM_CMD=npm.cmd"
where %NPM_CMD% >nul 2>nul
if errorlevel 1 (
    set "NPM_CMD=npm"
)

echo.
echo [*] Launching Services in background windows...
echo ---------------------------------------------------------------------

:: 5. Launch Backend Gateway (Port 5000)
start "Adaptive Security Gateway - Backend" cmd /k "cd /d %~dp0 && set PYTHONPATH=%~dp0 && echo Starting Flask Backend on port 5000... && "%PY_EXE%" -m gateway.app"
echo [OK] Backend API window started.

:: Small delay to allow port 5000 binding
ping 127.0.0.1 -n 3 >nul

:: 6. Launch Frontend Dashboard (Port 5173)
start "SOC Dashboard - Frontend" cmd /k "cd /d %~dp0dashboard && echo Starting Vite Dev Server on port 5173... && %NPM_CMD% run dev"
echo [OK] Frontend Dashboard window started.

echo ---------------------------------------------------------------------
echo.
echo [*] All services launched!
echo     - API Health Endpoint : http://localhost:5000/health
echo     - SOC Dashboard UI    : http://localhost:5173
echo.
echo Opening Dashboard in browser...
start http://localhost:5173

echo.
echo Keep this window open or press any key to close this launcher.
echo (The two service windows will remain running in the background.)
echo =====================================================================
pause
