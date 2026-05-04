const mongoose = require('mongoose');

const querySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    query: {
      type: String,
      required: true,
      trim: true
    },
    language: {
      type: String,
      default: 'en'
    },
    location: {
      type: String,
      default: 'Kerala, India'
    },
    answer: {
      type: String,
      default: ''
    },
    sources: {
      type: [{ title: String, date: String }],
      default: []
    },
    feedback: {
      type: Boolean,
      default: null
    },
    escalated: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Query', querySchema);
