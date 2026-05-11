const express = require('express');
const Query = require('../models/Query');
const auth = require('../middleware/auth');

const router = express.Router();
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const buildFarmerFriendlyPrompt = ({ query, language, location }) => {
  return [
    'You are KrishSathi, a practical farming assistant for Indian farmers.',
    'Your job: give advice that a farmer can apply today in the field.',
    `Respond in ${language || 'en'} (use simple words).`,
    `Farmer location/context: ${location || 'India'}.`,
    '',
    'Before answering, think: crop + stage + main symptom/problem + urgency + local climate/season.',
    'If missing critical details, ask EXACTLY 1 short follow-up question first (and still give safe general steps).',
    '',
    'Write the answer in this format (use headings exactly):',
    '1) Quick answer (2-3 lines)',
    '2) What to do now (3-6 bullet steps)',
    '3) If it is disease/pest: simple identification checks (2-4 bullets)',
    '4) Safe chemical option (only if relevant)',
    '   - Mention active ingredient examples (not brand names), and say: "follow label dose"',
    '   - Mention waiting period/PHI if you are sure; otherwise say to confirm with local officer',
    '5) Organic/low-cost option (1-3 bullets)',
    '6) When to contact Krishi Bhavan (2-3 bullets)',
    '',
    'Rules:',
    '- Keep sentences short. Prefer bullets.',
    '- Use Indian-friendly units (acre/hectare, litres, kg).',
    '- Be farmer oriented: cost-saving, easy steps, locally available inputs.',
    '- Do NOT give medical advice.',
    '- Do NOT invent government scheme names, exact subsidy amounts, or guaranteed yields.',
    '- If you are not sure, say so and give safest next step.',
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
      temperature: 0.25,
      max_tokens: 700,
      messages: [
        {
          role: 'system',
          content:
            [
              'You are a senior agricultural extension officer in India.',
              'Give practical, safe, farmer-friendly advice.',
              'Be specific and actionable. Avoid generic motivational lines.',
              'If the user asks for pesticide/fungicide doses, do not guess exact dose; recommend checking local label / officer, and focus on IPM + timing + precautions.',
              'Do not mention you are an AI model.',
              'Do not output markdown tables.'
            ].join(' ')
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
