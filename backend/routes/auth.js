const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

const issueToken = (user) =>
  jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET || 'dev_jwt_secret', {
    expiresIn: '7d'
  });

const formatUserResponse = (user) => ({
  id: user._id,
  email: user.email,
  name: user.name || '',
  mobileNumber: user.mobileNumber || '',
  state: user.state || 'Maharashtra',
  district: user.district || 'Kolhapur',
  village: user.village || '',
  farmLocation: user.farmLocation || '',
  totalLand: user.totalLand || '0',
  sugarcaneArea: user.sugarcaneArea || '0',
  sugarcaneVariety: user.sugarcaneVariety || 'Co 86032',
  farmingExperience: user.farmingExperience || '0',
  location: user.location || 'Kolhapur, Maharashtra',
  language: user.language || 'en',
  crops: user.crops || ['Sugarcane'],
  notifications: user.notifications || {
    weather: true,
    advisories: true,
    diseases: true,
    market: false
  }
});

router.post('/signup', async (req, res) => {
  try {
    const { email, password, name = '', mobileNumber = '' } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({ message: 'Email is already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      passwordHash,
      name,
      mobileNumber
    });
    const token = issueToken(user);

    return res.status(201).json({
      success: true,
      token,
      user: formatUserResponse(user)
    });
  } catch (error) {
    console.error('Signup error:', error.message);
    return res.status(500).json({ message: 'Failed to create account' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = issueToken(user);
    return res.json({
      success: true,
      token,
      user: formatUserResponse(user)
    });
  } catch (error) {
    console.error('Login error:', error.message);
    return res.status(500).json({ message: 'Login failed' });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json({ success: true, user: formatUserResponse(user) });
  } catch (error) {
    console.error('Profile fetch error:', error.message);
    return res.status(500).json({ message: 'Failed to load profile' });
  }
});

module.exports = router;
