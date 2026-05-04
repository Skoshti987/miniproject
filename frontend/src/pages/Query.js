import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Mic, MicOff, Send, MessageCircle, ThumbsUp, ThumbsDown, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
const detectLanguageCode = async (text, preferredLanguage) => {
  if (preferredLanguage) return preferredLanguage;

  if (/[\u0900-\u097F]/.test(text)) return 'mr';
  if (/[\u0D00-\u0D7F]/.test(text)) return 'ml';

  try {
    return navigator.language?.split('-')[0] || 'en';
  } catch {
    return 'en';
  }
};

const toSpeechLocale = (languageCode) => {
  const map = {
    en: 'en-IN',
    hi: 'hi-IN',
    mr: 'mr-IN',
    ml: 'ml-IN'
  };
  return map[languageCode] || 'en-IN';
};

const translateText = async (text, targetLang, apiKey = process.env.REACT_APP_GOOGLE_TRANSLATE_API_KEY) => {
  if (!apiKey || !text || !targetLang) return text;
  try {
    const res = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: text, target: targetLang })
    });
    const data = await res.json();
    return data?.data?.translations?.[0]?.translatedText || text;
  } catch {
    return text;
  }
};

const Query = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [answer, setAnswer] = useState('');
  const [sources, setSources] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [queryId, setQueryId] = useState(null);
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);
  const [listening, setListening] = useState(false);

  const submitQuery = async (text) => {
    const cleanQuery = (text || '').trim();
    if (!cleanQuery) return;

    setIsProcessing(true);
    setAnswer('');
    setSources([]);
    setFeedback(null);

    try {
      const detectedLang = await detectLanguageCode(cleanQuery, user?.language);
      const data = await api('/query', {
        method: 'POST',
        body: JSON.stringify({
          query: cleanQuery,
          language: detectedLang,
          location: user?.location?.trim() || 'India',
        }),
      });
      const translated = await translateText(data.answer, detectedLang);
      setAnswer(translated);
      setSources(data.sources || []);
      setQueryId(data.id || null);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to get answer. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice input is not supported in this browser.');
      return;
    }

    if (recognitionRef.current && listening) {
      recognitionRef.current.stop();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = toSpeechLocale(user?.language);
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => {
      setListening(true);
      setIsRecording(true);
    };
    recognition.onend = () => {
      setListening(false);
      setIsRecording(false);
    };
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      if (transcript) {
        setQuery(transcript);
        if (!isProcessing) {
          submitQuery(transcript);
        }
      }
    };
    recognition.onerror = () => {
      setListening(false);
      setIsRecording(false);
      toast.error('Could not capture voice input.');
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await submitQuery(query);
  };

  const handleFeedback = (isHelpful) => {
    if (!queryId) return;
    api('/query/feedback', {
      method: 'POST',
      body: JSON.stringify({ queryId, helpful: isHelpful })
    })
      .then(() => {
        setFeedback(isHelpful);
        toast.success('Thank you for your feedback!');
      })
      .catch((error) => {
        toast.error(error?.message || 'Failed to save feedback');
      });
  };

  const handleEscalate = () => {
    if (!queryId) return;
    api('/query/escalate', {
      method: 'POST',
      body: JSON.stringify({ queryId })
    })
      .then(() => {
        toast.info('Your query has been escalated to the nearest Krishi Bhavan officer.');
      })
      .catch((error) => {
        toast.error(error?.message || 'Failed to escalate query');
      });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          {t('query.placeholder')}
        </h1>
        <p className="text-gray-600">
          Ask any agricultural question and get expert advice
        </p>
      </div>

      {/* Query Form */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('query.placeholder')}
              className="w-full p-4 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              rows={4}
              disabled={isProcessing}
            />
            <button
              type="button"
              onClick={handleVoiceInput}
              className={`absolute right-3 top-3 p-2 rounded-lg transition-colors ${
                isRecording
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              disabled={isProcessing}
            >
              {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {isRecording && (
                <span className="flex items-center space-x-1 text-red-500">
                  <Mic size={16} className="animate-pulse" />
                  <span>Listening...</span>
                </span>
              )}
            </div>
            <button
              type="submit"
              disabled={!query.trim() || isProcessing}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-semibold transition-colors flex items-center space-x-2"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>{t('query.processing')}</span>
                </>
              ) : (
                <>
                  <Send size={16} />
                  <span>{t('query.submit')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Answer Section */}
      {answer && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <MessageCircle size={24} className="text-green-600" />
            <h2 className="text-xl font-semibold text-gray-800">{t('query.answer')}</h2>
          </div>
          
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {answer}
            </p>
          </div>

          {/* Sources */}
          {sources.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">{t('query.sources')}</h3>
              <div className="space-y-2">
                {sources.map((source, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>{source.title}</span>
                    <span className="text-gray-400">•</span>
                    <span>{source.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Feedback Section */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {t('query.helpful')}
                </h3>
                <div className="flex space-x-4">
                  <button
                    onClick={() => handleFeedback(true)}
                    className={`flex items-center space-x-1 px-4 py-2 rounded-lg transition-colors ${
                      feedback === true
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-green-50'
                    }`}
                  >
                    <ThumbsUp size={16} />
                    <span>{t('common.yes')}</span>
                  </button>
                  <button
                    onClick={() => handleFeedback(false)}
                    className={`flex items-center space-x-1 px-4 py-2 rounded-lg transition-colors ${
                      feedback === false
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-red-50'
                    }`}
                  >
                    <ThumbsDown size={16} />
                    <span>{t('common.no')}</span>
                  </button>
                </div>
              </div>
              
              <button
                onClick={handleEscalate}
                className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <AlertTriangle size={16} />
                <span>{t('query.escalate')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Questions */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Quick Questions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            'How to control rice blast disease?',
            'Best time to plant coconut saplings?',
            'Organic fertilizer recommendations for vegetables',
            'Weather advisory for this week',
            'Pest control for banana cultivation',
            'Soil testing and improvement methods'
          ].map((question, index) => (
            <button
              key={index}
              onClick={() => setQuery(question)}
              className="text-left p-3 bg-gray-50 hover:bg-green-50 rounded-lg transition-colors border border-gray-200 hover:border-green-300"
            >
              {question}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Query;
