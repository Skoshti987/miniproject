const express = require('express');
const Query = require('../models/Query');
const auth = require('../middleware/auth');

const router = express.Router();
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const buildFarmerFriendlyPrompt = ({ query, language, location }) => {
  return [
    'You are KrishSathi, a specialized AI assistant for Sugarcane Farmers in India.',
    'Your primary domain is SUGARCANE FARMING (crop care, soil, tillering, grand growth, harvesting, ratoon management, pests, and leaf diseases like Red Rot, Mosaic, Rust, Yellow Leaf).',
    'Your job: give clear, practical sugarcane advice that a farmer can apply today in the field.',
    `Respond in ${language || 'en'} (use simple farmer-friendly words).`,
    `Farmer location/context: ${location || 'India'}.`,
    '',
    'Before answering, consider sugarcane crop stage (planting/tillering/grand growth/maturity), soil moisture, and weather.',
    'If missing critical details, ask EXACTLY 1 short follow-up question first (and still give safe general sugarcane guidance).',
    '',
    'Write the answer in this format (use headings exactly):',
    '1) Quick answer (2-3 lines)',
    '2) Recommended field actions (3-6 bullet steps)',
    '3) Disease/Pest identification tips (if applicable, 2-4 bullets)',
    '4) Safe chemical option (only if relevant; active ingredients only, mention label dose)',
    '5) Organic / Bio-control option (1-3 bullets e.g. Trichoderma, neem oil, trash mulching)',
    '6) When to consult Krishi Bhavan / Sugar Mill Agriculture Officer',
    '',
    'Rules:',
    '- Prioritize sugarcane best practices (sett treatment, wide row spacing 4-5ft, drip/trench irrigation, ratoon care).',
    '- Keep sentences short. Prefer bullets.',
    '- Use Indian-friendly units (acre, quintal/ton, litres, kg).',
    '- Be farmer oriented: cost-saving, locally available inputs.',
    '- Do NOT give medical advice or invent fake government subsidy numbers.',
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

const optionalAuth = (req, res, next) => {
  const header = req.header('Authorization');
  if (!header || !header.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }
  const token = header.replace('Bearer ', '').trim();
  try {
    const jwt = require('jsonwebtoken');
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'dev_jwt_secret');
  } catch (error) {
    req.user = null;
  }
  next();
};

const getFallbackSugarcaneAnswer = (query) => {
  const q = query.toLowerCase();
  
  if (q.includes('red rot')) {
    return `1) Quick answer:
Red Rot (Colletotrichum falcatum) is a serious fungal disease causing internal stalk reddening, white cross-patches, and sour alcoholic odor in sugarcane.

2) Recommended field actions:
• Uproot and burn infected sugarcane clumps immediately to prevent field spread.
• Ensure effective field drainage to avoid standing water around roots.
• Soak setts in Carbendazim 0.1% or Trichoderma viride solution prior to planting.
• Rotate sugarcane with paddy or legumes every 2-3 years.

3) Disease identification tips:
• Upper leaves start yellowing and drying out from tip downwards.
• Splitting affected stalks longitudinally reveals red lesions with characteristic white transverse bands.

4) Organic / Bio-control option:
• Mix Trichoderma viride (2.5 kg/acre) with well-rotted Farmyard Manure (FYM) during soil preparation.
• Use hot water treated (50°C for 2 hours) disease-free seed setts.

5) When to consult Krishi Bhavan / Sugar Mill:
Contact your local Sugar Mill Agriculture Officer immediately for replacement of susceptible varieties like Co 0238.`;
  }
  
  if (q.includes('mosaic')) {
    return `1) Quick answer:
Sugarcane Mosaic Virus causes chlorotic yellow/green leaf mottling, which hampers photosynthesis and reduces crop yield.

2) Recommended field actions:
• Use certified virus-free tissue culture setts for new planting.
• Monitor and control aphid populations which spread the virus.
• Remove and safely dispose of infected young tillers.

3) Disease identification tips:
• Alternating dark green and light green/yellow elongated islands or streaks along leaf veins.

4) Organic / Bio-control option:
• Spray Neem oil (3ml/litre of water) to control aphid vector populations naturally.
• Keep field borders clean and free from grass weeds.

5) When to consult Krishi Bhavan / Sugar Mill:
Consult Krishi Vigyan Kendra (KVK) for seed nursery viral indexing.`;
  }

  if (q.includes('rust')) {
    return `1) Quick answer:
Sugarcane Rust (Puccinia melanocephala) is a foliar fungal disease causing reddish-brown powdery pustules on leaf surfaces.

2) Recommended field actions:
• Maintain wide row spacing (4 to 5 feet) for good sunlight and aeration.
• Avoid excessive nitrogen fertilizers; balance with potassium and phosphorus.
• Apply Mancozeb (0.2%) or Propiconazole (0.1%) if infection is severe.

3) Disease identification tips:
• Small yellowish spots turn into elongated reddish-brown pustules parallel to veins, producing rust powder on wiping.

4) Organic / Bio-control option:
• Foliar spray of Pseudomonas fluorescens (10g/L) at initial stage.
• Trash mulching between rows to maintain healthy microclimate.

5) When to consult Krishi Bhavan / Sugar Mill:
Consult local extension officers if rust spreads during the grand growth period.`;
  }

  if (q.includes('yellow')) {
    return `1) Quick answer:
Sugarcane Yellow Leaf Virus causes intense yellowing of midribs and leaf blades, impairing sugar synthesis.

2) Recommended field actions:
• Plant disease-free seed setts obtained from certified nurseries.
• Manage aphid vectors and maintain optimum soil potassium levels.
• Ensure timely irrigation without water stagnation.

3) Disease identification tips:
• Bright yellow midrib on the 3rd to 5th leaf from top, extending into yellowing leaf blade.

4) Organic / Bio-control option:
• Spray bio-pesticides or Neem seed kernel extract (NSKE 5%).
• Preserve natural predators like ladybird beetles and lacewings.

5) When to consult Krishi Bhavan / Sugar Mill:
Consult sugar mill agricultural field staff for variety guidance.`;
  }

  return `1) Quick answer:
For high sugarcane yield and disease resistance, focus on deep soil preparation, sett treatment, balanced fertilization (NPK 100:40:40 kg/acre), and drip/furrow irrigation.

2) Recommended field actions:
• Prepare deep furrows spaced 4 to 4.5 feet apart.
• Treat setts with fungicide/Trichoderma before planting.
• Perform earthing-up at 90-120 days to support stalks and prevent lodging.
• Maintain trash mulching to conserve moisture and suppress weeds.

3) Disease/Pest identification tips:
• Inspect crop weekly for leaf spots, rust pustules, top borers, or stalk discoloration.

4) Safe chemical option:
• Consult local Agriculture Extension Officer for registered active ingredients and dosages.

5) Organic / Bio-control option:
• Apply FYM (10 tonnes/acre) enriched with Azospirillum, PSB, and Trichoderma.

6) When to consult Krishi Bhavan / Sugar Mill:
Visit your nearest Krishi Bhavan or Sugar Factory Agronomist for soil testing and seasonal advisories.`;
};

router.post('/', optionalAuth, async (req, res) => {
  try {
    const { query, language = 'en', location = 'India' } = req.body;
    if (!query || !query.trim()) {
      return res.status(400).json({ message: 'Query text is required' });
    }

    let answer = '';
    let sources = [
      { title: 'KrishSathi Sugarcane Expert Engine', date: new Date().toISOString().split('T')[0] },
      { title: 'ICAR-Sugarcane Breeding Institute (SBI) Guidelines', date: new Date().toISOString().split('T')[0] }
    ];

    try {
      answer = await getGroqAnswer({
        query: query.trim(),
        language,
        location
      });
      sources.unshift({ title: 'Groq AI Agricultural LLM', date: new Date().toISOString().split('T')[0] });
    } catch (groqErr) {
      console.warn('Groq API unavailable or unconfigured, using fallback sugarcane engine:', groqErr.message);
      answer = getFallbackSugarcaneAnswer(query.trim());
    }

    let savedId = null;
    if (req.user && req.user.id) {
      try {
        const saved = await Query.create({
          userId: req.user.id,
          query: query.trim(),
          language,
          location,
          answer,
          sources
        });
        savedId = saved._id;
      } catch (dbErr) {
        console.warn('Could not save query to database:', dbErr.message);
      }
    }

    return res.status(200).json({
      id: savedId,
      answer,
      sources
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
