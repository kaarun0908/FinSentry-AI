@echo off
title FinSentry AI Launcher

echo ========================================================
echo               FinSentry AI Launcher
echo ========================================================
echo.

REM 1. Check & Setup Backend
cd /d "%~dp0backend"
if exist "venv" goto check_uvicorn

echo [SETUP] Creating Python virtual environment...
python -m venv venv
if errorlevel 1 goto python_error

echo [SETUP] Installing backend dependencies...
call .\venv\Scripts\activate.bat
pip install -r requirements.txt
goto check_frontend

:check_uvicorn
if exist "venv\Scripts\uvicorn.exe" goto check_frontend
echo [SETUP] Installing backend dependencies...
call .\venv\Scripts\activate.bat
pip install -r requirements.txt

:check_frontend
REM 2. Check & Setup Frontend
cd /d "%~dp0frontend"
if exist "node_modules" goto start_servers

echo.
echo [SETUP] Installing frontend packages (npm install)...
call npm install
if errorlevel 1 goto npm_error

:start_servers
echo.
echo ========================================================
echo  All dependencies ready! Starting servers...
echo ========================================================
echo.

REM 3. Launch Backend in new window
echo Starting Backend Server (Port 8000)...
start "FinSentry Backend" cmd /k "cd /d "%~dp0backend" && call .\venv\Scripts\activate.bat && python -m uvicorn app.main:app --reload --port 8000"

REM 4. Launch Frontend in new window
echo Starting Frontend Server (Port 3000)...
start "FinSentry Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

REM 5. Open Browser
echo Opening http://localhost:3000 in your browser...
start http://localhost:3000

echo.
echo ========================================================
echo  FinSentry AI is now running!
echo  Backend Docs: http://localhost:8000/docs
echo  Frontend UI:  http://localhost:3000
echo ========================================================
echo.
pause
exit /b 0

:python_error
echo.
echo [ERROR] Python is not installed or not in PATH.
echo Please install Python 3.10+ from python.org with 'Add Python to PATH' checked.
pause
exit /b 1

:npm_error
echo.
echo [ERROR] npm install failed. Please ensure Node.js is installed from nodejs.org.
pause
exit /b 1
