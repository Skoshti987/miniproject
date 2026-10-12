const express = require('express');
const Query = require('../models/Query');
const auth = require('../middleware/auth');

const router = express.Router();
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';


const buildFarmerFriendlyPrompt = ({ query, language, location, history = [] }) => {
  const languageNames = {
    en: 'English',
    hi: 'Hindi',
    mr: 'Marathi',
    ml: 'Malayalam'
  };
  const targetLanguageName = languageNames[language] || language || 'English';

  const historyLines = Array.isArray(history) && history.length > 0
    ? history.slice(-6).map((msg) => `${msg.role === 'user' ? 'Farmer' : 'Assistant'}: ${msg.content}`).join('\n')
    : 'No previous messages.';

  return [
    'KrishSathi is an authoritative, friendly, expert agricultural AI assistant for Indian farmers, specialized in sugarcane and all major crops across India.',
    'Your expertise covers:',
    '• Sugarcane cultivation from land preparation, furrowing, planting (single/two eye-bud setts), tillering, grand growth, earthing up, to harvesting & ratoon management.',
    '• Major Indian crops: Rice, Wheat, Cotton, Soybean, Maize, Gram/Pulses, Groundnut, Mustard, Vegetables (Onion, Tomato, Chilli), and Fruits.',
    '• Soil health: Soil testing, pH balance, saline/sodic soils, organic matter, green manuring, vermicompost, and FYM.',
    '• Nutrient management: NPK recommendations, timing, split doses, micronutrients (Zinc, Iron, Boron, Magnesium), and deficiency symptoms.',
    '• Irrigation & Drainage: Drip irrigation, furrow irrigation, water scheduling, drought mitigation, and flood/heavy rain drainage management.',
    '• Pest & Disease control: Integrated Pest Management (IPM), bio-control agents (Trichoderma, Pseudomonas, NPV), pheromone traps, and official pesticide active ingredients with safety warnings.',
    '• Government schemes: PM-KISAN, PMFBY crop insurance, PMKSY drip subsidy, Maharashtra Namo Shetkari, KCC, and soil health cards.',
    '',
    'RULES:',
    `1. MANDATORY: Respond completely and naturally in ${targetLanguageName}. Do not switch to English if the user selected Marathi or Hindi.`,
    '2. Directly answer the farmer\'s specific question without repeating robotic opening phrases.',
    '3. Provide practical, step-by-step guidance with clear timing, proportions, and precautions.',
    '4. For follow-up questions, use the conversation context below seamlessly without asking the farmer to repeat details.',
    '5. Never invent fictional government schemes, exact cash amounts, or unverified pesticide dosages.',
    '6. Advise consulting local Krishi Vigyan Kendra (KVK) or Agriculture Extension Officers when in-person field verification is essential.',
    '',
    `Farmer Location: ${location || 'India'} | Active Language: ${targetLanguageName}`,
    '--- Conversation Context ---',
    historyLines,
    '---------------------------',
    `Current Farmer Question: ${query}`
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
    'openai/gpt-oss-120b',
    'openai/gpt-oss-20b'
  ].filter(Boolean);

  let lastError = null;

  for (const model of candidateModels) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const messages = [
          {
            role: 'system',
            content:
              'You are a senior agricultural scientist and extension officer in India. Give helpful, respectful, step-by-step agricultural advice tailored to the farmer\'s language and crops.'
          }
        ];

        // Add prior conversation messages
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
          content: buildFarmerFriendlyPrompt({ query, language, location, history })
        });

        const response = await fetch(GROQ_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model,
            temperature: 0.3,
            max_tokens: 500,
            messages
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          lastError = new Error(`Groq API Error for ${model} (${response.status}): ${errorText}`);
          if (response.status === 429) {
            console.warn(`Groq rate limit on ${model}, pausing 1.5s before retry...`);
            await new Promise((r) => setTimeout(r, 1500));
            continue;
          }
          console.warn(`Groq model ${model} failed, trying next candidate:`, errorText);
          break;
        }

        const data = await response.json();
        const answer = data.choices?.[0]?.message?.content?.trim();
        if (answer) {
          return answer;
        }
      } catch (err) {
        lastError = err;
        console.warn(`Groq attempt with model ${model} threw error:`, err.message);
      }
    }
  }

  throw lastError || new Error('All Groq model attempts failed.');
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

