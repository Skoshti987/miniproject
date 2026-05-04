const express = require('express');
const router = express.Router();
const authRoutes = require('./auth');
const profileRoutes = require('./profile');
const queryRoutes = require('./query');
const uploadRoutes = require('./upload');
const weatherRoutes = require('./weather');

// Basic health check route
router.get('/', (req, res) => {
  res.json({ message: 'API is running...' });
});

router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/query', queryRoutes);
router.use('/upload', uploadRoutes);
router.use('/weather', weatherRoutes);

module.exports = router;
