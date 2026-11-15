const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const seedDemoUser = async () => {
  try {
    const User = require('../models/User');
    const existing = await User.findOne({ email: 'demo@krishsathi.org' });
    if (!existing) {
      const hash = await bcrypt.hash('farmer123', 10);
      await User.create({
        email: 'demo@krishsathi.org',
        passwordHash: hash,
        name: 'Sayali Koshti',
        mobileNumber: '9876543210',
        state: 'Maharashtra',
        district: 'Kolhapur',
        village: 'Shirol',
        farmLocation: 'Shirol, Kolhapur',
        totalLand: '6.0',
        sugarcaneArea: '4.5',
        sugarcaneVariety: 'Co 86032',
        farmingExperience: '8',
        location: 'Kolhapur, Maharashtra'
      });
      console.log('Seeded demo farmer account: demo@krishsathi.org / farmer123');
    }
  } catch (seedErr) {
    console.warn('Could not seed demo account:', seedErr.message);
  }
};

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/miniproject';
    await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 3000 });
    console.log('MongoDB Connected successfully...');
    await seedDemoUser();
  } catch (err) {
    console.warn('Warning: Could not connect to MongoDB:', err.message);
    console.warn('Backend server will continue in memory/graceful mode.');
  }
};

module.exports = connectDB;
