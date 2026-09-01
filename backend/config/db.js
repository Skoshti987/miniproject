const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/miniproject';
    await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 3000 });
    console.log('MongoDB Connected successfully...');
  } catch (err) {
    console.warn('Warning: Could not connect to MongoDB:', err.message);
    console.warn('Backend server will continue in memory/graceful mode.');
  }
};

module.exports = connectDB;
