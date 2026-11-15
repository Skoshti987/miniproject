import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDropzone } from 'react-dropzone';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Upload as UploadIcon, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  MessageSquare, 
  ShieldAlert, 
  FileText, 
  ArrowRight,
  ExternalLink,
  ShoppingBag,
  History,
  Sparkles,
  Info
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const SugarcaneDisease = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

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
      toast.error('Please choose or capture a sugarcane leaf image first.');
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

      if (!data || data.status === 'invalid_image' || data.valid_leaf === false) {
        setResult(null);
        const msg = data?.message || 'Invalid Image! Please upload a clear image of a sugarcane leaf to perform disease diagnosis.';
        setErrorMsg(msg);
        toast.warn(msg);
      } else if (data && data.success && data.prediction) {
        setResult(data);
        setErrorMsg('');
        if (data.status === 'uncertain') {
          toast.info('Image analyzed with low confidence. Please review the advisory.');
        } else {
          toast.success(t('common.success', { defaultValue: 'Analysis completed successfully!' }));
        }
      } else {
        setResult(null);
        throw new Error(data?.message || 'Failed to process leaf analysis.');
      }
    } catch (err) {
      console.error('Sugarcane Disease Analysis Error:', err);
      setResult(null);
      const msg = err?.message || 'Invalid Image! Please upload a clear image of a sugarcane leaf to perform disease diagnosis.';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAskChatbot = () => {
    if (!result) return;
    const rawClass = result.prediction?.class || 'Healthy';
    const localizedDiseaseName = t(`sugarcane.diseases.${rawClass}`, { defaultValue: rawClass });
    const confidencePct = Math.round((result.prediction?.confidence || 0) * 100);
    
    const contextPrompt = `My sugarcane leaf was diagnosed with: ${rawClass} (${localizedDiseaseName}) at ${confidencePct}% confidence. Please explain the causes, step-by-step field remedies, and recommended products for my crop.`;

    navigate('/query', {
      state: {
        prefillQuery: contextPrompt,
        diseaseContext: { rawClass, localizedDiseaseName, confidencePct }
      }
    });
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

  const getLocalizedDiseaseName = (rawClass) => {
    if (result?.recommendation?.local_names?.mr && (t('current_lang') === 'mr' || !rawClass)) {
      return result.recommendation.local_names.mr;
    }
    return t(`sugarcane.diseases.${rawClass}`, {
      defaultValue: result?.recommendation?.disease_name || rawClass
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-green-700 to-teal-800 rounded-3xl shadow-xl p-6 md:p-8 text-white relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="bg-emerald-900/80 text-emerald-200 text-xs font-bold px-3.5 py-1.5 rounded-full uppercase tracking-wider mb-3 inline-block border border-emerald-500/30">
              🌾 Specialized Sugarcane AI Vision
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">
              Sugarcane Disease AI Diagnosis
            </h1>
            <p className="text-emerald-100 text-base md:text-lg max-w-2xl leading-relaxed">
              Upload a clear photo of your sugarcane leaf to instantly detect diseases, inspect causes, and get ICAR-verified field treatments and genuine product links.
            </p>
          </div>

          {user && (
            <Link
              to="/history"
              className="self-start md:self-center bg-white/10 hover:bg-white/20 text-white backdrop-blur px-4 py-2.5 rounded-xl text-sm font-semibold border border-white/20 transition-all flex items-center space-x-2"
            >
              <History size={18} />
              <span>Diagnosis History</span>
            </Link>
          )}
        </div>
      </div>

      {/* Upload Box / Image Display */}
      <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
        {!previewUrl ? (
          <div
            {...getRootProps()}
            className={`border-3 border-dashed rounded-2xl p-8 md:p-12 text-center cursor-pointer transition-all duration-200 ${
              isDragActive
                ? 'border-green-500 bg-green-50 scale-[0.99]'
                : 'border-green-200 hover:border-green-400 hover:bg-green-50/40'
            }`}
          >
            <input {...getInputProps()} />
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-700 shadow-inner">
              <UploadIcon size={36} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              {isDragActive ? 'Drop the sugarcane leaf photo here' : 'Take or Upload Sugarcane Leaf Photo'}
            </h3>
            <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
              Supports JPEG, PNG, WEBP (Max 10MB). Ensure the leaf blade is clear and well-focused under daylight.
            </p>
            <button className="bg-green-600 hover:bg-green-700 text-white px-8 py-3.5 rounded-xl font-bold text-base shadow-md transition-all">
              Choose Photo / Camera
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="relative rounded-2xl overflow-hidden bg-gray-900 border border-gray-200 max-h-96 flex items-center justify-center shadow-inner">
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
                <span>Remove</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-8 py-3.5 rounded-xl text-base font-bold shadow-lg transition-all flex items-center justify-center space-x-3"
              >
                {isAnalyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Analyzing Leaf with AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    <span>{result ? 'Re-Analyze Image' : 'Analyze Sugarcane Leaf'}</span>
                  </>
                )}
              </button>

              <button
                onClick={handleClear}
                disabled={isAnalyzing}
                className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3.5 rounded-xl text-base font-semibold transition-colors flex items-center justify-center space-x-2"
              >
                <RefreshCw size={18} />
                <span>Choose Another Photo</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Invalid Image Error Banner */}
      {errorMsg && (
        <div className="bg-red-50 border-l-4 border-red-500 p-5 rounded-2xl flex items-start space-x-3 text-red-900 shadow-sm animate-fade-in">
          <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={26} />
          <div className="flex-1">
            <h4 className="font-extrabold text-base text-red-900 mb-1">
              Invalid Image!
            </h4>
            <p className="text-sm text-red-800 leading-relaxed font-medium">
              {errorMsg}
            </p>
            <p className="text-xs text-red-700 mt-2">
              Note: This AI diagnostic tool is strictly specialized for sugarcane leaves. Uploading humans, animals, other crops (rice, wheat, cotton), objects, or blurred images will be rejected.
            </p>
            <div className="mt-3 flex items-center space-x-3">
              <button
                onClick={handleClear}
                className="text-xs bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold shadow-sm transition-colors flex items-center space-x-1.5"
              >
                <RefreshCw size={13} />
                <span>Choose a Valid Sugarcane Photo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prediction Results Section - Only rendered when image is valid! */}
      {result && result.prediction && (
        <div className="space-y-6 animate-fade-in">
          {/* Main Diagnostic Card */}
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-100 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Target Crop
                </div>
                <div className="text-lg font-extrabold text-green-700 flex items-center">
                  🌱 Sugarcane (Saccharum officinarum)
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <span className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold border ${getSeverityBadgeClass(result.recommendation?.severity)}`}>
                  {result.recommendation?.severity || 'Moderate'} Severity
                </span>
                <span className="text-xs text-gray-400 font-mono">
                  v{result.model_version || '1.0.0'}
                </span>
              </div>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              {/* Class & Confidence Display */}
              <div className="bg-emerald-50/80 rounded-2xl p-6 border border-emerald-100 space-y-3">
                <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  Diagnostic Result
                </div>
                <div className="text-2xl md:text-3xl font-black text-gray-900">
                  {getLocalizedDiseaseName(result.prediction.class)}
                </div>

                {/* Confidence Bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-sm font-bold text-gray-700">
                    <span>Diagnostic Confidence</span>
                    <span className="text-emerald-700 font-extrabold">
                      {Math.round(result.prediction.confidence * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3.5 overflow-hidden">
                    <div
                      className={`h-3.5 rounded-full transition-all duration-700 ${
                        result.prediction.is_confident ? 'bg-emerald-600' : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(10, result.prediction.confidence * 100))}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Low Confidence / Uncertain Notice */}
              {!result.prediction.is_confident && (
                <div className="bg-amber-50 border-l-4 border-amber-500 p-5 rounded-2xl flex items-start space-x-3 text-amber-900">
                  <ShieldAlert className="text-amber-600 flex-shrink-0 mt-0.5" size={24} />
                  <div>
                    <h4 className="font-extrabold text-base text-amber-900">Uncertain Diagnosis</h4>
                    <p className="text-sm text-amber-800 mt-1 leading-relaxed">
                      The AI confidence is below the reliable threshold (60%). The visual symptoms in this photo are ambiguous. Please upload a closer, clearer photo taken under bright, diffuse daylight.
                    </p>
                  </div>
                </div>
              )}

              {/* Why AI Identified this Disease */}
              {result.prediction.why_identified && (
                <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-5">
                  <h4 className="text-sm font-extrabold text-blue-900 uppercase tracking-wider mb-2 flex items-center">
                    <Info size={18} className="mr-2 text-blue-600" />
                    Why the AI Identified This Disease
                  </h4>
                  <p className="text-gray-800 text-sm leading-relaxed">
                    {result.prediction.why_identified}
                  </p>
                </div>
              )}

              {/* Symptoms & Visible Signs */}
              {result.recommendation?.symptoms && (
                <div className="space-y-2">
                  <h4 className="text-sm font-extrabold text-gray-700 uppercase tracking-wider flex items-center">
                    <FileText size={17} className="mr-2 text-green-600" />
                    Symptoms & Visible Field Signs
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-gray-800 text-sm leading-relaxed">
                    {result.recommendation.symptoms}
                  </div>
                </div>
              )}

              {/* Causes & Conditions */}
              {(result.recommendation?.causes || result.recommendation?.conditions_responsible) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.recommendation?.causes && (
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-1">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Causal Pathogen</span>
                      <p className="text-xs text-gray-800 leading-relaxed font-medium">{result.recommendation.causes}</p>
                    </div>
                  )}
                  {result.recommendation?.conditions_responsible && (
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-1">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Favorable Conditions</span>
                      <p className="text-xs text-gray-800 leading-relaxed font-medium">{result.recommendation.conditions_responsible}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Immediate Treatment & Agronomic Practices */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Immediate Field Actions */}
                {result.recommendation?.immediate_treatment?.length > 0 && (
                  <div className="bg-emerald-50/70 rounded-2xl p-5 border border-emerald-100">
                    <h4 className="text-base font-extrabold text-emerald-950 mb-3 flex items-center">
                      <CheckCircle size={18} className="mr-2 text-emerald-600" />
                      Immediate Field Treatments
                    </h4>
                    <ul className="space-y-2.5">
                      {result.recommendation.immediate_treatment.map((act, idx) => (
                        <li key={idx} className="flex items-start text-xs md:text-sm text-gray-800 leading-relaxed">
                          <span className="text-emerald-600 font-bold mr-2 text-base">•</span>
                          <span>{act}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Prevention & Agronomic Practices */}
                {result.recommendation?.prevention_methods?.length > 0 && (
                  <div className="bg-teal-50/70 rounded-2xl p-5 border border-teal-100">
                    <h4 className="text-base font-extrabold text-teal-950 mb-3 flex items-center">
                      <ShieldAlert size={18} className="mr-2 text-teal-600" />
                      Prevention & Agricultural Practices
                    </h4>
                    <ul className="space-y-2.5">
                      {result.recommendation.prevention_methods.map((prev, idx) => (
                        <li key={idx} className="flex items-start text-xs md:text-sm text-gray-800 leading-relaxed">
                          <span className="text-teal-600 font-bold mr-2 text-base">•</span>
                          <span>{prev}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* MODULE 1.4: Fertilizer and Product Purchase Recommendations */}
              {result.products && (
                <div className="space-y-6 pt-4 border-t border-gray-100">
                  <div className="flex items-center space-x-2">
                    <ShoppingBag className="text-emerald-600" size={22} />
                    <h3 className="text-xl font-extrabold text-gray-900">
                      Verified Agricultural Products & Purchase Links
                    </h3>
                  </div>

                  {/* Curative Products / Fungicides */}
                  {result.products.disease_treatment_products?.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-red-700 bg-red-50 border border-red-200 px-3 py-1 rounded-full">
                          🛡️ Disease-Specific Curative Products & Bio-Agents
                        </span>
                        <span className="text-xs text-gray-400">ICAR / VSI Recommended</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {result.products.disease_treatment_products.map((prod, idx) => (
                          <div key={idx} className="bg-white border-2 border-red-100 hover:border-red-300 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                            <div className="space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <h5 className="font-extrabold text-base text-gray-900">
                                  {prod.name}
                                </h5>
                                <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded whitespace-nowrap">
                                  {prod.approx_price}
                                </span>
                              </div>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{prod.type}</p>
                              <p className="text-xs text-gray-700 leading-relaxed">
                                <strong className="text-gray-900">Why Recommended:</strong> {prod.why_recommended}
                              </p>
                              <p className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                                <strong className="text-gray-800">Verified Usage:</strong> {prod.usage}
                              </p>
                              {prod.alternatives && (
                                <p className="text-xs text-gray-500">
                                  <em>Alternatives:</em> {prod.alternatives}
                                </p>
                              )}
                            </div>

                            <a
                              href={prod.purchase_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-4 rounded-xl text-xs font-bold text-center shadow transition-all flex items-center justify-center space-x-1.5"
                            >
                              <span>Buy on Official Agri Portal</span>
                              <ExternalLink size={14} />
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Regular Crop Nutrition Fertilizers (Separated from disease treatment) */}
                  {result.products.crop_nutrition_fertilizers?.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-green-700 bg-green-50 border border-green-200 px-3 py-1 rounded-full">
                          🌱 Regular Crop Nutrition & Soil Fertility (Non-Chemical)
                        </span>
                        <span className="text-xs text-gray-400">Nutritional Baseline</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {result.products.crop_nutrition_fertilizers.map((fert, idx) => (
                          <div key={idx} className="bg-white border-2 border-green-100 hover:border-green-300 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                            <div className="space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <h5 className="font-extrabold text-base text-gray-900">
                                  {fert.name}
                                </h5>
                                <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded whitespace-nowrap">
                                  {fert.approx_price}
                                </span>
                              </div>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{fert.type}</p>
                              <p className="text-xs text-gray-700 leading-relaxed">
                                <strong className="text-gray-900">Purpose:</strong> {fert.purpose}
                              </p>
                              <p className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                                <strong className="text-gray-800">Usage:</strong> {fert.usage}
                              </p>
                            </div>

                            <a
                              href={fert.purchase_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-green-700 hover:bg-green-800 text-white py-2.5 px-4 rounded-xl text-xs font-bold text-center shadow transition-all flex items-center justify-center space-x-1.5"
                            >
                              <span>Buy on IFFCO Bazar</span>
                              <ExternalLink size={14} />
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleAskChatbot}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 px-6 rounded-2xl font-bold text-base shadow-md transition-all flex items-center justify-center space-x-2"
                >
                  <MessageSquare size={20} />
                  <span>Ask KrishSathi Chatbot About This Diagnosis</span>
                  <ArrowRight size={18} />
                </button>
                
                {user && (
                  <Link
                    to="/history"
                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 py-4 px-6 rounded-2xl font-bold text-base transition-colors flex items-center justify-center space-x-2"
                  >
                    <History size={18} />
                    <span>View in My History</span>
                  </Link>
                )}

                <button
                  onClick={handleClear}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-4 px-6 rounded-2xl font-semibold text-base transition-colors"
                >
                  Clear Photo
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
