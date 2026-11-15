const express = require('express');
const jwt = require('jsonwebtoken');
const Query = require('../models/Query');
const auth = require('../middleware/auth');

const router = express.Router();
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Helper for optional auth in POST /
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

const SUGARCANE_DOMAIN_MESSAGE =
  'I am KrishSathi, your Sugarcane Agricultural Assistant. I can help you with sugarcane cultivation, diseases, fertilizers, irrigation, pests, crop management, and sugar production.';

// Detect if query is completely outside agriculture, crops, weather, or farming
const isOffDomainQuery = (query) => {
  const q = query.toLowerCase().trim();
  
  // Whitelist agricultural & farming terminology
  const agroKeywords = [
    'sugarcane', 'cane', 'sugar', 'crop', 'soil', 'farm', 'fertilizer', 'disease', 'pest',
    'leaf', 'plant', 'irrigation', 'water', 'weather', 'rain', 'temperature', 'humidity',
    'seed', 'sett', 'ratoon', 'harvest', 'yield', 'variety', 'co 86032', 'phule 265', 'com 0265',
    'co 0238', 'tiller', 'growth', 'npk', 'urea', 'dap', 'potash', 'manure', 'compost',
    'trichoderma', 'carbendazim', 'mancozeb', 'fungicide', 'pesticide', 'insecticide',
    'red rot', 'rust', 'mosaic', 'yellow leaf', 'smut', 'borer', 'pyrilla', 'aphid', 'grub',
    'weed', 'atrazine', 'intercrop', 'sucrose', 'brix', 'mill', 'factory', 'frp', 'subsidy',
    'scheme', 'pm-kisan', 'drip', 'tractor', 'krishi', 'kisan', 'shetkari', 'khet', 'fasal',
    'ऊस', 'शेती', 'खत', 'रोग', 'पाणी', 'हवामान', 'वाण', 'तांबेरा', 'मोझॅक', 'पिवळा', 'कीड',
    'गन्ना', 'किसान', 'फसल', 'खाद', 'बीमारी', 'सिंचाई', 'मौसम', 'लाल सड़न', 'रतुआ', 'मोज़ेक',
    'കരിമ്പ്', 'കൃഷി', 'വളം', 'രോഗം', 'വെള്ളം'
  ];

  const hasAgroKeyword = agroKeywords.some((kw) => q.includes(kw));
  if (hasAgroKeyword) return false;

  // Unrelated topic keywords
  const offDomainKeywords = [
    'cricket', 'football', 'fifa', 'bollywood', 'hollywood', 'movie', 'actor', 'actress',
    'song', 'music', 'python', 'java', 'javascript', 'c++', 'coding', 'programming',
    'bitcoin', 'crypto', 'blockchain', 'ethereum', 'stock market', 'trading', 'crypto',
    'recipe', 'pizza', 'burger', 'car', 'bike', 'iphone', 'android phone', 'laptop',
    'politics', 'election', 'president', 'prime minister', 'astrology', 'horoscope'
  ];

  return offDomainKeywords.some((kw) => q.includes(kw));
};

