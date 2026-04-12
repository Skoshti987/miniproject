import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSpeechRecognition } from 'react-speech-kit';
// Lightweight language detection using browser Intl if available
const detectLanguageCode = async (text) => {
  try {
    // Fallback: use current i18n language
    return navigator.language?.split('-')[0] || 'en';
  } catch {
    return 'en';
  }
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
import { Mic, MicOff, Send, MessageCircle, ThumbsUp, ThumbsDown, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';

const Query = () => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [answer, setAnswer] = useState('');
  const [sources, setSources] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const textareaRef = useRef(null);

  const { listen, listening, stop } = useSpeechRecognition({
    onResult: (result) => {
      setQuery(result);
    },
    onEnd: () => {
      setIsRecording(false);
    }
  });

  const handleVoiceInput = () => {
    if (listening) {
      stop();
      setIsRecording(false);
    } else {
      listen();
      setIsRecording(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsProcessing(true);
    setAnswer('');
    setSources([]);
    setFeedback(null);

    try {
      const detectedLang = await detectLanguageCode(query.trim());
      // Simulate API call - replace with actual API
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
          language: detectedLang,
          location: 'Kerala, India', // Get from user profile
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get answer');
      }

      const data = await response.json();
      const translated = await translateText(data.answer, detectedLang);
      setAnswer(translated);
      setSources(data.sources || []);
      
      // Simulate response for demo
      setTimeout(() => {
        const demo = `
          Based on your question about "${query}", here's what I found:

          For rice cultivation in Kerala, the recommended practices include:
          - Use certified seeds from Krishi Bhavan
          - Maintain proper water level (2-3 cm)
          - Apply fertilizers in three splits
          - Monitor for common diseases like blast and sheath blight
          - Follow integrated pest management practices

          The best time for transplanting is during the monsoon season (June-July).
        `;
        translateText(demo, detectedLang).then((t) => setAnswer(t));
        setSources([
          { title: 'Rice Cultivation Guide - Krishi Bhavan', date: '2024-01-15' },
          { title: 'Kerala Agriculture Department Advisory', date: '2024-01-10' }
        ]);
        setIsProcessing(false);
      }, 2000);

    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to get answer. Please try again.');
      setIsProcessing(false);
    }
  };

  const handleFeedback = (isHelpful) => {
    setFeedback(isHelpful);
    toast.success('Thank you for your feedback!');
  };

  const handleEscalate = () => {
    toast.info('Your query has been escalated to the nearest Krishi Bhavan officer.');
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
