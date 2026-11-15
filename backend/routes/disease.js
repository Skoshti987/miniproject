const express = require('express');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const Upload = require('../models/Upload');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:5001';

// Optional auth helper: attaches req.user if Authorization header is provided
const optionalAuth = (req, res, next) => {
  const header = req.header('Authorization');
  if (!header || !header.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }
  const token = header.replace('Bearer ', '').trim();
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_jwt_secret');
    req.user = decoded;
  } catch (error) {
    req.user = null;
  }
  return next();
};

// POST /api/disease/predict - Predict sugarcane leaf disease & persist if authenticated
router.post('/predict', optionalAuth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        status: 'invalid_image',
        valid_leaf: false,
        message: 'Invalid Image! Please upload a clear image of a sugarcane leaf to perform disease diagnosis.'
      });
    }

    const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
    const formData = new FormData();
    formData.append('image', blob, req.file.originalname);

    let mlResponse;
    try {
      mlResponse = await fetch(`${ML_SERVICE_URL}/predict`, {
        method: 'POST',
        body: formData
      });
    } catch (fetchErr) {
      console.error('Failed to reach ML service:', fetchErr.message);
      return res.status(502).json({
        success: false,
        message: 'Sugarcane disease prediction service is currently offline. Please ensure ML service is running.'
      });
    }

    if (!mlResponse.ok) {
      const errText = await mlResponse.text();
      console.error('ML Service Error:', errText);
      return res.status(502).json({
        success: false,
        message: 'Sugarcane disease prediction service returned an error. Please try again.'
      });
    }

    const predictionData = await mlResponse.json();

    // Check if the ML service identified an invalid or non-sugarcane image
    if (predictionData.status === 'invalid_image' || predictionData.valid_leaf === false || !predictionData.success || !predictionData.prediction) {
      return res.json({
        success: false,
        status: 'invalid_image',
        valid_leaf: false,
        disease: null,
        confidence: null,
        severity: null,
        treatment: null,
        message: predictionData.message || 'Invalid Image! Please upload a clear image of a sugarcane leaf to perform disease diagnosis.'
      });
    }

    let savedRecordId = null;

    // Persist diagnosis in MongoDB if user is authenticated and image is a valid sugarcane leaf
    if (req.user && req.user.id) {
      try {
        // Create a compact Base64 thumbnail for fast rendering in history
        const base64Data = req.file.buffer.length <= 1.5 * 1024 * 1024
          ? `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`
          : '';

        const rec = predictionData.recommendation || {};
        const saved = await Upload.create({
          userId: req.user.id,
          fileName: req.file.originalname,
          mimeType: req.file.mimetype,
          imageData: base64Data,
          size: req.file.size,
          crop: 'sugarcane',
          disease: predictionData.prediction?.class || 'Unknown',
          confidence: predictionData.prediction?.confidence || 0,
          isConfident: predictionData.prediction?.is_confident ?? true,
          severity: rec.severity || 'Moderate',
          symptoms: rec.symptoms || '',
          whyIdentified: predictionData.prediction?.why_identified || rec.why_identified || '',
          causes: rec.causes || '',
          conditionsResponsible: rec.conditions_responsible || '',
          summary: rec.summary || '',
          treatment: rec.immediate_treatment || rec.actions || [],
          agriculturalPractices: rec.agricultural_practices || [],
          prevention: rec.prevention_methods || rec.prevention || [],
          fieldManagement: rec.field_management || '',
          expertConsultation: rec.expert_consultation || '',
          products: predictionData.products || {
            disease_treatment_products: [],
            crop_nutrition_fertilizers: []
          },
          sources: ['KrishSathi Sugarcane AI Classifier', 'ICAR-SBI / VSI Advisory']
        });
        savedRecordId = saved._id;
      } catch (dbErr) {
        console.warn('Could not save diagnosis to MongoDB:', dbErr.message);
      }
    }

    return res.json({
      ...predictionData,
      historyId: savedRecordId
    });

  } catch (error) {
    console.error('Disease prediction route error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Unable to analyze the sugarcane leaf image right now. Please try again.'
    });
  }
});

// GET /api/disease/history - Fetch diagnosis history for authenticated user
router.get('/history', auth, async (req, res) => {
  try {
    const history = await Upload.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);

    return res.json({
      success: true,
      count: history.length,
      history
    });
  } catch (error) {
    console.error('Error fetching diagnosis history:', error.message);
    return res.status(500).json({ message: 'Failed to fetch diagnosis history' });
  }
});

// DELETE /api/disease/history/:id - Delete a diagnosis record for authenticated user
router.delete('/history/:id', auth, async (req, res) => {
  try {
    const deleted = await Upload.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!deleted) {
      return res.status(404).json({ message: 'Diagnosis record not found' });
    }

    return res.json({ success: true, message: 'Diagnosis record deleted' });
  } catch (error) {
    console.error('Error deleting diagnosis record:', error.message);
    return res.status(500).json({ message: 'Failed to delete diagnosis record' });
  }
});

module.exports = router;