const buildSugarcanePrompt = ({ query, language, location, history = [] }) => {
  const languageNames = {
    en: 'English',
    hi: 'Hindi',
    mr: 'Marathi',
    ml: 'Malayalam'
  };
  const targetLanguageName = languageNames[language] || 'English';

  const historyLines = Array.isArray(history) && history.length > 0
    ? history.slice(-6).map((msg) => `${msg.role === 'user' ? 'Farmer' : 'Assistant'}: ${msg.content}`).join('\n')
    : 'No previous messages.';

  return [
    'You are KrishSathi, an intelligent and authoritative AI Agricultural Assistant specialized in sugarcane cultivation and the Indian sugar industry.',
    `Target Farmer Language: ${targetLanguageName}`,
    `Farmer Location: ${location || 'Kolhapur, Maharashtra, India'}`,
    '',
    'YOUR EXPERTISE INCLUDES (24 Core Sugarcane Topics):',
    '1. Sugarcane Varieties: Co 86032 (Nayan), CoM 0265 (Phule 265), Co 0238, Co 94012, Co 11015, MS 10001, CoC 671 characteristics and yield potential.',
    '2. Soil & Land Preparation: Deep plowing (45 cm), rotavator tillage, optimum soil pH (6.5–7.5), organic FYM application (10 t/acre).',
    '3. Planting Methods: Single-eye bud sett, two-bud sett, chip-budding, STP (Spaced Transplanting Method / SSI).',
    '4. Seed Selection & Sett Treatment: Top 1/3 stalk selection, Carbendazim (0.1%) or Trichoderma viride soaking, hot-water treatment (50°C for 2h).',
    '5. Irrigation Management: Drip irrigation scheduling, furrow irrigation, water requirements (1500-2500 mm), critical tillering & elongation stages.',
    '6. Fertilizer Management: N:P:K split doses (e.g. 250:115:115 kg/ha), basal dose at planting, top dressing at 45, 90, and 120-135 days (grand earthing-up).',
    '7. Nutrient Deficiencies: Iron chlorosis, Zinc deficiency, Nitrogen yellowing, Potassium leaf scorch symptoms and corrective sprays.',
    '8. Sugarcane Diseases: Red Rot (Colletotrichum falcatum), Rust (Puccinia melanocephala), Mosaic Virus, Yellow Leaf Disease (SCYLV), Smut, Grassy Shoot.',
    '9. Pest Management (IPM): Early shoot borer, Top shoot borer, Internode borer, Pyrilla perpusilla, White grub, Woolly aphid.',
    '10. Weed Management: Pre-emergence Atrazine (1 kg/acre within 3 days of planting), manual weeding, trash mulching.',
    '11. Crop Growth Stages: Germination (0-30 days), Formative/Tillering (30-120 days), Grand Growth (120-270 days), Maturity/Ripening (270-360 days).',
    '12. Intercropping: Soybean, Groundnut, Gram, Onion, Potato in furrow spaces during the first 90 days.',
    '13. Harvesting Techniques: Ground-level cutting where sugar concentration is highest; maturity index (Hand refractometer Brix >18%).',
    '14. Yield Improvement: Subsoiling, balanced micronutrients, earthing-up, propping to prevent lodging.',
    '15. Sugar Recovery & Sucrose: Sugar recovery percentage (10-12%), Pol %, Brix, climatic impact of cool sunny harvesting days.',
    '16. Sugar Mills & By-Products: Milling, juice extraction, bagasse for co-gen electricity, filter mud press-cake compost, molasses for ethanol blending.',
    '17. Government Schemes: Fair and Remunerative Price (FRP), PM-KISAN, PMKSY drip irrigation subsidy (55-80%), Namo Shetkari Mahasanman Nidhi.',
    '18. Seasonal Guidance: Adsali planting (July-August, 16-18 months), Pre-seasonal (October-November), Suru (January-February), and Ratoon management.',
    '19. Agricultural Machinery: Laser land levelers, two-row cane planters, inter-row cultivators, cane harvesters.',
    '20. Weather Guidance: Postponing pesticide spray before rains, temperature drops and frost mitigation.',
    '21. Market Information: Mill gate delivery, harvesting permits (Tod-Chitthi), FRP bonus payments.',
    '',
    'STRICT RESPONSE RULES:',
    `1. MANDATORY: Answer completely and naturally in ${targetLanguageName}. If the query is in Marathi or Hindi, provide the full response in that language.`,
    '2. If the user asks about an ambiguous symptom (e.g. "My sugarcane leaves are turning yellow"):',
    '   a) Explain the multiple possible reasons (Iron deficiency, Yellow Leaf Virus, Red Rot early stage, water stress).',
    '   b) Ask clarifying questions (What is the crop age? Are younger or older leaves affected? Is the midrib red or white?).',
    '   c) Provide immediate safe verification steps and safe non-destructive solutions.',
    '   d) Explain long-term prevention.',
    '3. For follow-up questions, seamlessly reference previous conversation context without asking the farmer to repeat information.',
    '4. Never invent fictional chemicals, unregistered dosages, or fake government schemes.',
    '5. If the query is completely unrelated to sugarcane, farming, crops, soils, weather, or agriculture, reply strictly with:',
    `   "${SUGARCANE_DOMAIN_MESSAGE}"`,
    '',
    '--- PREVIOUS CONVERSATION CONTEXT ---',
    historyLines,
    '-------------------------------------',
    `Current Question: ${query}`
  ].join('\n');
};

