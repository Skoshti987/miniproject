const express = require('express');
const multer = require('multer');
const auth = require('../middleware/auth');
const Upload = require('../models/Upload');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

router.post('/predict', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a sugarcane leaf image.'
      });
    }

    const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
    const formData = new FormData();
    formData.append('image', blob, req.file.originalname);

    const mlResponse = await fetch(`${ML_SERVICE_URL}/predict`, {
      method: 'POST',
      body: formData
    });

    if (!mlResponse.ok) {
      const errText = await mlResponse.text();
      console.error('ML Service Error:', errText);
      return res.status(502).json({
        success: false,
        message: 'Sugarcane disease prediction service is currently unavailable. Please try again.'
      });
    }

    const predictionData = await mlResponse.json();

    // Optionally save prediction if user authenticated
    if (req.user && req.user.id) {
      try {
        await Upload.create({
          userId: req.user.id,
          fileName: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size,
          disease: predictionData.prediction?.class || 'Unknown',
          confidence: predictionData.prediction?.confidence || 0,
          recommendation: predictionData.recommendation?.summary || '',
          treatment: (predictionData.recommendation?.actions || []).join('; '),
          severity: predictionData.recommendation?.severity || 'Moderate',
          sources: ['KrishSathi ML Sugarcane Classifier']
        });
      } catch (dbErr) {
        console.warn('Could not save upload record to DB:', dbErr.message);
      }
    }

    return res.json(predictionData);

  } catch (error) {
    console.error('Disease prediction route error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Unable to analyze the sugarcane leaf image right now. Please try again.'
    });
  }
});

module.exports = router;
