import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDropzone } from 'react-dropzone';
import { 
  Upload as UploadIcon, 
  Image, 
  AlertCircle, 
  CheckCircle, 
  X, 
  AlertTriangle,
  Info,
  ShieldAlert,
  FileText,
  ShoppingBag,
  ExternalLink 
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../services/api';

const Upload = () => {
  const { t, i18n } = useTranslation();
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState([]);

  const onDrop = useCallback((acceptedFiles) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      preview: URL.createObjectURL(file),
      status: 'pending'
    }));
    
    // Clear old predictions on new image drop
    setResults([]);
    setUploadedFiles(prev => [...prev, ...newFiles]);
    toast.success(`${acceptedFiles.length} file(s) selected`);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 5,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const removeFile = (id) => {
    setUploadedFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== id);
    });
    setResults(prev => prev.filter(r => r.id !== id));
  };

  const processImages = async () => {
    if (uploadedFiles.length === 0) return;

    setIsProcessing(true);
    setResults([]);

    let successCount = 0;
    for (const fileObj of uploadedFiles) {
      try {
        const formData = new FormData();
        formData.append('image', fileObj.file);
        formData.append('language', i18n.language || 'en');
        formData.append('crop', 'Sugarcane');

        const data = await api('/upload', {
          method: 'POST',
          body: formData,
        });

        if (data.status === 'invalid_image' || data.valid_leaf === false) {
          const msg = data.message || t('sugarcane.invalidImageNotice', {
            defaultValue: 'Invalid Image! Please upload a clear image of a sugarcane leaf to perform disease diagnosis.'
          });
          toast.warn(msg);
          setResults(prev => [...prev, { ...data, id: fileObj.id, error: msg, isInvalid: true }]);
        } else {
          setResults(prev => [...prev, { ...data, id: fileObj.id }]);
          successCount++;
        }
        
        setUploadedFiles(prev => 
          prev.map(f => f.id === fileObj.id ? { ...f, status: 'processed' } : f)
        );
      } catch (err) {
        console.error('Error processing image:', err);
        const errMsg = err?.message || t('sugarcane.invalidImageNotice', {
          defaultValue: 'Invalid Image! Please upload a clear image of a sugarcane leaf to perform disease diagnosis.'
        });
        toast.error(errMsg);
        setResults(prev => [...prev, { id: fileObj.id, fileName: fileObj.file.name, error: errMsg, isInvalid: true }]);
        setUploadedFiles(prev => 
          prev.map(f => f.id === fileObj.id ? { ...f, status: 'failed' } : f)
        );
      }
    }

    if (successCount > 0) {
      toast.success(t('common.success', { defaultValue: 'Analysis completed successfully!' }));
    }
    setIsProcessing(false);
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Low': return 'bg-green-100 text-green-800';
      case 'Moderate': return 'bg-yellow-100 text-yellow-800';
      case 'High': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          {t('upload.title', { defaultValue: 'Plant Disease Diagnosis' })}
        </h1>
        <p className="text-gray-600">
          {t('upload.subtitle', { defaultValue: 'Upload sugarcane leaf photos for instant AI identification and ICAR-recommended treatments.' })}
        </p>
      </div>

      {/* Upload Area */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-green-500 bg-green-50'
              : 'border-gray-300 hover:border-green-400 hover:bg-green-50'
          }`}
        >
          <input {...getInputProps()} />
          <UploadIcon size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-lg font-semibold text-gray-700 mb-2">
            {isDragActive ? 'Drop images here' : t('upload.dragDrop', { defaultValue: 'Drag & drop leaf photos here, or click to browse' })}
          </p>
          <p className="text-sm text-gray-500 mb-4">
            {t('upload.supportedFormats', { defaultValue: 'Supports JPEG, PNG, WEBP up to 10MB' })}
          </p>
          <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors">
            {t('upload.chooseFiles', { defaultValue: 'Choose Photos' })}
          </button>
        </div>
      </div>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              {t('upload.title', { defaultValue: 'Selected Images' })} ({uploadedFiles.length})
            </h2>
            <button
              onClick={processImages}
              disabled={isProcessing || uploadedFiles.some(f => f.status === 'processed')}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-semibold transition-colors flex items-center space-x-2"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>{t('upload.processing', { defaultValue: 'Analyzing Image...' })}</span>
                </>
              ) : (
                <>
                  <Image size={16} />
                  <span>{t('upload.analyzeImages', { defaultValue: 'Run Disease Diagnosis' })}</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {uploadedFiles.map((fileObj) => (
              <div key={fileObj.id} className="relative border border-gray-200 rounded-lg overflow-hidden">
                <img
                  src={fileObj.preview}
                  alt={fileObj.file.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-3">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {fileObj.file.name}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      fileObj.status === 'processed' 
                        ? 'bg-green-100 text-green-800' 
                        : fileObj.status === 'failed'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {fileObj.status === 'processed' ? 'Processed' : fileObj.status === 'failed' ? 'Failed' : 'Pending'}
                    </span>
                    <button
                      onClick={() => removeFile(fileObj.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800">{t('upload.result', { defaultValue: 'Diagnostic Results' })}</h2>
          {results.map((result) => {
            const previewImg = uploadedFiles.find(f => f.id === result.id)?.preview;

            if (result.isInvalid || result.error) {
              return (
                <div key={result.id} className="bg-red-50 border-2 border-red-300 rounded-2xl p-6 shadow-md flex items-start space-x-4">
                  <div className="p-2.5 bg-red-100 text-red-700 rounded-xl shrink-0">
                    <AlertTriangle size={24} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-red-900 text-base">
                      {t('sugarcane.invalidImageTitle', { defaultValue: 'Invalid Image!' })}
                    </h3>
                    <p className="text-sm text-red-800 font-medium">
                      {result.error || t('sugarcane.invalidImageNotice', { defaultValue: 'Invalid Image! Please upload a clear image of a sugarcane leaf to perform disease diagnosis.' })}
                    </p>
                  </div>
                </div>
              );
            }

            return (
              <div key={result.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 space-y-6">
                <div className="flex flex-col sm:flex-row items-start gap-5">
                  {previewImg && (
                    <div className="flex-shrink-0">
                      <img
                        src={previewImg}
                        alt={result.fileName}
                        className="w-32 h-32 object-cover rounded-xl border border-gray-200 shadow-sm"
                      />
                    </div>
                  )}
                  
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Target Crop</span>
                        <span className="text-sm font-extrabold text-emerald-700">🌱 Sugarcane (Saccharum officinarum)</span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${getSeverityColor(result.severity)}`}>
                        {result.severity} Severity
                      </span>
                    </div>

                    <div>
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Predicted Condition</span>
                      <h3 className="text-2xl font-black text-gray-900">
                        {t(`sugarcane.diseases.${result.disease}`, { defaultValue: result.disease })}
                      </h3>
                    </div>

                    {/* Confidence Bar */}
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-xs font-bold text-gray-600">
                        <span>
                          Diagnostic Confidence
                          {result.isConfident === false && (
                            <span className="ml-2 text-amber-600">({t('sugarcane.uncertainLabel', { defaultValue: 'Uncertain' })})</span>
                          )}
                        </span>
                        <span className="text-emerald-700 font-extrabold">
                          {Math.round((result.confidence || 0) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-2.5 rounded-full transition-all duration-700 ${result.isConfident === false ? 'bg-amber-500' : 'bg-emerald-600'}`}
                          style={{ width: `${Math.min(100, Math.max(10, (result.confidence || 0) * 100))}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Why AI Identified this */}
                {result.whyIdentified && (
                  <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-4 flex items-start space-x-2.5">
                    <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-1">Why AI Identified This Disease</h4>
                      <p className="text-xs text-gray-800 leading-relaxed font-medium">{result.whyIdentified}</p>
                    </div>
                  </div>
                )}

                {/* Symptoms */}
                {result.symptoms && (
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText size={15} className="text-emerald-600" />
                      <span>Symptoms & Visible Field Signs</span>
                    </h4>
                    <p className="text-xs text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100 leading-relaxed">
                      {result.symptoms}
                    </p>
                  </div>
                )}

                {/* Immediate Treatment */}
                {(result.immediateTreatmentList?.length > 0 || result.treatment) && (
                  <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-4 space-y-2">
                    <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle size={15} className="text-emerald-600" />
                      <span>Immediate Field Treatments (ICAR / VSI Aligned)</span>
                    </h4>
                    {result.immediateTreatmentList?.length > 0 ? (
                      <ul className="space-y-1.5 text-xs text-gray-800">
                        {result.immediateTreatmentList.map((act, i) => (
                          <li key={i} className="flex items-start">
                            <span className="text-emerald-600 font-bold mr-2">•</span>
                            <span>{act}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-gray-800">{result.treatment}</p>
                    )}
                  </div>
                )}

                {/* Prevention Methods */}
                {result.prevention?.length > 0 && (
                  <div className="bg-teal-50/70 border border-teal-100 rounded-xl p-4 space-y-2">
                    <h4 className="text-xs font-bold text-teal-900 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldAlert size={15} className="text-teal-600" />
                      <span>Prevention & Agronomic Practices</span>
                    </h4>
                    <ul className="space-y-1.5 text-xs text-gray-800">
                      {result.prevention.map((prev, i) => (
                        <li key={i} className="flex items-start">
                          <span className="text-teal-600 font-bold mr-2">•</span>
                          <span>{prev}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Products & Fertilizer */}
                {result.products?.disease_treatment_products?.length > 0 && (
                  <div className="space-y-3 pt-2 border-t border-gray-100">
                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                      <ShoppingBag size={15} className="text-emerald-600" />
                      <span>Verified Treatment Products</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {result.products.disease_treatment_products.map((prod, idx) => (
                        <div key={idx} className="border border-red-100 bg-red-50/30 rounded-xl p-3 flex flex-col justify-between space-y-2">
                          <div>
                            <div className="flex items-center justify-between">
                              <h5 className="font-bold text-xs text-gray-900">{prod.name}</h5>
                              <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">{prod.approx_price}</span>
                            </div>
                            <p className="text-[11px] text-gray-600 mt-1">{prod.why_recommended}</p>
                          </div>
                          <a
                            href={prod.purchase_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold py-1.5 px-3 rounded-lg text-center transition-colors flex items-center justify-center space-x-1"
                          >
                            <span>Buy on Official Portal</span>
                            <ExternalLink size={12} />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sources */}
                {result.sources && result.sources.length > 0 && (
                  <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <span className="font-bold">Sources:</span>
                    {result.sources.map((source, index) => (
                      <span key={index} className="bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full text-[11px] font-medium">
                        {source}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Tips */}
      <div className="bg-blue-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
          <AlertCircle size={20} className="mr-2" />
          Tips for Better Results
        </h3>
        <ul className="space-y-2 text-blue-700 text-sm">
          <li>• Take clear, well-lit photos of affected sugarcane leaves in natural daylight</li>
          <li>• Focus closely on lesions, streaks, or pustules on the leaf blade and midrib</li>
          <li>• Ensure the sugarcane leaf fills most of the frame without heavy blur or glare</li>
          <li>• Avoid uploading non-sugarcane plants or unrelated objects</li>
        </ul>
      </div>
    </div>
  );
};

export default Upload;
