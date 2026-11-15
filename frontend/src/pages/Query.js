import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { 
  Mic, 
  MicOff, 
  Send, 
  MessageSquare, 
  ThumbsUp, 
  ThumbsDown, 
  Volume2, 
  Trash2, 
  HelpCircle
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const toSpeechLocale = (languageCode) => {
  const map = {
    en: 'en-IN',
    hi: 'hi-IN',
    mr: 'mr-IN',
    ml: 'ml-IN'
  };
  return map[languageCode] || 'en-IN';
};

const SUGGESTED_QUESTIONS = [
  "My sugarcane leaves are turning yellow. What should I do?",
  "What is the recommended fertilizer schedule for sugarcane?",
  "Which sugarcane variety is best for Kolhapur / Western Maharashtra?",
  "How to identify and prevent Red Rot disease?",
  "How to manage early shoot borer in sugarcane?"
];

const Query = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();

  const [query, setQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [sources, setSources] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [queryId, setQueryId] = useState(null);
  const [listening, setListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Load chat history on mount
  useEffect(() => {
    if (user) {
      loadChatHistory();
    }
  }, [user]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  // Handle prefill context from SugarcaneDisease diagnosis page
  useEffect(() => {
    if (location.state && location.state.prefillQuery) {
      const prefilled = location.state.prefillQuery;
      setQuery(prefilled);
      submitQuery(prefilled);
    }
  }, [location.state]);

  const loadChatHistory = async () => {
    try {
      const res = await api('/query/history');
      if (res && res.history && res.history.length > 0) {
        const formatted = [];
        res.history.forEach((h) => {
          if (h.query) formatted.push({ role: 'user', content: h.query });
          if (h.answer) formatted.push({ role: 'assistant', content: h.answer, id: h._id });
        });
        setMessages(formatted);
      }
    } catch (err) {
      console.warn('Could not load chat history:', err.message);
    }
  };

  const handleClearChat = async () => {
    if (!window.confirm('Are you sure you want to clear your conversation history?')) return;
    try {
      if (user) {
        await api('/query/history', { method: 'DELETE' });
      }
      setMessages([]);
      setSources([]);
      setQueryId(null);
      toast.success('Conversation history cleared.');
    } catch (err) {
      toast.error('Failed to clear conversation history.');
    }
  };

  const submitQuery = async (text) => {
    const cleanQuery = (text || '').trim();
    if (!cleanQuery) return;

    setIsProcessing(true);
    setSources([]);
    setFeedback(null);

    const newHistory = [...messages, { role: 'user', content: cleanQuery }];
    setMessages(newHistory);
    setQuery('');

    try {
      const currentLang = i18n.language || user?.language || 'en';
      const data = await api('/query', {
        method: 'POST',
        body: JSON.stringify({
          query: cleanQuery,
          language: currentLang,
          location: user?.district ? `${user.district}, ${user.state || 'Maharashtra'}` : 'Kolhapur, Maharashtra',
          history: messages.slice(-6)
        })
      });

      setSources(data.sources || []);
      setQueryId(data.id || null);
      setMessages([...newHistory, { role: 'assistant', content: data.answer, id: data.id }]);
    } catch (error) {
      console.error('Chatbot error:', error);
      toast.error(error?.message || 'Failed to process agricultural query.');
      setMessages([
        ...newHistory,
        {
          role: 'assistant',
          content: 'I apologize, but I could not connect to the agricultural knowledge base right now. Please check your internet connection or verify backend services.'
        }
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice recognition is not supported in this browser. Please type your query.');
      return;
    }

    if (recognitionRef.current && listening) {
      recognitionRef.current.stop();
      return;
    }

    const currentActiveLang = i18n.language || user?.language || 'en';
    const recognition = new SpeechRecognition();
    recognition.lang = toSpeechLocale(currentActiveLang);
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setListening(true);
    };
    recognition.onend = () => {
      setListening(false);
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
      toast.error('Could not capture microphone audio. Please verify permissions.');
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleSpeakText = (text) => {
    if (!('speechSynthesis' in window)) {
      toast.info('Audio playback is not supported in this browser.');
      return;
    }
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const currentActiveLang = i18n.language || user?.language || 'en';
    const cleanText = (text || '').replace(/[#*`_]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = toSpeechLocale(currentActiveLang);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    submitQuery(query);
  };

  const handleFeedback = (isHelpful, id) => {
    const targetId = id || queryId;
    if (!targetId) return;

    api('/query/feedback', {
      method: 'POST',
      body: JSON.stringify({ queryId: targetId, helpful: isHelpful })
    })
      .then(() => {
        setFeedback(isHelpful);
        toast.success('Thank you for your feedback!');
      })
      .catch((err) => {
        toast.error(err?.message || 'Could not record feedback');
      });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-green-700 to-teal-800 rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="bg-emerald-900/80 text-emerald-200 text-xs font-bold px-3.5 py-1.5 rounded-full uppercase tracking-wider mb-2 inline-block border border-emerald-500/30">
            🌾 Specialized Sugarcane AI Expert
          </span>
          <h1 className="text-3xl font-black">
            KrishSathi Sugarcane Assistant
          </h1>
          <p className="text-emerald-100 text-sm mt-1 max-w-xl">
            Ask questions regarding sugarcane varieties, fertilizer schedules, drip irrigation, pest management, and sugar recovery.
          </p>
        </div>

        {messages.length > 0 && (
          <button
            onClick={handleClearChat}
            className="self-start md:self-center bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5"
          >
            <Trash2 size={14} />
            <span>Clear Chat</span>
          </button>
        )}
      </div>

      {/* Suggested Questions Chips */}
      {messages.length === 0 && (
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-3">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <HelpCircle size={15} className="text-emerald-600" />
            <span>Frequently Asked Sugarcane Questions:</span>
          </span>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                onClick={() => submitQuery(q)}
                disabled={isProcessing}
                className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-semibold py-2 px-3.5 rounded-xl border border-emerald-200 text-left transition-all"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Messages Feed */}
      <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-6 md:p-8 min-h-[400px] flex flex-col justify-between space-y-6">
        <div className="space-y-4 overflow-y-auto max-h-[550px] pr-2">
          {messages.length === 0 && (
            <div className="text-center py-16 space-y-3 text-gray-400">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <MessageSquare size={32} />
              </div>
              <p className="text-sm font-semibold text-gray-600">
                Ask your first sugarcane farming question above or click any suggested prompt!
              </p>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                KrishSathi speaks English, Marathi (मराठी), Hindi (हिंदी), and Malayalam (മലയാളം).
              </p>
            </div>
          )}

          {messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={index}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <div
                  className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 md:p-5 shadow-sm ${
                    isUser
                      ? 'bg-emerald-700 text-white rounded-br-none'
                      : 'bg-gray-50 text-gray-900 border border-gray-100 rounded-bl-none'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 mb-1.5 border-b pb-1.5 border-black/10">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider opacity-80">
                      {isUser ? 'Farmer' : 'KrishSathi Sugarcane Expert'}
                    </span>
                    {!isUser && (
                      <button
                        onClick={() => handleSpeakText(msg.content)}
                        className="text-gray-500 hover:text-emerald-700 p-1 rounded transition-colors"
                        title="Read aloud"
                      >
                        <Volume2 size={14} />
                      </button>
                    )}
                  </div>

                  <div className="text-sm md:text-base leading-relaxed whitespace-pre-line font-normal">
                    {msg.content}
                  </div>

                  {/* Feedback on AI answer */}
                  {!isUser && msg.id && (
                    <div className="flex items-center justify-end gap-2 pt-3 mt-2 border-t border-gray-200/60 text-xs text-gray-500">
                      <span>Helpful?</span>
                      <button
                        onClick={() => handleFeedback(true, msg.id)}
                        className="hover:text-emerald-600 p-1"
                        title="Yes, helpful"
                      >
                        <ThumbsUp size={13} />
                      </button>
                      <button
                        onClick={() => handleFeedback(false, msg.id)}
                        className="hover:text-red-600 p-1"
                        title="Not helpful"
                      >
                        <ThumbsDown size={13} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isProcessing && (
            <div className="flex justify-start animate-fade-in">
              <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-bl-none p-4 flex items-center space-x-3 text-emerald-800">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600"></div>
                <span className="text-xs font-semibold">Consulting ICAR/VSI Sugarcane Knowledge Base...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSubmit} className="pt-4 border-t border-gray-100">
          <div className="relative flex items-center gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything about sugarcane crops, varieties, fertilizers, diseases, or sugar recovery..."
              disabled={isProcessing}
              className="flex-1 px-5 py-4 pr-24 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium shadow-sm"
            />

            <div className="absolute right-3 flex items-center space-x-1.5">
              <button
                type="button"
                onClick={handleVoiceInput}
                className={`p-2.5 rounded-xl transition-all ${
                  listening
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
                title="Voice Input"
              >
                {listening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>

              <button
                type="submit"
                disabled={!query.trim() || isProcessing}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white p-2.5 rounded-xl shadow-md transition-all flex items-center justify-center"
                title="Send Question"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Query;