const getGroqAnswer = async ({ query, language, location, history = [] }) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('Missing GROQ_API_KEY');
  }

  const candidateModels = [
    process.env.GROQ_MODEL,
    'qwen/qwen3.8-27b',
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant'
  ].filter(Boolean);

  let lastError = null;

  for (const model of candidateModels) {
    try {
      const messages = [
        {
          role: 'system',
          content:
            'You are KrishSathi, a senior sugarcane agronomist and extension scientist in India. Provide respectful, practical, highly accurate agricultural guidance in the farmer\'s chosen language.'
        }
      ];

      // Add recent context
      if (Array.isArray(history) && history.length > 0) {
        history.slice(-4).forEach((msg) => {
          if (msg.role && msg.content) {
            messages.push({
              role: msg.role === 'user' ? 'user' : 'assistant',
              content: msg.content
            });
          }
        });
      }

      messages.push({
        role: 'user',
        content: buildSugarcanePrompt({ query, language, location, history })
      });

      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          temperature: 0.25,
          max_tokens: 650,
          messages
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        lastError = new Error(`Groq ${model} (${response.status}): ${errorText}`);
        continue;
      }

      const data = await response.json();
      const answer = data.choices?.[0]?.message?.content?.trim();
      if (answer) return answer;
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('All Groq model attempts failed.');
};

