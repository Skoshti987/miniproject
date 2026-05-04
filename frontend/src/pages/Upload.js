import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDropzone } from 'react-dropzone';
import { Upload as UploadIcon, Image, AlertCircle, CheckCircle, X } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../services/api';

const Upload = () => {
  const { t } = useTranslation();
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
    
    setUploadedFiles(prev => [...prev, ...newFiles]);
    toast.success(`${acceptedFiles.length} file(s) uploaded successfully`);
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
  };

  const processImages = async () => {
    if (uploadedFiles.length === 0) return;

    setIsProcessing(true);
    setResults([]);

    try {
      // Simulate processing each image
      for (const fileObj of uploadedFiles) {
        const formData = new FormData();
        formData.append('image', fileObj.file);
        formData.append('language', 'en'); // Get from i18n

        const data = await api('/upload', {
          method: 'POST',
          body: formData,
        });
        setResults(prev => [...prev, { ...data, id: fileObj.id }]);
        
        // Update file status
        setUploadedFiles(prev => 
          prev.map(f => f.id === fileObj.id ? { ...f, status: 'processed' } : f)
        );
      }

      toast.success('All images processed successfully!');
    } catch (error) {
      console.error('Error processing images:', error);
      toast.error('Failed to process images. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
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
          {t('upload.title')}
        </h1>
        <p className="text-gray-600">
          Upload plant images for AI-powered disease diagnosis
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
            {isDragActive ? 'Drop images here' : t('upload.dragDrop')}
          </p>
          <p className="text-sm text-gray-500 mb-4">
            {t('upload.supportedFormats')}
          </p>
          <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors">
            Choose Files
          </button>
        </div>
      </div>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Uploaded Images ({uploadedFiles.length})
            </h2>
            <button
              onClick={processImages}
              disabled={isProcessing || uploadedFiles.some(f => f.status === 'processed')}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-semibold transition-colors flex items-center space-x-2"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>{t('upload.processing')}</span>
                </>
              ) : (
                <>
                  <Image size={16} />
                  <span>Analyze Images</span>
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
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {fileObj.status === 'processed' ? 'Processed' : 'Pending'}
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
          <h2 className="text-2xl font-bold text-gray-800">{t('upload.result')}</h2>
          {results.map((result) => (
            <div key={result.id} className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <img
                    src={uploadedFiles.find(f => f.id === result.id)?.preview}
                    alt={result.fileName}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {result.fileName}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(result.severity)}`}>
                      {result.severity} Severity
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-1">{t('upload.disease')}</h4>
                      <p className="text-gray-600">{result.disease}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-1">{t('upload.confidence')}</h4>
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${result.confidence * 100}%` }}
                          ></div>
                        </div>
                        <span className={`text-sm font-medium ${getConfidenceColor(result.confidence)}`}>
                          {Math.round(result.confidence * 100)}%
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-1">{t('upload.recommendation')}</h4>
                      <p className="text-gray-600">{result.recommendation}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-1">{t('upload.treatment')}</h4>
                      <p className="text-gray-600">{result.treatment}</p>
                    </div>
                    
                    {result.sources && result.sources.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-1">Sources</h4>
                        <div className="space-y-1">
                          {result.sources.map((source, index) => (
                            <div key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span>{source}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tips */}
      <div className="bg-blue-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
          <AlertCircle size={20} className="mr-2" />
          Tips for Better Results
        </h3>
        <ul className="space-y-2 text-blue-700">
          <li>• Take clear, well-lit photos of affected plant parts</li>
          <li>• Include both healthy and diseased areas for comparison</li>
          <li>• Ensure the plant part fills most of the frame</li>
          <li>• Avoid blurry or dark images</li>
          <li>• Upload multiple angles if possible</li>
        </ul>
      </div>
    </div>
  );
};

export default Upload;
