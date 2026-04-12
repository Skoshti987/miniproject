# KrishSathi Startup Script for PowerShell
Write-Host "🌾 Starting KrishSathi - AI Agricultural Assistant" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check if Java is installed
try {
    $javaVersion = java -version 2>&1 | Select-String "version"
    Write-Host "✅ Java version: $javaVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Java is not installed. Please install Java 17+ from https://adoptium.net/" -ForegroundColor Red
    exit 1
}

# Check if .env file exists
if (Test-Path ".env") {
    Write-Host "✅ Environment file found" -ForegroundColor Green
} else {
    Write-Host "⚠️  Environment file not found. Creating from template..." -ForegroundColor Yellow
    Copy-Item "env.example" ".env"
    Write-Host "📝 Please edit .env file with your Firebase configuration" -ForegroundColor Yellow
}

# Check if frontend .env exists
if (Test-Path "frontend\.env") {
    Write-Host "✅ Frontend environment file found" -ForegroundColor Green
} else {
    Write-Host "⚠️  Frontend environment file not found. Creating..." -ForegroundColor Yellow
    @"
REACT_APP_FIREBASE_API_KEY=your_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id_here
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
REACT_APP_FIREBASE_APP_ID=your_app_id_here
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id_here
REACT_APP_FIREBASE_DATABASE_URL=https://your_project_id-default-rtdb.firebaseio.com/
"@ | Out-File -FilePath "frontend\.env" -Encoding UTF8
    Write-Host "📝 Please edit frontend\.env file with your Firebase configuration" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🚀 Starting services..." -ForegroundColor Cyan

# Start backend in background
Write-Host "🔧 Starting Backend (Spring Boot)..." -ForegroundColor Yellow
if (Test-Path "$PWD\backend\mvnw.cmd") {
    Start-Process -FilePath "powershell" -ArgumentList "-Command", "cd '$PWD\backend'; .\mvnw.cmd spring-boot:run" -WindowStyle Minimized
} elseif (Get-Command mvn -ErrorAction SilentlyContinue) {
    Start-Process -FilePath "powershell" -ArgumentList "-Command", "cd '$PWD\backend'; mvn spring-boot:run" -WindowStyle Minimized
} else {
    Write-Host "❌ Maven not found. Please install Maven or add it to PATH." -ForegroundColor Red
}

# Wait a moment for backend to start
Start-Sleep -Seconds 5

# Start frontend in background
Write-Host "📱 Starting Frontend (React)..." -ForegroundColor Yellow
Start-Process -FilePath "powershell" -ArgumentList "-Command", "cd '$PWD\frontend'; npm start" -WindowStyle Minimized

Write-Host ""
Write-Host "⏳ Waiting for services to start..." -ForegroundColor Cyan
Start-Sleep -Seconds 10

Write-Host ""
Write-Host "🎉 KrishSathi is starting up!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔧 Backend API: http://localhost:8080/api" -ForegroundColor Cyan
Write-Host "🗄️  Database Console: http://localhost:8080/api/h2-console" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 To view logs, check the PowerShell windows that opened" -ForegroundColor Yellow
Write-Host "🛑 To stop, close the PowerShell windows or press Ctrl+C" -ForegroundColor Yellow
Write-Host ""
Write-Host "Happy farming! 🌱" -ForegroundColor Green

# Keep script running
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
