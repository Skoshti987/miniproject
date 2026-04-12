@echo off
echo 🌾 Starting KrishSathi - AI Agricultural Assistant
echo ==================================================

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker first.
    pause
    exit /b 1
)

REM Create necessary directories
if not exist logs mkdir logs
if not exist data\postgres mkdir data\postgres
if not exist data\redis mkdir data\redis

REM Set environment variables
set COMPOSE_PROJECT_NAME=krishsathi
set NODE_ENV=development

echo 📦 Building and starting services...
docker-compose up --build -d

echo ⏳ Waiting for services to be ready...
timeout /t 10 /nobreak >nul

echo 🔍 Checking service status...

REM Check if services are running
docker-compose ps

echo.
echo 🎉 KrishSathi is starting up!
echo.
echo 📱 Frontend: http://localhost:3000
echo 🔧 Backend API: http://localhost:8080/api
echo 🗄️  Database Console: http://localhost:8080/api/h2-console
echo.
echo 📊 To view logs: docker-compose logs -f
echo 🛑 To stop: docker-compose down
echo.
echo Happy farming! 🌱
pause
