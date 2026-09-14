@echo off
title FinSentry AI - Backend (Port 8000)
cd /d "%~dp0backend"
call .\venv\Scripts\activate
python -m uvicorn app.main:app --reload --port 8000
pause
