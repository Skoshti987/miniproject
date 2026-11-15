const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Upload = require('../models/Upload');
const Query = require('../models/Query');

const router = express.Router();

// GET /api/dashboard/stats - Fetch aggregated stats and recent records for the logged-in user
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Fetch User Profile
    const user = await User.findById(userId).select('-passwordHash');

    // 2. Fetch Diagnosis Counts & Recent Diagnoses
    const [totalDiagnoses, recentDiagnoses] = await Promise.all([
      Upload.countDocuments({ userId }),
      Upload.find({ userId })
        .sort({ createdAt: -1 })
        .limit(4)
        .select('_id fileName disease confidence isConfident severity symptoms createdAt imageData products')
    ]);

    // 3. Fetch Query Counts & Recent Conversations
    const [totalQueries, recentQueries] = await Promise.all([
      Query.countDocuments({ userId }),
      Query.find({ userId })
        .sort({ createdAt: -1 })
        .limit(4)
        .select('_id query answer language createdAt feedback')
    ]);

    // 4. Compute Disease Breakdown
    const diseaseBreakdown = await Upload.aggregate([
      { $match: { userId: new (require('mongoose').Types.ObjectId)(userId) } },
      { $group: { _id: '$disease', count: { $sum: 1 } } }
    ]);

    return res.json({
      success: true,
      stats: {
        totalDiagnoses,
        totalQueries,
        diseaseBreakdown: diseaseBreakdown.map((d) => ({ disease: d._id, count: d.count }))
      },
      farmingProfile: {
        name: user?.name || '',
        email: user?.email || '',
        mobileNumber: user?.mobileNumber || '',
        state: user?.state || 'Maharashtra',
        district: user?.district || 'Kolhapur',
        village: user?.village || '',
        farmLocation: user?.farmLocation || '',
        totalLand: user?.totalLand || '0',
        sugarcaneArea: user?.sugarcaneArea || '0',
        sugarcaneVariety: user?.sugarcaneVariety || 'Co 86032',
        farmingExperience: user?.farmingExperience || '0'
      },
      recentDiagnoses,
      recentQueries
    });
  } catch (error) {
    console.error('Dashboard stats error:', error.message);
    return res.status(500).json({ message: 'Failed to fetch dashboard statistics' });
  }
});

module.exports = router;

