# How to Run KrishSathi Project

This guide will walk you through running the KrishSathi application step by step.

## 🚀 Quick Start (Recommended)

### Option 1: Using Docker (Easiest)

1. **Prerequisites Check**
   ```bash
   # Check if Docker is installed and running
   docker --version
   docker-compose --version
   ```

2. **Start All Services**
   ```bash
   # On Windows
   start.bat
   
   # On macOS/Linux
   ./start.sh
   ```

3. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080/api
   - Database Console: http://localhost:8080/api/h2-console

### Option 2: Manual Setup (Development)

## 📋 Prerequisites

Before running, ensure you have:

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Java 17+** - [Download here](https://adoptium.net/)
- **Maven 3.6+** - [Download here](https://maven.apache.org/download.cgi)
- **Firebase Project** - [Create here](https://console.firebase.google.com/)

## 🔧 Step-by-Step Setup

### Step 1: Clone and Navigate
```bash
# If not already done
cd "D:\sem 5\SIH"
```

### Step 2: Set Up Firebase (Required)

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Create a project"
   - Name it "krishsathi"
   - Enable Google Analytics (optional)

2. **Enable Services**
   - Go to **Firestore Database** → Create database → Start in test mode
   - Go to **Authentication** → Sign-in method → Enable Email/Password
   - Go to **Storage** → Get started → Start in test mode

3. **Get Configuration**
   - Go to Project Settings → General → Your apps
   - Click Web icon → Register app → Copy config

### Step 3: Configure Environment

1. **Copy Environment File**
   ```bash
   copy env.example .env
   ```

2. **Edit .env File**
   Open `.env` and fill in your Firebase configuration:
   ```env
   # Firebase Configuration (get from Firebase Console)
   FIREBASE_API_KEY=your_api_key_here
   FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   FIREBASE_PROJECT_ID=your_project_id_here
   FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
   FIREBASE_APP_ID=your_app_id_here
   FIREBASE_MEASUREMENT_ID=your_measurement_id_here
   FIREBASE_DATABASE_URL=https://your_project_id-default-rtdb.firebaseio.com/
   FIREBASE_ADMIN_SDK_PATH=./firebase-admin-key.json
   ```

3. **Create Frontend Environment**
   ```bash
   # Create frontend/.env file
   echo REACT_APP_FIREBASE_API_KEY=your_api_key_here > frontend/.env
   echo REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com >> frontend/.env
   echo REACT_APP_FIREBASE_PROJECT_ID=your_project_id_here >> frontend/.env
   echo REACT_APP_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com >> frontend/.env
   echo REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here >> frontend/.env
   echo REACT_APP_FIREBASE_APP_ID=your_app_id_here >> frontend/.env
   echo REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id_here >> frontend/.env
   echo REACT_APP_FIREBASE_DATABASE_URL=https://your_project_id-default-rtdb.firebaseio.com/ >> frontend/.env
   ```

### Step 4: Install Dependencies

```bash
# Install all dependencies
npm run install:all

# Or install individually:
# Frontend
cd frontend
npm install
cd ..

# Backend (Maven will handle this automatically)
```

### Step 5: Run the Application

#### Option A: Run Both Together
```bash
# Start both frontend and backend
npm run dev
```

#### Option B: Run Separately

**Terminal 1 - Backend:**
```bash
cd backend
./mvnw spring-boot:run
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

## 🌐 Access the Application

Once running, you can access:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080/api
- **API Health Check**: http://localhost:8080/api/actuator/health
- **Firebase Console**: https://console.firebase.google.com/

## 🔍 Verify Everything is Working

### 1. Check Frontend
- Open http://localhost:3000
- You should see the KrishSathi homepage
- Try changing languages
- Test voice input (if microphone is available)

### 2. Check Backend
- Open http://localhost:8080/api/actuator/health
- Should return: `{"status":"UP"}`

### 3. Check Firebase
- Go to Firebase Console
- Check Firestore Database for collections
- Check Authentication for users
- Check Storage for files

## 🐛 Troubleshooting

### Common Issues and Solutions

#### 1. Port Already in Use
```bash
# Kill processes using ports 3000 and 8080
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F

netstat -ano | findstr :8080
taskkill /PID <PID_NUMBER> /F

# macOS/Linux
lsof -ti:3000 | xargs kill -9
lsof -ti:8080 | xargs kill -9
```

#### 2. Node Modules Issues
```bash
# Clear cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
```

#### 3. Maven Issues
```bash
# Clean and rebuild
cd backend
./mvnw clean install -U
```

#### 4. Firebase Connection Issues
- Check your `.env` files
- Verify Firebase project is active
- Check Firebase Console for errors
- Ensure all services are enabled

#### 5. Java Version Issues
```bash
# Check Java version
java -version

# Should be Java 17 or higher
# If not, install Java 17 from https://adoptium.net/
```

## 📱 Testing the Application

### 1. Test Multi-language Support
- Click the language selector (top-right)
- Try English, Hindi, Malayalam, Marathi
- Verify UI text changes

### 2. Test Voice Input
- Go to Query page
- Click and hold the microphone button
- Speak in any supported language
- Check if text appears

### 3. Test Image Upload
- Go to Upload page
- Drag and drop an image
- Check if upload process starts

### 4. Test Weather
- Go to Weather page
- Check if weather data loads

## 🚀 Production Deployment

### Using Docker
```bash
# Build and run with Docker Compose
docker-compose up --build -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### Manual Deployment
1. Build frontend: `cd frontend && npm run build`
2. Build backend: `cd backend && ./mvnw clean package`
3. Deploy to your preferred hosting platform

## 📞 Getting Help

If you encounter issues:

1. **Check Logs**
   - Frontend: Browser console (F12)
   - Backend: Terminal output
   - Docker: `docker-compose logs -f`

2. **Verify Configuration**
   - Check `.env` files
   - Verify Firebase setup
   - Check port availability

3. **Common Solutions**
   - Restart the application
   - Clear browser cache
   - Check network connectivity
   - Verify all prerequisites

## 🎉 Success!

If everything is working correctly, you should see:
- KrishSathi homepage with multi-language support
- Working navigation between pages
- Voice input functionality
- Image upload interface
- Weather information display
- Backend API responding to requests

**Happy farming with KrishSathi! 🌾🤖**
