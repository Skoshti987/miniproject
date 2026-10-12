import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { Upload as UploadIcon, CheckCircle, AlertTriangle, RefreshCw, MessageSquare, ShieldAlert, FileText, ArrowRight } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../services/api';

const SugarcaneDisease = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setErrorMsg('');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const handleClear = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setErrorMsg('');
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      toast.error(t('sugarcane.lowConfidenceMsg'));
      return;
    }

    setIsAnalyzing(true);
    setErrorMsg('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const data = await api('/disease/predict', {
        method: 'POST',
        body: formData
      });

      if (data && data.status === 'invalid_image') {
        setResult(null);
        setErrorMsg(data.message || 'Invalid image — please upload a clear sugarcane leaf photo.');
        toast.warn(data.message || 'Invalid image — please upload a clear sugarcane leaf photo.');
      } else if (data && data.success && data.prediction) {
        setResult(data);
        setErrorMsg('');
        toast.success(t('common.success'));
      } else {
        setResult(null);
        throw new Error(data?.message || t('sugarcane.lowConfidenceMsg'));
      }
    } catch (err) {
      console.error('Sugarcane Disease Analysis Error:', err);
      setResult(null);
      setErrorMsg(err?.message || t('sugarcane.lowConfidenceMsg'));
      toast.error(err?.message || t('sugarcane.analysisError'));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAskChatbot = () => {
    if (!result) return;
    const rawClass = result.prediction?.class || 'Healthy';
    const localizedDiseaseName = t(`sugarcane.diseases.${rawClass}`, { defaultValue: rawClass });
    const confidencePct = Math.round((result.prediction?.confidence || 0) * 100);
    
    const contextPrompt = `Sugarcane Leaf AI detected: ${rawClass} (${localizedDiseaseName}) with ${confidencePct}% confidence. How should I manage and cure this condition?`;

    navigate('/query', { state: { prefillQuery: contextPrompt, diseaseContext: { rawClass, localizedDiseaseName, confidencePct } } });
  };

  const getSeverityBadgeClass = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'low':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'high':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    }
  };

  const getLocalizedActions = (rawClass) => {
    const actions = t(`sugarcane.actions.${rawClass}`, { returnObjects: true });
    if (Array.isArray(actions)) return actions;
    return result?.recommendation?.actions || [];
  };

  const getLocalizedPrevention = (rawClass) => {
    const prev = t(`sugarcane.prevention.${rawClass}`, { returnObjects: true });
    if (Array.isArray(prev)) return prev;
    return result?.recommendation?.prevention || [];
  };

  const getLocalizedDescription = (rawClass) => {
    const desc = t(`sugarcane.descriptions.${rawClass}`);
    if (desc && desc !== `sugarcane.descriptions.${rawClass}`) return desc;
    return result?.recommendation?.summary || '';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-700 to-green-600 rounded-2xl shadow-xl p-6 md:p-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <span className="bg-emerald-800 text-emerald-100 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2 inline-block">
            🌾 {t('app.specializedBadge')}
          </span>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            {t('sugarcane.title')}
          </h1>
          <p className="text-emerald-100 text-base md:text-lg max-w-2xl">
            {t('sugarcane.subtitle')}
          </p>
        </div>
      </div>

      {/* Upload Box / Image Display */}
      <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
        {!previewUrl ? (
          <div
            {...getRootProps()}
            className={`border-3 border-dashed rounded-xl p-8 md:p-12 text-center cursor-pointer transition-all duration-200 ${
              isDragActive
                ? 'border-green-500 bg-green-50 scale-[0.99]'
                : 'border-green-200 hover:border-green-400 hover:bg-green-50/50'
            }`}
          >
            <input {...getInputProps()} />
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
              <UploadIcon size={36} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              {isDragActive ? t('sugarcane.dropHere') : t('upload.dragDrop')}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {t('upload.supportedFormats')} (Max 10MB)
            </p>
            <button className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-semibold text-lg shadow-md transition-all">
              {t('sugarcane.choosePhoto')}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="relative rounded-xl overflow-hidden bg-gray-900 border border-gray-200 max-h-96 flex items-center justify-center">
              <img
                src={previewUrl}
                alt="Sugarcane Leaf Preview"
                className="max-h-96 object-contain"
              />
              <button
                onClick={handleClear}
                disabled={isAnalyzing}
                className="absolute top-3 right-3 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow transition-colors flex items-center space-x-1"
              >
                <RefreshCw size={14} />
                <span>{t('sugarcane.clearBtn')}</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-8 py-3.5 rounded-xl text-base font-bold shadow-lg transition-all flex items-center justify-center space-x-3"
              >
                {isAnalyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>{t('sugarcane.analyzing')}</span>
                  </>
                ) : (
                  <>
                    <UploadIcon size={20} />
                    <span>{result ? 'Re-Analyze Image' : t('sugarcane.analyzeBtn')}</span>
                  </>
                )}
              </button>

              <button
                onClick={handleClear}
                disabled={isAnalyzing}
                className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3.5 rounded-xl text-base font-semibold transition-colors flex items-center justify-center space-x-2"
              >
                <RefreshCw size={18} />
                <span>Choose Different Photo</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error Message display */}
      {errorMsg && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-5 rounded-xl flex items-start space-x-3 text-amber-900 shadow-sm">
          <AlertTriangle className="text-amber-500 flex-shrink-0 mt-0.5" size={24} />
          <div className="flex-1">
            <h4 className="font-bold text-base text-amber-900 mb-1">
              Invalid or Unrecognized Image
            </h4>
            <p className="text-sm text-amber-800 leading-relaxed">{errorMsg}</p>
            <div className="mt-3 flex items-center space-x-3">
              <button
                onClick={handleClear}
                className="text-xs bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-1.5 rounded-lg font-semibold shadow-sm transition-colors flex items-center space-x-1.5"
              >
                <RefreshCw size={13} />
                <span>Choose Another Photo</span>
              </button>
              <button
                onClick={handleAnalyze}
                className="text-xs bg-white border border-amber-300 text-amber-800 hover:bg-amber-100 px-3 py-1.5 rounded-lg font-medium transition-colors"
              >
                {t('common.retry')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prediction Results Section */}
      {result && result.prediction && (
        <div className="space-y-6 animate-fade-in">
          {/* Main Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-100 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                  {t('sugarcane.cropLabel')}
                </div>
                <div className="text-lg font-bold text-green-700 flex items-center">
                  🌱 {t('sugarcane.cropValue')}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getSeverityBadgeClass(result.recommendation?.severity)}`}>
                  {t(`sugarcane.severities.${result.recommendation?.severity || 'Moderate'}`, { defaultValue: result.recommendation?.severity || 'Moderate' })} {t('sugarcane.severityLabel')}
                </span>
                <span className="text-xs text-gray-400">
                  Model v{result.model_version || '1.0.0'}
                </span>
              </div>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              {/* Class & Confidence Display */}
              <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-100">
                <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1">
                  {t('sugarcane.predictedDisease')}
                </div>
                <div className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-3">
                  {t(`sugarcane.diseases.${result.prediction.class}`, { defaultValue: result.prediction.class })}
                </div>

                {/* Confidence Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-sm font-semibold text-gray-700">
                    <span>{t('sugarcane.confidenceLabel')}</span>
                    <span className="text-emerald-700">
                      {Math.round(result.prediction.confidence * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${
                        result.prediction.is_confident ? 'bg-emerald-600' : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(10, result.prediction.confidence * 100))}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Low Confidence Alert if uncertain */}
              {!result.prediction.is_confident && (
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-xl flex items-start space-x-3 text-amber-800">
                  <ShieldAlert className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <h4 className="font-semibold text-sm">{t('sugarcane.lowConfidenceTitle')}</h4>
                    <p className="text-xs text-amber-700 mt-1">
                      {t('sugarcane.lowConfidenceMsg')}
                    </p>
                  </div>
                </div>
              )}

              {/* Summary Description */}
              {getLocalizedDescription(result.prediction.class) && (
                <div>
                  <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center">
                    <FileText size={16} className="mr-2 text-green-600" />
                    {t('sugarcane.diseaseDescription')}
                  </h4>
                  <p className="text-gray-700 text-base leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
                    {getLocalizedDescription(result.prediction.class)}
                  </p>
                </div>
              )}

              {/* Actions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Immediate Actions */}
                {getLocalizedActions(result.prediction.class).length > 0 && (
                  <div className="bg-green-50/70 rounded-xl p-5 border border-green-100">
                    <h4 className="text-base font-bold text-green-900 mb-3 flex items-center">
                      <CheckCircle size={18} className="mr-2 text-green-600" />
                      {t('sugarcane.recommendationsHeader')}
                    </h4>
                    <ul className="space-y-2">
                      {getLocalizedActions(result.prediction.class).map((act, idx) => (
                        <li key={idx} className="flex items-start text-sm text-gray-800">
                          <span className="text-green-600 font-bold mr-2">•</span>
                          <span>{act}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Prevention */}
                {getLocalizedPrevention(result.prediction.class).length > 0 && (
                  <div className="bg-blue-50/70 rounded-xl p-5 border border-blue-100">
                    <h4 className="text-base font-bold text-blue-900 mb-3 flex items-center">
                      <ShieldAlert size={18} className="mr-2 text-blue-600" />
                      {t('sugarcane.preventionHeader')}
                    </h4>
                    <ul className="space-y-2">
                      {getLocalizedPrevention(result.prediction.class).map((prev, idx) => (
                        <li key={idx} className="flex items-start text-sm text-gray-800">
                          <span className="text-blue-600 font-bold mr-2">•</span>
                          <span>{prev}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Action Button to Chatbot */}
              <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleAskChatbot}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 px-6 rounded-xl font-bold text-base shadow-md transition-all flex items-center justify-center space-x-2"
                >
                  <MessageSquare size={20} />
                  <span>{t('sugarcane.askChatbotBtn')}</span>
                  <ArrowRight size={18} />
                </button>
                
                <button
                  onClick={handleClear}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-4 px-6 rounded-xl font-semibold text-base transition-colors"
                >
                  {t('sugarcane.clearBtn')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SugarcaneDisease;
