@echo off
title Cyber IDS — Starting...
cd /d "%~dp0"

echo.
echo  ==========================================
echo   Cyber IDS — Starting All Services
echo  ==========================================
echo.

REM ── 1. Install backend deps if needed ──────────────────────────────────────
echo  [1/3] Checking backend dependencies...
.venv\Scripts\python.exe -m pip install -r backend\requirements.txt -q 2>nul

REM ── 2. Start backend (MUST cd into backend folder first) ─────────────────
echo  [2/3] Starting Backend (FastAPI on :8000)...
start "Cyber IDS — Backend" cmd /k "cd /d %~dp0backend && ..\.venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000"

REM ── 3. Start frontend ────────────────────────────────────────────────────
echo  [3/3] Starting Frontend (Next.js on :3000)...
start "Cyber IDS — Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

REM ── 4. Open browser after a delay ────────────────────────────────────────
echo.
echo  Waiting for servers to start (8 seconds)...
timeout /t 8 /nobreak > nul
start http://localhost:3000

echo.
echo  ==========================================
echo   All services started!
echo   Backend  : http://localhost:8000/docs
echo   Frontend : http://localhost:3000
echo  ==========================================
echo.
pause
