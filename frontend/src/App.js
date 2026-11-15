import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './i18n';

import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
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
              {/* Public Authentication Route */}
              <Route path="/login" element={<Login />} />

              {/* Protected Routes: Visiting unauthenticated redirects to /login; Once logged in, lands on Dashboard */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sugarcane-disease"
                element={
                  <ProtectedRoute>
                    <SugarcaneDisease />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/history"
                element={
                  <ProtectedRoute>
                    <DiagnosisHistory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/query"
                element={
                  <ProtectedRoute>
                    <Query />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/schemes"
                element={
                  <ProtectedRoute>
                    <GovernmentSchemes />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/upload"
                element={
                  <ProtectedRoute>
                    <Upload />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/weather"
                element={
                  <ProtectedRoute>
                    <Weather />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all redirect to Dashboard / Login */}
              <Route path="*" element={<Navigate to="/" replace />} />
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
