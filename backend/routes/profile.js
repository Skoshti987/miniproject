const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

router.put('/', auth, async (req, res) => {
  try {
    const updates = req.body;
    const allowed = ['name', 'location', 'language', 'crops', 'notifications'];
    const filtered = {};

    allowed.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(updates, key)) {
        filtered[key] = updates[key];
      }
    });

    const user = await User.findByIdAndUpdate(req.user.id, filtered, { new: true }).select('-passwordHash');
    return res.json({ user });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update profile' });
  }
});

module.exports = router;
