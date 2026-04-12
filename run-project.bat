@echo off
echo 🌾 Starting KrishSathi - AI Agricultural Assistant
echo ==================================================

echo.
echo Step 1: Installing dependencies...
echo.

echo Installing root dependencies...
call npm install

echo Installing frontend dependencies...
cd frontend
call npm install --legacy-peer-deps
cd ..

echo.
echo Step 2: Starting services...
echo.

echo Starting Backend (Spring Boot)...
start "Backend" cmd /k "cd backend && mvnw.cmd spring-boot:run"

echo Waiting 5 seconds for backend to start...
timeout /t 5 /nobreak >nul

echo Starting Frontend (React)...
start "Frontend" cmd /k "cd frontend && npm start"

echo.
echo 🎉 KrishSathi is starting up!
echo.
echo 📱 Frontend will open at: http://localhost:3000
echo 🔧 Backend API will be at: http://localhost:8080/api
echo.
echo Check the opened command windows for logs.
echo Close the command windows to stop the services.
echo.
pause