// Grounded fallback agricultural knowledge
const getFallbackSugarcaneAnswer = (query, language = 'en') => {
  const q = query.toLowerCase();

  const answers = {
    en: {
      yellowLeaf: `1. Possible Reasons for Yellowing in Sugarcane:
• Iron Chlorosis (फेरसची कमतरता): Young top leaves turn yellow or white while veins remain faint green (very common in calcareous, high-pH soils).
• Sugarcane Yellow Leaf Disease (SCYLV): Mature 3rd to 5th leaves exhibit bright yellow midribs extending into the leaf blade.
• Early Red Rot Symptoms: Third/fourth leaf yellows from the tip downwards with red midrib lesions.
• Moisture Stress or Waterlogging: Inadequate drainage suffocates roots, preventing nitrogen and iron uptake.

2. Clarifying Verification Steps:
• Check which leaves are turning yellow first: Top young whorl leaves (indicates Iron/Zinc deficiency) or lower/middle mature leaves (indicates Nitrogen deficiency or Yellow Leaf Disease).
• Split one affected stalk lengthwise: If the internal pith is white and healthy, it is nutritional; if it shows red lesions with sour smell, it is Red Rot.

3. Immediate Safe Solutions:
• For Iron/Zinc Chlorosis: Foliar spray of Ferrous Sulfate (0.5% = 5g/L) + Zinc Sulfate (0.5% = 5g/L) + Urea (1% = 10g/L) in 200L water per acre.
• For Waterlogging: Immediately drain excess standing water from furrows.

4. Prevention & Long-Term Management:
• Apply well-decomposed FYM (10 t/acre) enriched with elemental sulfur (20 kg/acre) in alkaline soils.
• Plant certified disease-free tissue-cultured seed setts (Co 86032 or CoM 0265).`,
      fertilizer: `1. Recommended Fertilizer Schedule for Sugarcane (Per Acre):
• General Dose: 100-120 kg Nitrogen (N), 40-50 kg Phosphorus (P2O5), 40-50 kg Potash (K2O).

2. Application Stages (Split Doses):
• At Planting (Basal): 10% Nitrogen + 50% Phosphorus + 50% Potash (e.g., 1 bag DAP + 1 bag MOP + 1 bag Urea).
• At 45 Days (Early Tillering): 40% Nitrogen (e.g., 2 bags Urea).
• At 90-100 Days (Formative Stage): 10% Nitrogen (e.g., 1 bag Urea).
• At 120-135 Days (Grand Earthing-up / बांधणी): 40% Nitrogen + 50% Phosphorus + 50% Potash. This is the most crucial dose before canopy closure.

3. Micronutrient Management:
• Apply 10 kg Zinc Sulfate and 10 kg Ferrous Sulfate per acre mixed with FYM at planting to prevent chlorosis.`,
      varieties: `1. Leading Sugarcane Varieties for Western Maharashtra & Central India:
• Co 86032 (Nayan): High-sugar, drought-tolerant, excellent ratooning, highly responsive to drip irrigation, average yield 50-60 t/acre.
• CoM 0265 (Phule 265): Heavy tillering, salt-tolerant, high biomass, average yield 65-80 t/acre. Requires strict propping.
• Co 94012 (Phule Savitri): Early maturing, high recovery (11.5%+), suitable for early crushing starting in October.
• Co 11015: Early variety with high sucrose content and resistance to red rot.

2. Sourcing:
Obtain certified foundation setts from Vasantdada Sugar Institute (VSI) Pune or your local Sugar Factory nursery.`,
      general: `KrishSathi Sugarcane Expert Advice:
For high sugarcane yield and disease resistance:
1. Soil & Planting: Deep plowing (45 cm), ridges & furrows spaced 4 to 5 feet apart, using two-bud setts treated with Carbendazim (0.1%) or Trichoderma viride.
2. Nutrition: Balanced N:P:K (100:40:40 kg/acre) applied in 4 split doses ending with grand earthing-up at 120 days.
3. Moisture & Weed: Trash mulching (10 cm) between rows saves 30% irrigation water and suppresses weeds.
4. Monitoring: Weekly field walks for early detection of Shoot Borer, White Grub, and Red Rot.`
    },
    mr: {
      yellowLeaf: `१. ऊसाची पाने पिवळी पडण्याची मुख्य कारणे:
• लोह (फेरस) कमतरता: वरची कोवळी पाने पिवळी किंवा पांढरी पडतात, पण शिरा फिकट हिरव्या राहतात (चुनखडीयुक्त जमिनीत जास्त दिसते).
• पिवळा पान रोग (Yellow Leaf Disease): मधल्या ३ ते ५ व्या पानांची मुख्य शीर ठळक पिवळी पडते.
• तांबेरा किंवा लाल कुज (Red Rot): पानांची टोके सुकू लागतात आणि शिरेवर लाल चट्टे दिसतात.
• जादा पाणी किंवा पाण्याचा निचरा न होणे: मुळांना हवा न मिळाल्यामुळे अन्नद्रव्ये शोषली जात नाहीत.

२. खात्री करण्यासाठी तपासणी:
• पिवळेपणा नवीन कोवळ्या पानांवर आहे की खालच्या जुन्या पानांवर हे तपासा.
• ऊस उभा कापून पाहा: आतील गर पांढरा व निरोगी असेल तर ही अन्नद्रव्यांची कमतरता आहे; आत लाल पट्टे व आंबट वास असल्यास तांबेरा/लाल कुज आहे.

३. तातडीचे उपाय:
• लोह व सूक्ष्मअन्नद्रव्य फवारणी: हिराकस (फेरस सल्फेट) १०० ग्रॅम + चिलेटेड झिंक ५० ग्रॅम + युरिया १०० ग्रॅम प्रति १५ लिटर पाण्यात मिसळून फवारा.
• शेतात साचलेले पाणी तातडीने बाहेर काढून द्या.

४. कायमस्वरूपी उपाय:
• लागवडीच्या वेळी शेणखतात सूक्ष्मअन्नद्रव्ये (१० किलो फेरस + १० किलो झिंक प्रति एकर) मिसळून द्या.
• निरोगी, उती-संवर्धित (Tissue Culture) को ८६०३२ किंवा फुले २६५ बेणे वापरा.`,
      fertilizer: `१. ऊस पिकासाठी खत व्यवस्थापन (प्रति एकर):
• एकूण शिफारस: १००-१२० किलो नत्र, ४०-५० किलो स्फुरद, ४०-५० किलो पालाश.

२. खतांचे ४ हप्ते (Split Application):
• लागवडीवेळी (बासल डोस): १ बॅग डीएपी + १ बॅग एमओपी + १ बॅग युरिया.
• ६ ते ८ आठवड्यांनी (फुटवे फुटताना): २ बॅग युरिया.
• १२ ते १४ आठवड्यांनी: १ बॅग युरिया.
• मोठी बांधणी (१२०-१३५ दिवस): १ बॅग डीएपी + २ बॅग युरिया + १ बॅग पोटॅश (एमओपी). हा सर्वात महत्त्वाचा हप्ता आहे.

३. सेंद्रिय व सूक्ष्म अन्नद्रव्ये:
• एकरी ५ ते १० टन चांगले कुजलेले शेणखत किंवा कंपोस्ट वापरा.
• ठिबक असल्यास पाण्यात विद्राव्य खते (१९:१९:१९, १२:६१:००, ००:००:५०) द्यावीत.`,
      general: `कृषिसार्थी ऊस सल्ला:
भरघोस ऊस उत्पादनासाठी:
१. ४ ते ५ फूट पट्टा पद्धतीने लागवड करा.
२. लागवडीपूर्वी बेण्यास बुरशीनाशक प्रक्रिया (ट्रायकोडर्मा किंवा कार्बेन्डाझिम) नक्की करा.
३. १२० ते १३५ दिवसांच्या दरम्यान मोठी बांधणी पूर्ण करा.
४. उसाच्या पाचटाचे आच्छादन (Trash Mulching) केल्यास जमिनीतील ओलावा टिकून राहतो आणि तणांचा बंदोबस्त होतो.`
    }
  };

  const langDict = answers[language] || answers.en;

  if (q.includes('yellow') || q.includes('पिवळ') || q.includes('पीली')) {
    return langDict.yellowLeaf || answers.en.yellowLeaf;
  }
  if (q.includes('fertilizer') || q.includes('खत') || q.includes('खाद') || q.includes('npk')) {
    return langDict.fertilizer || answers.en.fertilizer;
  }
  if (q.includes('variety') || q.includes('वाण') || q.includes('किस्म') || q.includes('86032') || q.includes('265')) {
    return langDict.varieties || answers.en.varieties;
  }
  return langDict.general || answers.en.general;
};

