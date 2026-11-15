const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    name: {
      type: String,
      trim: true,
      default: ''
    },
    mobileNumber: {
      type: String,
      trim: true,
      default: ''
    },
    state: {
      type: String,
      trim: true,
      default: 'Maharashtra'
    },
    district: {
      type: String,
      trim: true,
      default: 'Kolhapur'
    },
    village: {
      type: String,
      trim: true,
      default: ''
    },
    farmLocation: {
      type: String,
      trim: true,
      default: ''
    },
    totalLand: {
      type: String,
      trim: true,
      default: '0'
    },
    sugarcaneArea: {
      type: String,
      trim: true,
      default: '0'
    },
    sugarcaneVariety: {
      type: String,
      trim: true,
      default: 'Co 86032'
    },
    farmingExperience: {
      type: String,
      trim: true,
      default: '0'
    },
    location: {
      type: String,
      trim: true,
      default: 'Kolhapur, Maharashtra'
    },
    language: {
      type: String,
      default: 'en'
    },
    crops: {
      type: [String],
      default: ['Sugarcane']
    },
    notifications: {
      weather: { type: Boolean, default: true },
      advisories: { type: Boolean, default: true },
      diseases: { type: Boolean, default: true },
      market: { type: Boolean, default: false }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