const getFallbackSugarcaneAnswer = (query, language = 'en') => {
  const q = query.toLowerCase();

  const answers = {
    en: {
      redRot: `1) Quick answer:
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
Contact your local Sugar Mill Agriculture Officer immediately for replacement of susceptible varieties like Co 0238.`,
      mosaic: `1) Quick answer:
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
Consult Krishi Vigyan Kendra (KVK) for seed nursery viral indexing.`,
      rust: `1) Quick answer:
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
Consult local extension officers if rust spreads during the grand growth period.`,
      yellow: `1) Quick answer:
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
Consult sugar mill agricultural field staff for variety guidance.`,
      general: `1) Quick answer:
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
Visit your nearest Krishi Bhavan or Sugar Factory Agronomist for soil testing and seasonal advisories.`
    },
    mr: {
      redRot: `1) थोडक्यात उत्तर:
तांबोरा (लाल कुज / Red Rot) हा ऊसातील गंभीर बुरशीजन्य रोग आहे. यामध्ये ऊसाचा आतील भाग लाल होऊन पांढरे पट्टे पडतात आणि दारूसारखा आंबट वास येतो.

2) शेतातील महत्त्वाच्या उपाययोजना:
• रोगट ऊसाची बेटे मातीसह ताबडतोब उपटून जाळून टाका.
• मुळांभोवती पाणी साचणार नाही यासाठी शेतात योग्य पाण्याचा निचरा ठेवा.
• लागवडीपूर्वी बेण्यास ट्रायकोडेमा विरिडी किंवा शिफारशीत बुरशीनाशकाची प्रक्रिया करा.
• भात किंवा कडधान्य पिकांसोबत २ वर्षांचे पीक फेरपालट करा.

3) रोग ओळखण्याच्या टिप्स:
• वरची पाने टोकाकडून खाली पिवळी पडून वाळू लागतात.
• ऊस उभा कापल्यास आतील गरामध्ये लाल रंगाचे चट्टे आणि पांढरे आडवे पट्टे दिसतात.

4) जैविक / सेंद्रिय पर्याय:
• शेतात ट्रायकोडेमा विरिडी (२.५ किलोग्रॅम/एकड) शेणखतात मिसळून द्या.
• उष्ण जल प्रक्रिया (५० अंश से. २ तास) केलेले निरोगी बेणे वापरा.

5) कृषी अधिकारी सल्ला:
तांबोरा संवेदनशील वाण बदलण्यासाठी स्थानिक साखर कारखान्याच्या शेतकी अधिकाऱ्यांशी संपर्क साधा.`,
      mosaic: `1) थोडक्यात उत्तर:
ऊस मोझॅक व्हायरसमुळे पानांवर पिवळे व हिरवे चट्टे पडतात, ज्यामुळे प्रकाशसंश्लेषण मंदावते आणि ऊसाचे उत्पादन घटते.

2) शेतातील महत्त्वाच्या उपाययोजना:
• नवीन लागवडीसाठी विषाणूमुक्त उती संवर्धित (Tissue Culture) बेणे वापरा.
• रोग पसरवणाऱ्या मावा (Aphids) कीटकांचे वेळेवर नियंत्रण करा.
• लहान वयातील बाधित रोपे उपटून नष्ट करा.

3) रोग ओळखण्याच्या टिप्स:
• पानांच्या शिरांच्या बाजूने फिकट हिरवे व पिवळसर लांबट चट्टे दिसतात.

4) जैविक / सेंद्रिय पर्याय:
• मावा कीटक नियंत्रणासाठी कडुनिंब अर्काची (Neem Oil 3ml/L) फवारणी करा.
• शेताच्या बांधावरील गवत व तण नष्ट करा.

5) कृषी अधिकारी सल्ला:
बेणे शुद्धतेसाठी स्थानिक कृषी विज्ञान केंद्राशी (KVK) संपर्क साधा.`,
      rust: `1) थोडक्यात उत्तर:
तांबेरा (Rust) हा पानांवरील बुरशीजन्य रोग आहे. यामध्ये पानांच्या खालील बाजूस लांबट लालसर-तपकिरी रंगाचे पुटकुळे येतात.

2) शेतातील महत्त्वाच्या उपाययोजना:
• हवा खेळती राहण्यासाठी ४ ते ५ फूट पट्टा पद्धत वापरा.
• जास्त नत्र खत वापरणे टाळा; पोटॅश व स्फुरदाचा संतुलित वापर करा.
• प्रादुर्भाव जास्त असल्यास कृषी सेवा केंद्राच्या सल्ल्याने बुरशीनाशक फवारा.

3) रोग ओळखण्याच्या टिप्स:
• पानावरील पिवळे ठिपके नंतर लाल-तपकिरी पुटकुळ्यात बदलतात आणि पुसल्यास तांबडी पावडर हाताला लागते.

4) जैविक / सेंद्रिय पर्याय:
• सुडोमोनास फ्लूरोसन्स (Pseudomonas fluorescens 10g/L) फवारणी करा.
• पाचट आच्छादन (Mulching) करून जमिनीत ओलावा टिकवा.

5) कृषी अधिकारी सल्ला:
मोठ्या वाढीच्या टप्प्यात रोग पसरल्यास कृषी अधिकाऱ्यांचे मार्गदर्शन घ्या.`,
      yellow: `1) थोडक्यात उत्तर:
यलो लीफ व्हायरसमुळे (SCYLV) पानाची मध्य शिरा तीव्र पिवळी पडते आणि साखरेची निर्मिती बाधित होते.

2) शेतातील महत्त्वाच्या उपाययोजना:
• प्रमाणित बेणे नर्सरीतून रोगमुक्त बेणे वापरा.
• मावा कीटकांचे नियंत्रण करा व जमिनीत पुरेशा पोटॅशचा पुरवठा करा.
• सरीमध्ये पाणी साचू देऊ नका.

3) रोग ओळखण्याच्या टिप्स:
• वरून ३ ऱ्या ते ५ व्या पानाची मध्य शिरा चमकदार पिवळी दिसते.

4) जैविक / सेंद्रिय पर्याय:
• निंबोळी अर्क (NSKE 5%) फवारणी करा.
• ढालकीडे (Ladybird beetles) यांसारख्या मित्रकीटकांचे जतन करा.

5) कृषी अधिकारी सल्ला:
योग्य वाण निवडीसाठी कारखान्याच्या शेतकी अधिकाऱ्यांचा सल्ला घ्या.`,
      general: `1) थोडक्यात उत्तर:
ऊसाचे भरघोस उत्पादन व रोगप्रतिकारशक्तीसाठी खोल नांगरट, बेणे प्रक्रिया, संतुलित खत व्यवस्थापन (NPK 100:40:40 किग्रॅ/एकड) आणि ठिबक/सरी सिंचनावर भर द्या.

2) शेतातील महत्त्वाच्या उपाययोजना:
• ४ ते ४.५ फूट अंतरावर खोल सऱ्या सोडा.
• लागवडीपूर्वी बेण्यास बुरशीनाशक / ट्रायकोडेमाची प्रक्रिया करा.
• ९० ते १२० दिवसांत मोठी बांधणी (Earthing-up) करा.
• पाण्याचा ताण व तण नियंत्रणासाठी पाचट आच्छादन करा.

3) कीड व रोग ओळखण्याच्या टिप्स:
• पानावरील ठिपके, तांबेरा, तांबोरा व खोडकिडीसाठी दर आठवड्याला पाहणी करा.

4) सुरक्षित रासायनिक पर्याय:
• शिफारशीत कीटकनाशकांच्या योग्य मात्रेसाठी स्थानिक कृषी सहाय्यकांचा सल्ला घ्या.

5) जैविक / सेंद्रिय पर्याय:
• ट्रायकोडेमा व ॲझोस्पिरिलमयुक्त शेणखत (१० टन/एकड) वापरा.

6) कृषी अधिकारी सल्ला:
माती परीक्षण व हंगामी सल्ल्यासाठी जवळच्या कृषी भवन किंवा साखर कारखान्यास भेट द्या.`
    },
    hi: {
      redRot: `1) त्वरित उत्तर:
रेड रॉट (लाल सड़न) गन्ने का एक गंभीर कवक रोग है। इसमें गन्ने का भीतरी भाग लाल हो जाता है, सफेद धब्बे पड़ते हैं और सिरके जैसी गंध आती है।

2) खेत में मुख्य कदम:
• रोगग्रस्त गन्ने के पौधों को जड़ समेत उखाड़कर तुरंत जला दें।
• खेत में जल निकासी की उचित व्यवस्था रखें ताकि जड़ों में पानी न रुके।
• बुवाई से पूर्व बीज टुकड़ों (सेट्स) को ट्राइकोडर्मा विरिडी या कवकनाशी से उपचारित करें।
• धान या दलहनी फसलों के साथ 2 वर्ष का फसल चक्र अपनाएं।

3) रोग पहचान टिप्स:
• ऊपरी पत्तियां ऊपर से नीचे की ओर पीली होकर सूखने लगती हैं।
• गन्ने को चीरने पर भीतरी गूदे में लाल धब्बे और सफेद आड़ी पट्टियां दिखाई देती हैं।

4) जैविक / जैविक नियंत्रण:
• ट्राइकोडर्मा विरिडी (2.5 किग्रा/एकड़) को गोबर की खाद में मिलाकर खेत में डालें।
• गर्म जल उपचार (50°C पर 2 घंटे) किया हुआ स्वस्थ बीज प्रयोग करें।

5) कृषि अधिकारी परामर्श:
लाल सड़न संवेदनशील किस्मों को बदलने के लिए नजदीकी चीनी मिल के कृषि अधिकारी से संपर्क करें।`,
      mosaic: `1) त्वरित उत्तर:
गन्ना मोज़ेक वायरस के कारण पत्तियों पर पीले और हरे रंग के धब्बे बनते हैं, जिससे प्रकाश संश्लेषण और उपज में कमी आती है।

2) खेत में मुख्य कदम:
• नई बुवाई के लिए वायरस-मुक्त टिश्यू कल्चर बीज का उपयोग करें।
• रोग फैलाने वाले माहू (Aphids) कीटों पर नियंत्रण रखें।
• संक्रमित छोटे पौधों को उखाड़कर नष्ट करें।

3) रोग पहचान टिप्स:
• पत्तियों की शिराओं के साथ हल्के और गहरे हरे रंग की धारियां दिखाई देती हैं।

4) जैविक / जैविक नियंत्रण:
• माहू कीट नियंत्रण के लिए नीम तेल (3ml/लीटर) का छिड़काव करें।
• खेत की मेड़ों को घास व खरपतवार से मुक्त रखें।

5) कृषि अधिकारी परामर्श:
बीज प्रमाणीकरण हेतु निकटतम कृषि विज्ञान केंद्र (KVK) से संपर्क करें।`,
      rust: `1) त्वरित उत्तर:
गन्ना रस्ट (गेरुई) पत्तियों का कवक रोग है, जिससे पत्तियों के निचले हिस्से पर लाल-भूरे रंग के दाने बनते हैं।

2) खेत में मुख्य कदम:
• धूप और हवा के लिए कूंड़ों के बीच 4 से 5 फीट की दूरी रखें।
• अत्यधिक नाइट्रोजन उर्वरक से बचें; पोटाश और फास्फोरस का संतुलित प्रयोग करें।
• प्रकोप अधिक होने पर उपयुक्त कवकनाशी का छिड़काव करें।

3) रोग पहचान टिप्स:
• छोटे पीले धब्बे लंबे लाल-भूरे दानों में बदल जाते हैं, जिन्हें पोंछने पर हाथों में जंग जैसा पाउडर लगता है।

4) जैविक / जैविक नियंत्रण:
• स्यूडोमोनास फ्लोरेसेंस (10 ग्राम/लीटर) का छिड़काव करें।
• सूखी पत्तियों (पाचट) का मल्चिंग करें।

5) कृषि अधिकारी परामर्श:
रोग अधिक फैलने पर स्थानीय कृषि प्रसार अधिकारी से सलाह लें।`,
      yellow: `1) त्वरित उत्तर:
येलो लीफ वायरस के कारण ऊपरी पत्तियों की मुख्य सिरा पीली हो जाती है, जिससे शर्करा निर्माण प्रभावित होता है।

2) खेत में मुख्य कदम:
• प्रमाणित नर्सरी से रोगमुक्त बीज गन्ने का प्रयोग करें।
• माहू कीटों का नियंत्रण करें और मिट्टी में पोटाश की उचित मात्रा दें।
• खेत में पानी जमा न होने दें।

3) रोग पहचान टिप्स:
• ऊपर से 3री से 5वीं पत्ती की मुख्य शिरा चमकीली पीली दिखाई देती है।

4) जैविक / जैविक नियंत्रण:
• निंबोली अर्क (NSKE 5%) का छिड़काव करें।
• मित्र कीटों (लेडीबर्ड बीटल) का संरक्षण करें।

5) कृषि अधिकारी परामर्श:
उपयुक्त किस्म के चयन हेतु चीनी मिल के कृषि अधिकारी से संपर्क करें।`,
      general: `1) त्वरित उत्तर:
गन्ने की उच्च पैदावार और रोग प्रतिरोधकता के लिए गहरी जुताई, बीज उपचार, संतुलित उर्वरक (NPK 100:40:40 किग्रा/एकड़) और ड्रिप/कूंड़ सिंचाई अपनाएं।

2) खेत में मुख्य कदम:
• 4 से 4.5 फीट की दूरी पर गहरे कूंड़ बनाएं।
• बुवाई से पहले बीजों को ट्राइकोडर्मा/कवकनाशी से उपचारित करें।
• 90-120 दिनों में पौधों पर मिट्टी चढ़ाएं (Earthing-up)।
• नमी संरक्षण और खरपतवार नियंत्रण के लिए पाचट मल्चिंग करें।

3) कीट एवं रोग पहचान टिप्स:
• पत्ती के धब्बों, रस्ट और कंसुआ/कीटों के लिए साप्ताहिक निरीक्षण करें।

4) सुरक्षित रासायनिक विकल्प:
• पंजीकृत कीटनाशकों की सही खुराक के लिए कृषि विस्तार अधिकारी से सलाह लें।

5) जैविक / जैविक नियंत्रण:
• गोबर की खाद (10 टन/एकड़) में ट्राइकोडर्मा मिलाकर प्रयोग करें।

6) कृषि अधिकारी परामर्श:
मृदा परीक्षण और मौसमी सलाह के लिए निकटतम कृषि भवन या चीनी मिल विजिट करें।`
    },
    ml: {
      redRot: `1) ചുരുക്കത്തിൽ:
റെഡ് റോട്ട് (ചുവപ്പ് ചീയൽ) കരിമ്പിനെ ബാധിക്കുന്ന കഠിനമായ കുമിൾ രോഗമാണ്. തണ്ടിനുള്ളിൽ ചുവപ്പ് നിറവും അല്പം പുളിപ്പുള്ള മണവും ഉണ്ടാകുന്നു.

2) ചെയ്യേണ്ട കാര്യങ്ങൾ:
• രോഗം ബാധിച്ച ചെടികൾ വേരോടെ പിഴുതെടുത്ത് കത്തിക്കുക.
• തോട്ടത്തിൽ വെള്ളക്കെട്ട് ഒഴിവാക്കുക.
• നടുന്നതിന് മുൻപ് വിത്ത് ട്രൈക്കോഡെർമ വിരിഡി ഉപയോഗിച്ച് ചികിത്സിക്കുക.
• നെല്ല് അല്ലെങ്കിൽ പയറുവർഗ്ഗങ്ങളുമായി വിളപരിക്രമണം നടത്തുക.

3) രോഗലക്ഷണങ്ങൾ:
• മുകളിലത്തെ ഇലകൾ മഞ്ഞനിറമായി ഉണങ്ങുന്നു.
• തണ്ട് നീളത്തിൽ പിളർക്കുമ്പോൾ ചുവന്ന പാടുകളും വെളുത്ത വരകളും കാണാം.

4) ജൈവ നിയന്ത്രണം:
• ട്രൈക്കോഡെർമ വിരിഡി ചാണകവുമായി ചേർത്ത് മണ്ണിൽ നൽകുക.
• ചൂടുവെള്ള ചികിത്സ നൽകിയ വിത്തുകൾ മാത്രം ഉപയോഗിക്കുക.

5) കൃഷി ഭവൻ നിർദ്ദേശം:
രോഗപ്രതിരോധശേഷിയുള്ള ഇനങ്ങൾക്കായി അടുത്തുള്ള കൃഷി ഓഫീസറെ കാണുക.`,
      mosaic: `1) ചുരുക്കത്തിൽ:
കരിമ്പ് മൊസൈക് വൈറസ് മൂലം ഇലകളിൽ മഞ്ഞയും പച്ചയും പാടുകൾ ഉണ്ടാകുന്നു.

2) ചെയ്യേണ്ട കാര്യങ്ങൾ:
• ടിഷ്യു കൾച്ചർ വിത്തുകൾ ഉപയോഗിക്കുക.
• ഈച്ചകളെ നിയന്ത്രിക്കുക.
• രോഗമുള്ള ചെറിയ ചെടികൾ നീക്കം ചെയ്യുക.

3) രോഗലക്ഷണങ്ങൾ:
• ഇലകളിൽ വെളുത്തതും ഇരുണ്ടതുമായ പച്ച വരകൾ കാണാം.

4) ജൈവ നിയന്ത്രണം:
• വേപ്പെണ്ണ (3ml/L) തളിക്കുക.
• തോട്ടത്തിലെ കളകൾ നശിപ്പിക്കുക.

5) കൃഷി ഭവൻ നിർദ്ദേശം:
കൂടുതൽ വിവരങ്ങൾക്ക് കാർഷിക വിജ്ഞാന കേന്ദ്രം (KVK) സന്ദർശിക്കുക.`,
      rust: `1) ചുരുക്കത്തിൽ:
കരിമ്പ് തുരുമ്പ് രോഗം ഇലകളിൽ ചുവപ്പ് കലർന്ന തവിട്ടുനിറത്തിലുള്ള കുരുക്കൾ ഉണ്ടാക്കുന്നു.

2) ചെയ്യേണ്ട കാര്യങ്ങൾ:
• കാറ്റും വെളിച്ചവും കിട്ടാൻ 4-5 അടി അകലം പാലിക്കുക.
• അമിതമായ നൈട്രജൻ ഒഴിവാക്കുക.
• ആവശ്യാനുസരണം കുമിൾനാശിനി തളിക്കുക.

3) രോഗലക്ഷണങ്ങൾ:
• ഇലയുടെ അടിവശത്ത് തവിട്ട് കുരുക്കൾ കാണാം.

4) ജൈവ നിയന്ത്രണം:
• സൂഡോമോനാസ് തളിക്കുക.
• ഇലകൾ കൊണ്ട് മണ്ണിൽ പുതയിടുക.

5) കൃഷി ഭവൻ നിർദ്ദേശം:
രോഗം പടരുകയാണെങ്കിൽ കൃഷി ഓഫീസറുടെ ഉപദേശം തേടുക.`,
      yellow: `1) ചുരുക്കത്തിൽ:
മഞ്ഞ ഇല രോഗം ഇലയുടെ മധ്യഞരമ്പ് മഞ്ഞനിറത്തിലാക്കുന്നു.

2) ചെയ്യേണ്ട കാര്യങ്ങൾ:
• ആരോഗ്യമുള്ള വിത്തുകൾ ഉപയോഗിക്കുക.
• പൊട്ടാഷ് വളങ്ങൾ കൃത്യമായി നൽകുക.
• വെള്ളക്കെട്ട് ഒഴിവാക്കുക.

3) രോഗലക്ഷണങ്ങൾ:
• മുകളിലത്തെ ഇലകളുടെ മധ്യഞരമ്പ് മഞ്ഞനിറത്തിലാകുന്നു.

4) ജൈവ നിയന്ത്രണം:
• വേപ്പിൻകുരു സത്ത് (5%) തളിക്കുക.

5) കൃഷി ഭവൻ നിർദ്ദേശം:
കൃഷി ഓഫീസറുടെ ഉപദേശം തേടുക.`,
      general: `1) ചുരുക്കത്തിൽ:
കരിമ്പിന്റെ നല്ല വിളവിനായി ആഴത്തിലുള്ള ഉഴവ്, വിത്ത് ചികിത്സ, സമീകൃത വളപ്രയോഗം (NPK 100:40:40 kg/acre), തുള്ളിനന എന്നിവ ഉറപ്പാക്കുക.

2) ചെയ്യേണ്ട കാര്യങ്ങൾ:
• 4 മുതൽ 4.5 അടി അകലത്തിൽ ചാലുകൾ എടുക്കുക.
• നടുന്നതിന് മുൻപ് വിത്ത് കുമിൾനാശിനി കൊണ്ട് ചികിത്സിക്കുക.
• 90-120 ദിവസങ്ങളിൽ ചെടിക്ക് ചുറ്റും മണ്ണ് കൂട്ടിക്കൊടുക്കുക.
• ഇർപ്പം നിലനിർത്താൻ പുതയിടൽ നടത്തുക.

3) രോഗലക്ഷണങ്ങൾ:
• ഇലകളിലെ പാടുകളും കീടങ്ങളും പതിവായി പരിശോധിക്കുക.

4) ജൈവ നിയന്ത്രണം:
• ചാണകവളത്തോടൊപ്പം ട്രൈക്കോഡെർമ ചേർത്ത് നൽകുക.

5) കൃഷി ഭവൻ നിർദ്ദേശം:
മണ്ണ് പരിശോധനയ്ക്കായി അടുത്തുള്ള കൃഷി ഭവൻ സന്ദർശിക്കുക.`
    }
  };

  const langKey = answers[language] ? language : 'en';
  const dict = answers[langKey];

    // Domain-specific multi-crop fallbacks
    if (q.includes('wheat') || q.includes('गहू') || q.includes('गेहूं')) {
      if (language === 'mr') {
        return `१) गव्हाचे उत्पादन (Wheat):
महाराष्ट्रात गव्हाच्या भरघोस उत्पादनासाठी (HD-2967, समाधान, त्र्यंबक) नोव्हेंबरच्या पहिल्या पंधरवड्यात पेरणी करावी.
२) खते: हेक्टरी १२०:६०:४० किलो NPK. संपूर्ण स्फुरद व पालाश आणि १/३ नत्र पेरणीवेळी, उरलेले नत्र २१ दिवसांनी व कांडी अवस्थेत द्यावे.
३) पाणी: मुकुटमुळे फुटण्याची अवस्था (२१ दिवस) पाणी देण्यासाठी अत्यंत संवेदनशील आहे.`;
      }
      return `1) Wheat Production:
Sow between Nov 1–20 using high-yielding varieties (HD-2967, GW-322).
2) Fertilizer: Apply NPK 120:60:40 kg/ha with 1/3 N + full P & K basal, followed by top dressings at CRI (21 days) and flowering.
3) Irrigation: Crown Root Initiation (CRI at 21 days) is the most critical irrigation stage.`;
    }

    if (q.includes('soybean') || q.includes('सोयाबीन')) {
      if (language === 'mr') {
        return `१) सोयाबीन व गहू पीक फेरपालट (Crop Rotation):
सोयाबीन (खरीप) हे हवेतील नत्र जमिनीत स्थिर करते (३०-४० किलो N/हेक्टर), ज्यामुळे रब्बी गव्हाला सुपीक जमीन मिळते आणि उत्पादनात १५-२०% वाढ होते.
२) काळजी: सोयाबीनसाठी रुंद वरंबा-सरी (BBF) पद्धत वापरा आणि गव्हाच्या सुरुवातीचा नत्र २५% कमी केला तरी चालतो.`;
      }
      return `1) Soybean & Wheat Crop Rotation:
Soybean (Kharif legume) fixes atmospheric nitrogen (30-40 kg N/ha), improving soil organic matter and providing a fertile bed for Rabi Wheat.
2) Best Practice: Use Broad Bed Furrow (BBF) for soybean to avoid waterlogging; follow with wheat at recommended spacing for maximum rotational yield.`;
    }

    if (q.includes('rain') || q.includes('पाणी') || q.includes('water') || q.includes('irrigation') || q.includes('सिंचन')) {
      if (language === 'mr') {
        return `१) पाणी व निचरा व्यवस्थापन:
जास्त पाऊस झाल्यास शेतात पाणी साचू न देता तात्काळ चर काढून पाण्याचा निचरा करावा.
२) ऊसासाठी ठिबक सिंचनाने पाण्याची ४०-५०% बचत होते. उन्हाळ्यात ८-१० दिवसांनी आणि हिवाळ्यात १२-१५ दिवसांनी पाणी द्यावे.`;
      }
      return `1) Water & Drainage Management:
After heavy rainfall, immediately open field furrows and drainage channels. Standing water for over 24 hours leads to root rot and chlorosis.
2) Sugarcane Irrigation: Maintain 8-10 day intervals in summer and 12-14 days in winter, or adopt drip irrigation to save 40-50% water.`;
    }

    if (q.includes('खत') || q.includes('fertilizer') || q.includes('उर्वरक') || q.includes('npk')) {
      if (language === 'mr') {
        return `१) संतुलित खत व्यवस्थापन:
माती परीक्षणानुसार नत्र, स्फुरद, पालाश व सूक्ष्मअन्नद्रव्ये (झिंक, फेरस) द्यावीत.
२) ऊस खत वेळापत्रक: २५०:११५:११५ किलो NPK/हेक्टर. लागवडवेळी १०% नत्र, ५०% स्फुरद, ५०% पालाश; ६-८ आठवड्यांनी ४०% नत्र; मोठ्या बांधणीवेळी (१२०-१३५ दिवस) उरलेले खत द्यावे.`;
      }
      return `1) Balanced Fertilizer Schedule:
Ground applications on soil tests (NPK ratio + micronutrients Zinc & Iron).
2) Sugarcane: 250:115:115 kg/ha NPK. Basal (10% N, 50% P, 50% K), 6-8 weeks (40% N), Earthing-up at 120-135 days (remaining N, P, K).`;
    }

    return dict.general;
  };

  router.post('/', optionalAuth, async (req, res) => {
    try {
      const { query, language = 'en', location = 'India', history = [] } = req.body;
      if (!query || !query.trim()) {
        return res.status(400).json({ message: 'Query text is required' });
      }

      let answer = '';
      let isAiGenerated = false;
      let serviceNotice = null;
      let sources = [
        { title: 'KrishSathi Sugarcane Expert Engine', date: new Date().toISOString().split('T')[0] },
        { title: 'ICAR-Sugarcane Breeding Institute (SBI) Guidelines', date: new Date().toISOString().split('T')[0] }
      ];

      try {
        answer = await getGroqAnswer({
          query: query.trim(),
          language,
          location,
          history
        });
        isAiGenerated = true;
        sources.unshift({ title: 'Groq AI Agricultural Assistant', date: new Date().toISOString().split('T')[0] });
      } catch (llmErr) {
        console.warn('Groq LLM call fell back to verified knowledge base:', llmErr.message);
        serviceNotice = 'Live AI engine experienced high traffic. Loaded verified ICAR/KVK agricultural knowledge answer.';
        answer = getFallbackSugarcaneAnswer(query.trim(), language);
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
        sources,
        isAiGenerated,
        serviceNotice
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
