import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  History, 
  Trash2, 
  Calendar, 
  CheckCircle, 
  ChevronDown, 
  ChevronUp, 
  ArrowLeft, 
  Activity, 
  ShoppingBag,
  ExternalLink,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const DiagnosisHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    fetchHistory();
  }, [user]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await api('/disease/history');
      if (res && res.history) {
        setHistory(res.history);
      }
    } catch (err) {
      console.error('Failed to load diagnosis history:', err);
      toast.error('Failed to load diagnosis history');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this diagnosis record?')) return;
    try {
      setDeletingId(id);
      await api(`/disease/history/${id}`, { method: 'DELETE' });
      setHistory((prev) => prev.filter((item) => item._id !== id));
      toast.success('Diagnosis record deleted successfully');
    } catch (err) {
      toast.error(err?.message || 'Failed to delete record');
    } finally {
      setDeletingId(null);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
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

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4">
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 md:p-12 text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
            <History size={40} />
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">
            Sign In to View Diagnosis History
          </h2>
          <p className="text-gray-600 max-w-md mx-auto text-base">
            Your disease diagnoses, uploaded leaf photos, and customized agricultural recommendations are securely saved to your farmer profile.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-2">
            <Link
              to="/login"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-8 rounded-xl shadow-md transition-all"
            >
              Log In to My Account
            </Link>
            <Link
              to="/sugarcane-disease"
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3.5 px-6 rounded-xl transition-colors"
            >
              Diagnose a Leaf as Guest
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-800 to-green-700 p-6 md:p-8 rounded-3xl text-white shadow-lg">
        <div>
          <Link
            to="/sugarcane-disease"
            className="inline-flex items-center text-xs font-semibold text-emerald-200 hover:text-white mb-2 transition-colors"
          >
            <ArrowLeft size={14} className="mr-1" />
            Back to Disease Detector
          </Link>
          <h1 className="text-2xl md:text-3xl font-black flex items-center gap-3">
            <History size={28} />
            <span>Sugarcane Diagnosis History</span>
          </h1>
          <p className="text-emerald-100 text-sm mt-1">
            Permanent records of your leaf analyses, diagnostic confidence, and treatment plans.
          </p>
        </div>

        <Link
          to="/sugarcane-disease"
          className="self-start sm:self-center bg-white text-emerald-900 hover:bg-emerald-50 px-5 py-3 rounded-xl font-bold text-sm shadow transition-all flex items-center space-x-2"
        >
          <Activity size={18} />
          <span>New Diagnosis</span>
        </Link>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="bg-white rounded-3xl shadow-md p-12 text-center border border-gray-100">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Loading your saved diagnoses from MongoDB...</p>
        </div>
      ) : history.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-md p-12 text-center border border-gray-100 space-y-4">
          <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-800">No Diagnoses Found Yet</h3>
          <p className="text-gray-500 max-w-md mx-auto text-sm">
            You have not diagnosed any sugarcane leaves yet while logged in. Upload a sugarcane leaf photo to start building your diagnosis record.
          </p>
          <Link
            to="/sugarcane-disease"
            className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl shadow-md transition-all text-sm mt-2"
          >
            Diagnose First Leaf
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500 px-2 uppercase tracking-wider">
            <span>Saved Records ({history.length})</span>
            <span>Sorted by Recent</span>
          </div>

          {history.map((record) => {
            const isExpanded = expandedId === record._id;
            const dateStr = record.createdAt
              ? new Date(record.createdAt).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })
              : 'Recent';

            return (
              <div
                key={record._id}
                className="bg-white rounded-2xl shadow-sm border border-gray-200/80 hover:border-emerald-300 transition-all overflow-hidden"
              >
                {/* Summary Row */}
                <div className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    {/* Thumbnail Image */}
                    {record.imageData ? (
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-900 flex-shrink-0 border border-gray-200">
                        <img
                          src={record.imageData}
                          alt={record.fileName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg flex-shrink-0">
                        🌱
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-lg font-extrabold text-gray-900">
                          {record.disease}
                        </h4>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getSeverityBadgeClass(record.severity)}`}>
                          {record.severity} Severity
                        </span>
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          {Math.round((record.confidence || 0) * 100)}% Confidence
                        </span>
                      </div>

                      <div className="flex items-center text-xs text-gray-500 space-x-3">
                        <span className="flex items-center">
                          <Calendar size={13} className="mr-1" />
                          {dateStr}
                        </span>
                        <span>•</span>
                        <span>{record.fileName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-end md:self-center">
                    <button
                      onClick={() => toggleExpand(record._id)}
                      className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1"
                    >
                      <span>{isExpanded ? 'Hide Details' : 'View Treatment'}</span>
                      {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </button>

                    <button
                      onClick={() => handleDelete(record._id)}
                      disabled={deletingId === record._id}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      title="Delete Record"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Expanded Details Card */}
                {isExpanded && (
                  <div className="bg-gray-50/70 border-t border-gray-100 p-5 md:p-6 space-y-5 animate-fade-in text-sm">
                    {/* Why Identified */}
                    {record.whyIdentified && (
                      <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-4">
                        <span className="text-xs font-bold text-blue-900 uppercase tracking-wider block mb-1">
                          Why the AI Identified This Disease:
                        </span>
                        <p className="text-gray-800 text-xs md:text-sm leading-relaxed">
                          {record.whyIdentified}
                        </p>
                      </div>
                    )}

                    {/* Symptoms */}
                    {record.symptoms && (
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Symptoms Observed:</span>
                        <p className="text-xs md:text-sm text-gray-800 bg-white p-3.5 rounded-xl border border-gray-200 leading-relaxed">
                          {record.symptoms}
                        </p>
                      </div>
                    )}

                    {/* Immediate Treatment */}
                    {record.treatment && record.treatment.length > 0 && (
                      <div className="bg-emerald-50/80 border border-emerald-100 rounded-xl p-4 space-y-2">
                        <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center">
                          <CheckCircle size={15} className="mr-1.5 text-emerald-600" />
                          Recommended Field Treatments:
                        </span>
                        <ul className="space-y-1.5 pl-2">
                          {record.treatment.map((act, idx) => (
                            <li key={idx} className="text-xs md:text-sm text-gray-800 leading-relaxed list-disc ml-3">
                              {act}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Recommended Products */}
                    {record.products && (
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center space-x-1.5 text-xs font-bold text-gray-700 uppercase tracking-wider">
                          <ShoppingBag size={15} className="text-emerald-600" />
                          <span>Recommended Agricultural Products:</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {(record.products.disease_treatment_products || []).concat(record.products.crop_nutrition_fertilizers || []).map((prod, idx) => (
                            <div key={idx} className="bg-white p-3.5 rounded-xl border border-gray-200 space-y-2 flex flex-col justify-between">
                              <div>
                                <div className="flex justify-between items-start gap-2">
                                  <h6 className="font-extrabold text-xs text-gray-900">{prod.name}</h6>
                                  {prod.approx_price && (
                                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                      {prod.approx_price}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-gray-600 mt-1 line-clamp-2">{prod.purpose || prod.why_recommended}</p>
                              </div>

                              {prod.purchase_link && (
                                <a
                                  href={prod.purchase_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] text-emerald-700 font-bold hover:underline inline-flex items-center space-x-1"
                                >
                                  <span>View on Official Store</span>
                                  <ExternalLink size={11} />
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Ask Chatbot Button */}
                    <div className="pt-2">
                      <button
                        onClick={() => {
                          const contextPrompt = `Regarding my previous diagnosis of ${record.disease} (${Math.round((record.confidence || 0) * 100)}% confidence) recorded on ${dateStr}, what are the next field steps I should take?`;
                          navigate('/query', { state: { prefillQuery: contextPrompt } });
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow transition-colors inline-flex items-center space-x-2"
                      >
                        <MessageSquare size={14} />
                        <span>Ask Chatbot About This Diagnosis</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DiagnosisHistory;
