# KrishSathi - AI Agricultural Assistant

KrishSathi is a mobile-first Progressive Web Application (PWA) that provides AI-powered agricultural assistance to farmers in multiple Indian languages (English, Hindi, Malayalam, Marathi). The application combines voice/text input, image analysis, weather integration, and expert escalation to provide comprehensive agricultural support.

## Features

### 🌾 Core Features
- **Multi-language Support**: English, Hindi, Malayalam, and Marathi
- **Voice & Text Queries**: Ask agricultural questions using voice or text
- **Image Analysis**: Upload plant images for disease diagnosis
- **Weather Integration**: Real-time weather data and agricultural advisories
- **Expert Escalation**: Complex queries escalated to Krishi Bhavan officers
- **Offline Support**: PWA functionality for low-connectivity areas

### 🤖 AI/ML Capabilities
- **Speech Recognition**: Voice-to-text conversion in multiple languages
- **Plant Disease Detection**: AI-powered image analysis for disease identification
- **RAG (Retrieval Augmented Generation)**: Knowledge retrieval from agricultural databases
- **LLM Integration**: Intelligent answer generation based on agricultural knowledge
- **Continuous Learning**: Feedback-driven model improvement

### 📱 User Experience
- **Mobile-First Design**: Optimized for smartphone usage
- **Progressive Web App**: Installable on mobile devices
- **Intuitive Interface**: Large buttons, clear icons, voice prompts
- **Low Literacy Support**: Icon-based navigation and audio responses

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **React i18next** for internationalization
- **React Speech Kit** for voice recognition
- **React Dropzone** for file uploads
- **PWA** with service workers

### Backend
- **Node.js + Express** for REST API
- **MongoDB** for database
- **Mongoose** for data modeling

### ML/AI Services
- **TensorFlow** for plant disease classification
- **Whisper** for speech recognition
- **OpenAI/Anthropic** for LLM integration
- **Vector Database** (Pinecone/Milvus) for RAG
- **Weather API** integration

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- MongoDB installed locally (Community Server)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd krishsathi
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   ```bash
   # Copy environment template
   cp env.example .env
   
   # Edit .env with your MongoDB and JWT configuration
   ```

4. **Start the application**
   ```bash
   # Development mode (both frontend and backend)
   npm run dev
   
   # Or start individually
   npm run dev:frontend  # Frontend on http://localhost:3000
   npm run dev:backend   # Backend on http://localhost:8080
   ```

5. **Access the application**

   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080/api

## Project Structure

```
krishsathi/
├── frontend/                 # React PWA frontend
│   ├── public/              # Static assets and PWA files
│   ├── src/
│   │   ├── components/      # Reusable React components
│   │   ├── pages/           # Page components
│   │   ├── i18n/           # Internationalization files
│   │   └── App.js          # Main application component
│   └── package.json
├── backend/                 # Node/Express backend
│   ├── src/
│   │   ├── models/          # Mongoose models
│   │   └── routes/          # API routes
│   ├── server.js
│   └── package.json
└── README.md
```

## API Endpoints

### Query Processing
- `POST /api/query` - Process agricultural queries
- `POST /api/upload` - Upload and analyze plant images
- `POST /api/feedback` - Submit user feedback

### Weather
- `GET /api/weather?location=Kerala` - Get weather data

### Admin
- `GET /api/admin/escalations` - View escalated queries
- `POST /api/admin/response` - Respond to escalated queries

## Development Roadmap

### Phase 1: MVP (Current)
- [x] Basic PWA structure
- [x] Multi-language support
- [x] Voice and text input
- [x] Image upload interface
- [x] Weather integration
- [x] Basic backend API

### Phase 2: ML Integration
- [ ] ASR model fine-tuning for Indian languages
- [ ] Plant disease classification model
- [ ] RAG pipeline implementation
- [ ] LLM integration for answer generation

### Phase 3: Advanced Features
- [ ] Real-time notifications
- [ ] Offline data synchronization
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)

### Phase 4: Production
- [ ] Government cloud deployment
- [ ] Security audit and compliance
- [ ] Performance optimization
- [ ] User training and adoption

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Email: support@krishsathi.in
- Documentation: [docs.krishsathi.in](https://docs.krishsathi.in)
- Issues: [GitHub Issues](https://github.com/krishsathi/issues)

## Acknowledgments

- Krishi Bhavan, Kerala for agricultural expertise
- ICAR for research and knowledge base
- Open source community for various libraries and tools
- Farmers and agricultural experts for feedback and testing

---

**KrishSathi** - Empowering farmers with AI-driven agricultural assistance 🌾🤖
