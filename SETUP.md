# KrishSathi Setup Guide

This guide will help you set up and run the KrishSathi application on your local machine.

## Prerequisites

Before starting, ensure you have the following installed:

### Required Software
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Java 17+** - [Download here](https://adoptium.net/)
- **Maven 3.6+** - [Download here](https://maven.apache.org/download.cgi)
- **Docker Desktop** - [Download here](https://www.docker.com/products/docker-desktop/)
- **Git** - [Download here](https://git-scm.com/)

### Optional (for development)
- **VS Code** with extensions:
  - ES7+ React/Redux/React-Native snippets
  - Tailwind CSS IntelliSense
  - Spring Boot Extension Pack
  - Docker

## Quick Start (Recommended)

### Option 1: Using Docker (Easiest)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd krishsathi
   ```

2. **Start all services**
   ```bash
   # On Windows
   start.bat
   
   # On macOS/Linux
   ./start.sh
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080/api
   - Database Console: http://localhost:8080/api/h2-console

### Option 2: Manual Setup

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd krishsathi
   npm run install:all
   ```

2. **Start services individually**
   ```bash
   # Terminal 1 - Backend
   cd backend
   ./mvnw spring-boot:run
   
   # Terminal 2 - Frontend
   cd frontend
   npm start
   ```

## Detailed Setup

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   ./mvnw clean install
   ```

3. **Configure database** (if not using Docker)
   - Install PostgreSQL 13+
   - Create database: `krishsathi`
   - Update `application.yml` with your database credentials

4. **Run the application**
   ```bash
   ./mvnw spring-boot:run
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm start
   ```

4. **Access the application**
   - Open http://localhost:3000 in your browser

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=jdbc:postgresql://localhost:5432/krishsathi
DATABASE_USERNAME=krishsathi
DATABASE_PASSWORD=krishsathi123

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# External APIs
WEATHER_API_KEY=your_weather_api_key
OPENAI_API_KEY=your_openai_api_key

# Application
NODE_ENV=development
REACT_APP_API_URL=http://localhost:8080/api
```

### Database Configuration

The application uses PostgreSQL as the primary database. For development, you can also use H2 (in-memory database).

**PostgreSQL Setup:**
1. Install PostgreSQL 13+
2. Create database: `CREATE DATABASE krishsathi;`
3. Update `backend/src/main/resources/application.yml`

**H2 Database (Development):**
- No additional setup required
- Access console at: http://localhost:8080/api/h2-console
- JDBC URL: `jdbc:h2:mem:testdb`
- Username: `sa`
- Password: `password`

## Features Overview

### 🌾 Core Features
- **Multi-language Support**: English, Hindi, Malayalam, Marathi
- **Voice Input**: Speech-to-text in multiple languages
- **Image Analysis**: Plant disease detection (coming soon)
- **Weather Integration**: Real-time weather data
- **Expert Escalation**: Complex queries escalated to officers

### 📱 PWA Features
- **Installable**: Add to home screen on mobile devices
- **Offline Support**: Basic functionality without internet
- **Push Notifications**: Weather alerts and advisories
- **Responsive Design**: Works on all device sizes

## Development

### Project Structure
```
krishsathi/
├── frontend/          # React PWA
│   ├── public/       # Static assets
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/      # Page components
│   │   ├── i18n/       # Internationalization
│   │   └── App.js      # Main app
│   └── package.json
├── backend/           # Spring Boot API
│   ├── src/main/java/com/krishsathi/
│   │   ├── controller/  # REST controllers
│   │   ├── service/     # Business logic
│   │   ├── model/       # Data models
│   │   └── config/      # Configuration
│   └── pom.xml
└── docker-compose.yml # Docker setup
```

### Available Scripts

**Frontend:**
```bash
npm start          # Start development server
npm run build      # Build for production
npm test           # Run tests
npm run dev        # Start with hot reload
```

**Backend:**
```bash
./mvnw spring-boot:run    # Start application
./mvnw test              # Run tests
./mvnw clean package     # Build JAR
```

**Docker:**
```bash
docker-compose up          # Start all services
docker-compose down        # Stop all services
docker-compose logs -f     # View logs
docker-compose build      # Rebuild images
```

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Kill process using port 3000
   npx kill-port 3000
   
   # Kill process using port 8080
   npx kill-port 8080
   ```

2. **Docker not starting**
   - Ensure Docker Desktop is running
   - Check if virtualization is enabled
   - Restart Docker Desktop

3. **Database connection issues**
   - Check if PostgreSQL is running
   - Verify database credentials
   - Check firewall settings

4. **Node modules issues**
   ```bash
   # Clear npm cache
   npm cache clean --force
   
   # Delete node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

5. **Maven build issues**
   ```bash
   # Clean and rebuild
   ./mvnw clean install -U
   
   # Skip tests
   ./mvnw clean install -DskipTests
   ```

### Getting Help

- Check the logs: `docker-compose logs -f`
- Verify service status: `docker-compose ps`
- Check API health: http://localhost:8080/api/actuator/health
- Frontend console: Open browser dev tools

## Production Deployment

### Docker Production
```bash
# Build production images
docker-compose -f docker-compose.prod.yml up --build

# Use production environment
export NODE_ENV=production
docker-compose up
```

### Manual Production
1. Build frontend: `npm run build`
2. Build backend: `./mvnw clean package`
3. Deploy to your preferred hosting platform

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues and questions:
- Create an issue on GitHub
- Check the documentation
- Contact the development team

---

**Happy farming with KrishSathi! 🌾🤖**
