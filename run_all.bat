@echo off
title FinSentry AI - Startup Launcher
echo ========================================================
echo               Starting FinSentry AI
echo ========================================================
echo.

echo Starting Backend Server on port 8000...
start "FinSentry AI - Backend" cmd /k "cd /d %~dp0backend && .\venv\Scripts\activate && python -m uvicorn app.main:app --reload --port 8000"

timeout /t 3 /nobreak >nul

echo Starting Frontend Server on port 3000...
start "FinSentry AI - Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

timeout /t 4 /nobreak >nul

echo Opening browser at http://localhost:3000 ...
start http://localhost:3000

echo.
echo ========================================================
echo  FinSentry AI is now running!
echo  Backend:  http://localhost:8000/docs
echo  Frontend: http://localhost:3000
echo ========================================================
echo.
pause
