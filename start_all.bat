@echo off
echo ==============================================
echo   Starting KrishSathi Agricultural Assistant
echo ==============================================

echo [1/3] Starting ML Inference Service (Port 5001)...
start "KrishSathi ML Service (Port 5001)" cmd /k "cd /d %~dp0ml-service && py -3.11 -m uvicorn app:app --port 5001 --reload"

echo [2/3] Starting Node.js Backend Server (Port 5000)...
start "KrishSathi Backend (Port 5000)" cmd /k "cd /d %~dp0backend && node server.js"

echo [3/3] Starting React Frontend PWA (Port 3000)...
start "KrishSathi Frontend (Port 3000)" cmd /k "cd /d %~dp0frontend && npm start"

echo.
echo All 3 services have been launched in separate windows!
echo Access the application at: http://localhost:3000
echo ==============================================

