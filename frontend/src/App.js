import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './i18n';

import Navbar from './components/Navbar';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/Home';
import Query from './pages/Query';
import Upload from './pages/Upload';
import Weather from './pages/Weather';
import Profile from './pages/Profile';
import LanguageSelector from './components/LanguageSelector';
import Login from './pages/Login';
import SugarcaneDisease from './pages/SugarcaneDisease';
import DiagnosisHistory from './pages/DiagnosisHistory';
import GovernmentSchemes from './pages/GovernmentSchemes';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
          <Navbar />
          <LanguageSelector />
          
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/sugarcane-disease" element={<SugarcaneDisease />} />
              <Route path="/history" element={<DiagnosisHistory />} />
              <Route path="/query" element={<Query />} />
              <Route path="/schemes" element={<GovernmentSchemes />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/weather" element={<Weather />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/login" element={<Login />} />
            </Routes>
          </main>
          
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