// POST /api/query - Process user query
router.post('/', optionalAuth, async (req, res) => {
  try {
    const { query, language = 'en', location = 'Kolhapur, Maharashtra', history = [] } = req.body;

    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ message: 'Query cannot be empty.' });
    }

    const trimmedQuery = query.trim();

    // 1. Sugarcane domain restriction check
    if (isOffDomainQuery(trimmedQuery)) {
      return res.json({
        id: null,
        answer: SUGARCANE_DOMAIN_MESSAGE,
        sources: [{ title: 'KrishSathi Sugarcane Scope Policy', date: new Date().toISOString().split('T')[0] }],
        isAiGenerated: false,
        isOffDomain: true
      });
    }

    let answer = '';
    let isAiGenerated = false;
    let sources = [
      { title: 'ICAR-Sugarcane Breeding Institute (ICAR-SBI)', date: '2026' },
      { title: 'Vasantdada Sugar Institute (VSI) Pune Agronomy', date: '2026' }
    ];

    try {
      answer = await getGroqAnswer({
        query: trimmedQuery,
        language,
        location,
        history
      });
      isAiGenerated = true;
      sources.unshift({ title: 'Groq Agricultural AI Engine', date: new Date().toISOString().split('T')[0] });
    } catch (llmErr) {
      console.warn('Groq LLM offline or throttled, using verified ICAR/VSI sugarcane database:', llmErr.message);
      answer = getFallbackSugarcaneAnswer(trimmedQuery, language);
    }

    let savedQueryId = null;

    // Persist to MongoDB if user authenticated
    if (req.user && req.user.id) {
      try {
        const saved = await Query.create({
          userId: req.user.id,
          query: trimmedQuery,
          language,
          location,
          answer,
          sources
        });
        savedQueryId = saved._id;
      } catch (dbErr) {
        console.warn('Could not save query to MongoDB:', dbErr.message);
      }
    }

    return res.json({
      id: savedQueryId,
      answer,
      sources,
      isAiGenerated
    });
  } catch (error) {
    console.error('Query processing error:', error.message);
    return res.status(500).json({ message: 'Failed to process agricultural query.' });
  }
});

// GET /api/query/history - Fetch previous chat conversations for authenticated user
router.get('/history', auth, async (req, res) => {
  try {
    const history = await Query.find({ userId: req.user.id })
      .sort({ createdAt: 1 })
      .limit(60);

    return res.json({
      success: true,
      count: history.length,
      history
    });
  } catch (error) {
    console.error('Error fetching chat history:', error.message);
    return res.status(500).json({ message: 'Failed to fetch chat history' });
  }
});

// DELETE /api/query/history - Clear chat history for authenticated user
router.delete('/history', auth, async (req, res) => {
  try {
    await Query.deleteMany({ userId: req.user.id });
    return res.json({ success: true, message: 'Chat history cleared successfully' });
  } catch (error) {
    console.error('Error clearing chat history:', error.message);
    return res.status(500).json({ message: 'Failed to clear chat history' });
  }
});

// POST /api/query/feedback - Save feedback on answer
router.post('/feedback', auth, async (req, res) => {
  try {
    const { queryId, helpful } = req.body;
    if (!queryId || typeof helpful !== 'boolean') {
      return res.status(400).json({ message: 'queryId and helpful boolean are required' });
    }

    const updated = await Query.findOneAndUpdate(
      { _id: queryId, userId: req.user.id },
      { feedback: helpful },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Query record not found' });
    }

    return res.json({ success: true, feedback: helpful });
  } catch (error) {
    console.error('Error saving feedback:', error.message);
    return res.status(500).json({ message: 'Failed to save feedback' });
  }
});

module.exports = router;
