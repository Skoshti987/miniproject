const express = require('express');
const Query = require('../models/Query');
const auth = require('../middleware/auth');

const router = express.Router();
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const buildFarmerFriendlyPrompt = ({ query, language, location }) => {
  return [
    'You are KrishSathi, a practical farming assistant for Indian farmers.',
    'Give helpful agricultural advice in very simple, farmer-friendly words.',
    `Respond in this language code if possible: ${language || 'en'}.`,
    `Farmer location/context: ${location || 'India'}.`,
    '',
    'Response rules:',
    '- Keep sentences short and clear.',
    '- Avoid technical jargon. If needed, explain in easy words.',
    '- Give step-by-step actions the farmer can do now.',
    '- Mention simple precautions for safety.',
    '- If the query is unclear, ask one short follow-up question.',
    '- Do not invent exact government schemes, prices, or weather forecasts.',
    '',
    `Farmer question: ${query}`
  ].join('\n');
};

const getGroqAnswer = async ({ query, language, location }) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('Missing GROQ_API_KEY');
  }

  const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      max_tokens: 500,
      messages: [
        {
          role: 'system',
          content:
            'You are a trusted agri advisor. Give practical and safe crop guidance in easy farmer language.'
        },
        {
          role: 'user',
          content: buildFarmerFriendlyPrompt({ query, language, location })
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error ${response.status}: ${errorText}`);
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error('Empty response from Groq');
  }

  return content;
};

router.post('/', auth, async (req, res) => {
  try {
    const { query, language = 'en', location = 'India' } = req.body;
    if (!query || !query.trim()) {
      return res.status(400).json({ message: 'Query text is required' });
    }

    const answer = await getGroqAnswer({
      query: query.trim(),
      language,
      location
    });

    const sources = [
      { title: 'Groq LLM Advisory', date: new Date().toISOString().split('T')[0] },
      { title: 'Local Krishi Bhavan / ICAR Best Practices', date: new Date().toISOString().split('T')[0] }
    ];

    const saved = await Query.create({
      userId: req.user.id,
      query: query.trim(),
      language,
      location,
      answer,
      sources
    });

    return res.status(201).json({
      id: saved._id,
      answer: saved.answer,
      sources: saved.sources
    });
  } catch (error) {
    console.error('Query processing error:', error.message);
    return res.status(500).json({ message: 'Failed to process query' });
  }
});

router.post('/feedback', auth, async (req, res) => {
  try {
    const { queryId, helpful } = req.body;
    if (!queryId || typeof helpful !== 'boolean') {
      return res.status(400).json({ message: 'queryId and helpful are required' });
    }

    const updated = await Query.findOneAndUpdate(
      { _id: queryId, userId: req.user.id },
      { feedback: helpful },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Query not found' });
    }

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to save feedback' });
  }
});

router.post('/escalate', auth, async (req, res) => {
  try {
    const { queryId } = req.body;
    if (!queryId) {
      return res.status(400).json({ message: 'queryId is required' });
    }

    const updated = await Query.findOneAndUpdate(
      { _id: queryId, userId: req.user.id },
      { escalated: true },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Query not found' });
    }

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to escalate query' });
  }
});

module.exports = router;
