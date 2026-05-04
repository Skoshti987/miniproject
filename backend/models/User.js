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
    location: {
      type: String,
      trim: true,
      default: ''
    },
    language: {
      type: String,
      default: 'en'
    },
    crops: {
      type: [String],
      default: []
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
