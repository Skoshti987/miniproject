const express = require('express');
const multer = require('multer');
const Upload = require('../models/Upload');
const auth = require('../middleware/auth');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODELS_URL = 'https://api.groq.com/openai/v1/models';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

let cachedVisionModel = null;
let cachedVisionModelAt = 0;

let cachedGeminiModel = null;
let cachedGeminiModelAt = 0;

const scoreVisionModelId = (id) => {
  const s = String(id || '').toLowerCase();
  let score = 0;
  if (!s.includes('vision')) return -1;
  if (s.includes('llama-3.2-11b-vision')) score += 100;
  if (s.includes('llama-3.2-90b-vision')) score += 90;
  if (s.includes('llama-4')) score += 50;
  if (s.includes('preview')) score -= 5;
  return score;
};

const resolveVisionModel = async ({ apiKey, forceRefresh = false } = {}) => {
  const fromEnv = process.env.GROQ_VISION_MODEL || '';
  if (fromEnv.trim()) return fromEnv.trim();

  // Cache to avoid hitting models endpoint on every upload
  const now = Date.now();
  if (!forceRefresh && cachedVisionModel && now - cachedVisionModelAt < 10 * 60 * 1000) {
    return cachedVisionModel;
  }

  const resp = await fetch(GROQ_MODELS_URL, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`
    }
  });

  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`Groq models list failed ${resp.status}: ${t}`);
  }

  const list = await resp.json();
  const ids = Array.isArray(list?.data) ? list.data.map((m) => m?.id).filter(Boolean) : [];
  const best = ids
    .map((id) => ({ id, score: scoreVisionModelId(id) }))
    .filter((x) => x.score >= 0)
    .sort((a, b) => b.score - a.score)[0]?.id;

  if (!best) {
    throw new Error('No vision-capable Groq model found for this API key. Set GROQ_VISION_MODEL explicitly.');
  }

  cachedVisionModel = best;
  cachedVisionModelAt = now;
  return best;
};

const extractJsonObject = (text) => {
  if (!text) return null;
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  const slice = text.slice(start, end + 1);
  try {
    return JSON.parse(slice);
  } catch {
    return null;
  }
};

const normalizeSeverity = (value) => {
  const v = String(value || '').toLowerCase();
  if (v.includes('low')) return 'Low';
  if (v.includes('high')) return 'High';
  return 'Moderate';
};

const clamp01 = (n) => {
  const x = Number(n);
  if (Number.isNaN(x)) return null;
  return Math.max(0, Math.min(1, x));
};

const getGroqImageAnalysis = async ({ buffer, mimeType, language = 'en', location = 'India' }) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('Missing GROQ_API_KEY');

  const model = await resolveVisionModel({ apiKey });
  const base64 = buffer.toString('base64');
  const dataUrl = `data:${mimeType || 'image/jpeg'};base64,${base64}`;

  const prompt = [
    'You are an agricultural plant health assistant for Indian farmers.',
    `Respond in ${language || 'en'} using very simple farmer-friendly words.`,
    `Context/location: ${location || 'India'}.`,
    '',
    'Task: Look at the image and identify the MOST likely crop issue.',
    'It can be: disease, pest damage, nutrient deficiency, water stress, or "Unknown".',
    '',
    'Return ONLY valid JSON (no extra text) in this exact schema:',
    '{',
    '  "crop": "string or Unknown",',
    '  "issueType": "disease|pest|nutrient|water|other|unknown",',
    '  "disease": "short name or Unknown",',
    '  "confidence": 0.0,',
    '  "severity": "Low|Moderate|High",',
    '  "identification": ["bullet", "bullet"],',
    '  "recommendation": "what farmer should do now",',
    '  "treatment": "safe treatment guidance",',
    '  "precautions": ["bullet", "bullet"],',
    '  "whenToEscalate": ["bullet", "bullet"],',
    '  "sources": ["ICAR", "State Agri Dept", "Krishi Bhavan"]',
    '}',
    '',
    'Rules:',
    '- Do not guess exact pesticide dose. Say: "follow label dose".',
    '- If image is unclear, set disease="Unknown" and confidence low (0.2-0.4) and ask for a clearer photo inside recommendation.',
    '- Avoid brand names. Mention active ingredient examples only if confident.',
    '- Keep it practical and safe.'
  ].join('\n');

  const makeRequest = async (modelId) => {
    return await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelId,
        temperature: 0.2,
        max_tokens: 900,
        messages: [
          {
            role: 'system',
            content:
              'You are a careful agricultural advisor. Output ONLY valid JSON. If unsure, be honest and conservative.'
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: dataUrl } }
            ]
          }
        ]
      })
    });
  };

  const response = await makeRequest(model);
  if (!response.ok) {
    const errorText = await response.text();
    const isDecommissioned = errorText.includes('model_decommissioned');
    if (isDecommissioned) {
      const refreshed = await resolveVisionModel({ apiKey, forceRefresh: true });
      const retry = await makeRequest(refreshed);
      if (!retry.ok) {
        const retryText = await retry.text();
        throw new Error(`Groq API error ${retry.status}: ${retryText}`);
      }
      const payload = await retry.json();
      const content = payload?.choices?.[0]?.message?.content?.trim();
      const parsed = extractJsonObject(content) || null;
      return { raw: content, parsed, modelUsed: refreshed };
    }
    throw new Error(`Groq API error ${response.status}: ${errorText}`);
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content?.trim();
  const parsed = extractJsonObject(content) || null;
  return { raw: content, parsed, modelUsed: model };
};

const getGeminiImageAnalysis = async ({ buffer, mimeType, language = 'en', location = 'India' }) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Missing GEMINI_API_KEY');

  const preferredGemini = [
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-1.5-pro',
    'gemini-1.5-pro-latest'
  ];

  const resolveGeminiModel = async ({ forceRefresh = false } = {}) => {
    const fromEnv = (process.env.GEMINI_VISION_MODEL || '').trim();
    if (fromEnv) return fromEnv;

    const now = Date.now();
    if (!forceRefresh && cachedGeminiModel && now - cachedGeminiModelAt < 10 * 60 * 1000) {
      return cachedGeminiModel;
    }

    const listUrl = `${GEMINI_API_BASE}/models?key=${encodeURIComponent(apiKey)}`;
    const listResp = await fetch(listUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!listResp.ok) {
      const t = await listResp.text();
      throw new Error(`Gemini ListModels error ${listResp.status}: ${t}`);
    }

    const listPayload = await listResp.json();
    const models = Array.isArray(listPayload?.models) ? listPayload.models : [];

    const candidates = models
      .filter((m) => Array.isArray(m?.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'))
      .map((m) => String(m?.name || ''))
      .filter(Boolean)
      .map((name) => (name.startsWith('models/') ? name.slice('models/'.length) : name));

    const pick = preferredGemini.find((id) => candidates.includes(id)) || candidates[0];
    if (!pick) {
      throw new Error('No Gemini model with generateContent is available for this API key.');
    }

    cachedGeminiModel = pick;
    cachedGeminiModelAt = now;
    return pick;
  };

  const model = await resolveGeminiModel();
  const base64 = buffer.toString('base64');

  const prompt = [
    'You are an agricultural plant health assistant for Indian farmers.',
    `Respond in ${language || 'en'} using very simple farmer-friendly words.`,
    `Context/location: ${location || 'India'}.`,
    '',
    'Task: Look at the image and identify the MOST likely crop issue.',
    'It can be: disease, pest damage, nutrient deficiency, water stress, or "Unknown".',
    '',
    'Return ONLY valid JSON (no extra text) in this exact schema:',
    '{',
    '  "crop": "string or Unknown",',
    '  "issueType": "disease|pest|nutrient|water|other|unknown",',
    '  "disease": "short name or Unknown",',
    '  "confidence": 0.0,',
    '  "severity": "Low|Moderate|High",',
    '  "identification": ["bullet", "bullet"],',
    '  "recommendation": "what farmer should do now",',
    '  "treatment": "safe treatment guidance",',
    '  "precautions": ["bullet", "bullet"],',
    '  "whenToEscalate": ["bullet", "bullet"],',
    '  "sources": ["ICAR", "State Agri Dept", "Krishi Bhavan"]',
    '}',
    '',
    'Rules:',
    '- Do not guess exact pesticide dose. Say: "follow label dose".',
    '- If image is unclear, set disease="Unknown" and confidence low (0.2-0.4) and ask for a clearer photo inside recommendation.',
    '- Avoid brand names. Mention active ingredient examples only if confident.',
    '- Keep it practical and safe.'
  ].join('\n');

  const url = `${GEMINI_API_BASE}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: mimeType || 'image/jpeg',
                data: base64
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 900,
        responseMimeType: 'application/json'
      }
    })
  });

  if (!resp.ok) {
    const t = await resp.text();
    const isNotFound = resp.status === 404;
    if (isNotFound && !process.env.GEMINI_VISION_MODEL) {
      // Model list can change; refresh and retry once when user didn't explicitly set a model.
      const refreshed = await resolveGeminiModel({ forceRefresh: true });
      const retryUrl = `${GEMINI_API_BASE}/models/${encodeURIComponent(refreshed)}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const retryResp = await fetch(retryUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: mimeType || 'image/jpeg',
                    data: base64
                  }
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 900,
            responseMimeType: 'application/json'
          }
        })
      });

      if (!retryResp.ok) {
        const retryText = await retryResp.text();
        throw new Error(`Gemini API error ${retryResp.status}: ${retryText}`);
      }

      const retryPayload = await retryResp.json();
      const retryContent = retryPayload?.candidates?.[0]?.content?.parts
        ?.map((p) => p?.text)
        .filter(Boolean)
        .join('\n')
        ?.trim();
      const retryParsed = extractJsonObject(retryContent) || (retryContent ? JSON.parse(retryContent) : null);
      return { raw: retryContent, parsed: retryParsed, modelUsed: refreshed };
    }

    throw new Error(`Gemini API error ${resp.status}: ${t}`);
  }

  const payload = await resp.json();
  const content = payload?.candidates?.[0]?.content?.parts?.map((p) => p?.text).filter(Boolean).join('\n')?.trim();
  const parsed = extractJsonObject(content) || (content ? JSON.parse(content) : null);
  return { raw: content, parsed, modelUsed: model };
};

const getOpenRouterImageAnalysis = async ({ buffer, mimeType, language = 'en', location = 'India' }) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('Missing OPENROUTER_API_KEY');

  const model = (process.env.OPENROUTER_VISION_MODEL || 'qwen/qwen2.5-vl-72b-instruct').trim();
  const base64 = buffer.toString('base64');
  const dataUrl = `data:${mimeType || 'image/jpeg'};base64,${base64}`;

  const prompt = [
    'You are an agricultural plant health assistant for Indian farmers.',
    `Respond in ${language || 'en'} using very simple farmer-friendly words.`,
    `Context/location: ${location || 'India'}.`,
    '',
    'Task: Look at the image and identify the MOST likely crop issue.',
    'It can be: disease, pest damage, nutrient deficiency, water stress, or "Unknown".',
    '',
    'Return ONLY valid JSON (no extra text) in this exact schema:',
    '{',
    '  "crop": "string or Unknown",',
    '  "issueType": "disease|pest|nutrient|water|other|unknown",',
    '  "disease": "short name or Unknown",',
    '  "confidence": 0.0,',
    '  "severity": "Low|Moderate|High",',
    '  "identification": ["bullet", "bullet"],',
    '  "recommendation": "what farmer should do now",',
    '  "treatment": "safe treatment guidance",',
    '  "precautions": ["bullet", "bullet"],',
    '  "whenToEscalate": ["bullet", "bullet"],',
    '  "sources": ["ICAR", "State Agri Dept", "Krishi Bhavan"]',
    '}',
    '',
    'Rules:',
    '- Do not guess exact pesticide dose. Say: "follow label dose".',
    '- If image is unclear, set disease="Unknown" and confidence low (0.2-0.4) and ask for a clearer photo inside recommendation.',
    '- Avoid brand names. Mention active ingredient examples only if confident.',
    '- Keep it practical and safe.'
  ].join('\n');

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`
  };
  if (process.env.OPENROUTER_SITE_URL) headers['HTTP-Referer'] = process.env.OPENROUTER_SITE_URL;
  if (process.env.OPENROUTER_APP_NAME) headers['X-Title'] = process.env.OPENROUTER_APP_NAME;

  const resp = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: 900,
      messages: [
        {
          role: 'system',
          content: 'You are a careful agricultural advisor. Output ONLY valid JSON. If unsure, be honest and conservative.'
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: dataUrl } }
          ]
        }
      ]
    })
  });

  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`OpenRouter API error ${resp.status}: ${t}`);
  }

  const payload = await resp.json();
  const content = payload?.choices?.[0]?.message?.content?.trim();
  const parsed = extractJsonObject(content) || null;
  return { raw: content, parsed, modelUsed: model };
};

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Image file is required' });
    }

    const language = req.body?.language || 'en';
    const location = req.body?.location || 'India';

    let analysis = null;
    let modelUsed = null;
    let analysisEngine = null;
    let provider = 'unknown';

    // 1. Try Cloud Vision API if API keys are configured
    const hasOpenRouter = Boolean(process.env.OPENROUTER_API_KEY);
    const hasGemini = Boolean(process.env.GEMINI_API_KEY);
    const hasGroq = Boolean(process.env.GROQ_API_KEY);

    if (hasOpenRouter || hasGemini || hasGroq) {
      try {
        const preferredProvider = String(process.env.VISION_PROVIDER || '').trim().toLowerCase();
        let useProvider = preferredProvider || (hasOpenRouter ? 'openrouter' : hasGemini ? 'gemini' : 'groq');
        if (preferredProvider && !['openrouter', 'gemini', 'groq'].includes(useProvider)) {
          useProvider = 'openrouter';
        }

        provider = useProvider;
        let result;
        if (useProvider === 'openrouter') {
          result = await getOpenRouterImageAnalysis({ buffer: req.file.buffer, mimeType: req.file.mimetype, language, location });
          analysisEngine = 'openrouter-vision-json-v1';
        } else if (useProvider === 'gemini') {
          result = await getGeminiImageAnalysis({ buffer: req.file.buffer, mimeType: req.file.mimetype, language, location });
          analysisEngine = 'gemini-vision-json-v1';
        } else {
          result = await getGroqImageAnalysis({ buffer: req.file.buffer, mimeType: req.file.mimetype, language, location });
          analysisEngine = 'groq-vision-json-v1';
        }

        analysis = result?.parsed;
        modelUsed = result?.modelUsed || modelUsed;
      } catch (e) {
        console.warn(`${provider} image analysis failed, checking local ML service fallback:`, e.message);
      }
    }

    // 2. If Cloud Vision didn't yield a result, fallback to our trained ML inference service
    if (!analysis) {
      try {
        const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
        const formData = new FormData();
        formData.append('image', blob, req.file.originalname);

        const mlResponse = await fetch(`${ML_SERVICE_URL}/predict`, {
          method: 'POST',
          body: formData
        });

        if (mlResponse.ok) {
          const mlData = await mlResponse.json();
          analysis = {
            crop: 'Sugarcane',
            issueType: 'disease',
            disease: mlData.prediction?.class || 'Unknown',
            confidence: mlData.prediction?.confidence || 0.4,
            severity: mlData.recommendation?.severity || 'Moderate',
            recommendation: mlData.recommendation?.summary || 'Follow crop protection best practices.',
            treatment: (mlData.recommendation?.actions || []).join('; ') || 'Consult local agriculture specialist.',
            sources: ['KrishSathi ML Sugarcane Classifier']
          };
          analysisEngine = 'krishsathi-ml-service';
          modelUsed = mlData.model_version || 'sugarcane-resnet-v1';
        }
      } catch (mlErr) {
        console.warn('ML Service fallback failed:', mlErr.message);
      }
    }

    const confidence = clamp01(analysis?.confidence);
    const disease = String(analysis?.disease || 'Unknown');
    const severity = normalizeSeverity(analysis?.severity);

    const recommendation =
      String(analysis?.recommendation ||
        'Photo received, but issue cannot be confirmed. Please upload a clearer close-up photo of the affected leaf in good daylight.');

    const treatment = String(
      analysis?.treatment ||
        'Remove severely damaged parts, avoid waterlogging, and verify with local Krishi Bhavan before applying chemicals.'
    );

    const sources = Array.isArray(analysis?.sources) && analysis.sources.length
      ? analysis.sources.map((s) => String(s))
      : ['Krishi Bhavan'];

    const modelUsedResponse = modelUsed || 'unknown';
    const analysisEngineResponse = analysisEngine || 'fallback-v1';

    let savedId = Date.now().toString();
    if (req.user && req.user.id) {
      try {
        const result = await Upload.create({
          userId: req.user.id,
          fileName: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size,
          disease,
          confidence: confidence ?? 0.35,
          recommendation,
          treatment,
          severity,
          sources
        });
        savedId = result._id;
      } catch (dbErr) {
        console.warn('Could not save upload record to database:', dbErr.message);
      }
    }

    return res.status(200).json({
      id: savedId,
      fileName: req.file.originalname,
      disease,
      confidence: confidence ?? 0.35,
      recommendation,
      treatment,
      severity,
      sources,
      analysisEngine: analysisEngineResponse,
      modelUsed: modelUsedResponse
    });
  } catch (error) {
    console.error('Upload processing error:', error);
    return res.status(500).json({ message: 'Failed to process image' });
  }
});

module.exports = router;
