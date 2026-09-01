import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { Mic, MicOff, Send, MessageCircle, ThumbsUp, ThumbsDown, AlertTriangle, Sparkles } from 'lucide-react';
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
  const location = useLocation();

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

  // Auto-fill query when coming from Disease Diagnosis page
  useEffect(() => {
    if (location.state && location.state.prefillQuery) {
      const prefilled = location.state.prefillQuery;
      setQuery(prefilled);
      submitQuery(prefilled);
    }
  }, [location.state]);

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
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="text-center space-y-2">
        <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1">
          <Sparkles size={14} /> Sugarcane Knowledge Chatbot
        </span>
        <h1 className="text-3xl font-bold text-gray-800">
          Ask KrishSathi AI Assistant
        </h1>
        <p className="text-gray-600 text-base max-w-xl mx-auto">
          Get expert sugarcane advice on planting, soil care, tillering, pests, Red Rot, Rust, and fertilizer schedules in your language.
        </p>
      </div>

      {/* Query Form */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('query.placeholder')}
              className="w-full p-4 pr-20 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none text-base text-gray-800"
              rows={4}
              disabled={isProcessing}
            />
            <button
              type="button"
              onClick={handleVoiceInput}
              className={`absolute right-3 top-3 p-3 rounded-xl transition-all shadow-sm ${
                isRecording
                  ? 'bg-red-500 text-white hover:bg-red-600 scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-emerald-100 hover:text-emerald-700'
              }`}
              disabled={isProcessing}
            >
              {isRecording ? <MicOff size={22} /> : <Mic size={22} />}
            </button>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm font-medium text-gray-500">
              {isRecording && (
                <span className="flex items-center space-x-2 text-red-500 font-semibold">
                  <Mic size={18} className="animate-pulse" />
                  <span>Listening in {user?.language || 'English'}... Speak now</span>
                </span>
              )}
            </div>
            <button
              type="submit"
              disabled={!query.trim() || isProcessing}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-md flex items-center space-x-2 text-base"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>{t('query.processing')}</span>
                </>
              ) : (
                <>
                  <Send size={18} />
                  <span>{t('query.submit')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Answer Section */}
      {answer && (
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-emerald-100 space-y-6">
          <div className="flex items-center space-x-3 border-b border-gray-100 pb-4">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center">
              <MessageCircle size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">{t('query.answer')}</h2>
              <span className="text-xs text-gray-500">Sugarcane AI Advisory</span>
            </div>
          </div>
          
          <div className="prose max-w-none text-gray-800 leading-relaxed text-base whitespace-pre-line bg-gray-50/50 p-6 rounded-xl border border-gray-100">
            {answer}
          </div>

          {/* Sources */}
          {sources.length > 0 && (
            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-600 mb-3">{t('query.sources')}</h3>
              <div className="space-y-2">
                {sources.map((source, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span className="font-medium">{source.title}</span>
                    <span className="text-gray-400">•</span>
                    <span>{source.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Feedback & Escalation Section */}
          <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-gray-700 mb-2">
                {t('query.helpful')}
              </h3>
              <div className="flex space-x-3">
                <button
                  onClick={() => handleFeedback(true)}
                  className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    feedback === true
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-emerald-50'
                  }`}
                >
                  <ThumbsUp size={16} />
                  <span>{t('common.yes')}</span>
                </button>
                <button
                  onClick={() => handleFeedback(false)}
                  className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    feedback === false
                      ? 'bg-red-100 text-red-800 border border-red-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-red-50'
                  }`}
                >
                  <ThumbsDown size={16} />
                  <span>{t('common.no')}</span>
                </button>
              </div>
            </div>
            
            <button
              onClick={handleEscalate}
              className="flex items-center justify-center space-x-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow transition-colors"
            >
              <AlertTriangle size={18} />
              <span>{t('query.escalate')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Sugarcane Quick Questions */}
      <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          🌱 Frequently Asked Sugarcane Questions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            'What fertilizer is needed during sugarcane tillering stage?',
            'How often should I irrigate sugarcane in summer?',
            'My sugarcane leaves are showing Red Rot symptoms. What should I do?',
            'How can I prevent Sugarcane Mosaic Virus spread?',
            'Best practices for sugarcane ratoon crop management',
            'How to control sugarcane rust fungal infection organically?'
          ].map((question, index) => (
            <button
              key={index}
              onClick={() => {
                setQuery(question);
                submitQuery(question);
              }}
              className="text-left p-3.5 bg-gray-50 hover:bg-emerald-50/80 rounded-xl transition-all border border-gray-200 hover:border-emerald-300 text-sm font-medium text-gray-700 hover:text-emerald-900"
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
