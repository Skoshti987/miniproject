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
    size: {
      type: Number,
      default: 0
    },
    disease: {
      type: String,
      default: 'Unknown'
    },
    confidence: {
      type: Number,
      default: 0.7
    },
    recommendation: {
      type: String,
      default: 'Consult your nearest Krishi Bhavan officer for treatment guidance.'
    },
    treatment: {
      type: String,
      default: 'Use crop-specific treatment recommended by local agriculture experts.'
    },
    severity: {
      type: String,
      default: 'Moderate'
    },
    sources: {
      type: [String],
      default: ['Krishi Bhavan Advisory']
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Upload', uploadSchema);
