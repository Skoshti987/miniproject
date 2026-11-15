const mongoose = require('mongoose');

const uploadSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    fileName: {
      type: String,
      required: true
    },
    mimeType: {
      type: String,
      default: 'image/jpeg'
    },
    imageData: {
      type: String,
      default: ''
    },
    size: {
      type: Number,
      default: 0
    },
    crop: {
      type: String,
      default: 'sugarcane'
    },
    disease: {
      type: String,
      required: true,
      default: 'Unknown'
    },
    confidence: {
      type: Number,
      default: 0.0
    },
    isConfident: {
      type: Boolean,
      default: true
    },
    severity: {
      type: String,
      default: 'Moderate'
    },
    symptoms: {
      type: String,
      default: ''
    },
    whyIdentified: {
      type: String,
      default: ''
    },
    causes: {
      type: String,
      default: ''
    },
    conditionsResponsible: {
      type: String,
      default: ''
    },
    summary: {
      type: String,
      default: ''
    },
    treatment: {
      type: [String],
      default: []
    },
    agriculturalPractices: {
      type: [String],
      default: []
    },
    prevention: {
      type: [String],
      default: []
    },
    fieldManagement: {
      type: String,
      default: ''
    },
    expertConsultation: {
      type: String,
      default: ''
    },
    products: {
      type: mongoose.Schema.Types.Mixed,
      default: {
        disease_treatment_products: [],
        crop_nutrition_fertilizers: []
      }
    },
    sources: {
      type: [String],
      default: ['KrishSathi Sugarcane AI Classifier', 'ICAR-SBI / VSI Advisory']
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Upload', uploadSchema);
