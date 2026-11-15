const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/profile - Fetch authenticated user's profile
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json({ success: true, user });
  } catch (error) {
    console.error('Error fetching profile:', error.message);
    return res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

// PUT /api/profile - Update authenticated user's profile with all 11 fields
router.put('/', auth, async (req, res) => {
  try {
    const {
      name,
      mobileNumber,
      state,
      district,
      village,
      farmLocation,
      totalLand,
      sugarcaneArea,
      sugarcaneVariety,
      farmingExperience,
      language,
      crops,
      notifications
    } = req.body;

    const updates = {};
    if (typeof name === 'string') updates.name = name.trim();
    if (typeof mobileNumber === 'string') updates.mobileNumber = mobileNumber.trim();
    if (typeof state === 'string') updates.state = state.trim();
    if (typeof district === 'string') updates.district = district.trim();
    if (typeof village === 'string') updates.village = village.trim();
    if (typeof farmLocation === 'string') updates.farmLocation = farmLocation.trim();
    if (totalLand !== undefined) updates.totalLand = String(totalLand).trim();
    if (sugarcaneArea !== undefined) updates.sugarcaneArea = String(sugarcaneArea).trim();
    if (typeof sugarcaneVariety === 'string') updates.sugarcaneVariety = sugarcaneVariety.trim();
    if (farmingExperience !== undefined) updates.farmingExperience = String(farmingExperience).trim();
    if (typeof language === 'string') updates.language = language.trim();
    if (Array.isArray(crops)) updates.crops = crops;
    if (notifications && typeof notifications === 'object') updates.notifications = notifications;

    // Keep location synced with district & state for weather/advisory
    if (updates.district || updates.state) {
      updates.location = `${updates.district || 'Kolhapur'}, ${updates.state || 'Maharashtra'}`;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-passwordHash');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating profile:', error.message);
    return res.status(500).json({ message: 'Failed to update profile' });
  }
});

module.exports = router;
