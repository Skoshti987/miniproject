const express = require('express');
const multer = require('multer');
const Upload = require('../models/Upload');
const auth = require('../middleware/auth');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const randomConfidence = () => Number((Math.random() * 0.35 + 0.6).toFixed(2));
const randomSeverity = () => (Math.random() > 0.5 ? 'Moderate' : 'High');

router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Image file is required' });
    }

    const result = await Upload.create({
      userId: req.user.id,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      disease: 'Rice Blast',
      confidence: randomConfidence(),
      recommendation: 'Apply fungicide containing tricyclazole every 7-10 days during humid conditions.',
      treatment: 'Follow district agriculture office dosage recommendation.',
      severity: randomSeverity(),
      sources: ['ICAR Plant Disease Handbook', 'Kerala Agriculture Department Advisory']
    });

    return res.status(201).json({
      id: result._id,
      fileName: result.fileName,
      disease: result.disease,
      confidence: result.confidence,
      recommendation: result.recommendation,
      treatment: result.treatment,
      severity: result.severity,
      sources: result.sources
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to process image' });
  }
});

module.exports = router;
