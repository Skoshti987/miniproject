const express = require('express');

const router = express.Router();

const WEATHER_BASE_URL = process.env.WEATHER_BASE_URL || 'https://api.openweathermap.org/data/2.5';
const GEO_BASE_URL = 'https://api.openweathermap.org/geo/1.0/direct';
const OPEN_WEATHER_HOST = 'api.openweathermap.org';

const safeJson = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const getAdviceFromWeather = (current, forecast) => {
  // Static fallback used only when Groq is unavailable
  const recommendations = [];
  const warnings = [];

  // Sugarcane Specific Weather Advisories
  recommendations.push('Sugarcane crop care: ensure proper field drainage channels during heavy rains to prevent root rot.');

  if (current.humidity >= 80) {
    recommendations.push('High humidity detected: Monitor sugarcane leaves for Rust or Red Rot lesions. Avoid excessive nitrogen applications.');
    warnings.push('High humidity increases fungal disease risk in sugarcane and vegetables.');
  }

  if (current.windSpeed >= 20) {
    recommendations.push('Strong wind expected: Earthing-up sugarcane rows prevents lodging (falling over) of mature canes.');
    warnings.push('Strong wind expected. Postpone pesticide spraying and secure tall sugarcane stalks.');
  }

  const heavyRainDay = forecast.find((day) => day.rainfall >= 20);
  if (heavyRainDay) {
    recommendations.push(`Heavy rain expected on ${heavyRainDay.day}. Postpone field irrigation and fertigation.`);
    warnings.push(`Heavy rain expected on ${heavyRainDay.day}. Clear field drains immediately.`);
  } else {
    recommendations.push('Low rainfall expected: Plan light irrigation during sugarcane tillering/formative stage.');
  }

  if (current.temperature >= 35) {
    recommendations.push('High temperature: Practice trash mulching between sugarcane rows to retain soil moisture and reduce heat stress.');
    warnings.push('Extreme heat stress: Irrigate in early morning or evening.');
  }

  return {
    title: 'Sugarcane & Crop Weather Advisory',
    recommendations,
    warnings
  };
};

const getDynamicWeatherAdvisory = async ({ current, forecast, location }) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

  const currentSummary = [
    `Temperature: ${current.temperature}°C`,
    `Humidity: ${current.humidity}%`,
    `Rainfall: ${current.rainfall}mm`,
    `Wind: ${current.windSpeed}km/h`,
    `Condition: ${current.condition}`
  ].join(', ');

  const forecastSummary = forecast.slice(0, 5).map((d) =>
    `${d.day}: ${d.high}/${d.low}°C, ${d.condition}, rain ${d.rainfall}mm`
  ).join('; ');

  const prompt = [
    'You are KrishSathi, a practical farming weather advisor for Indian farmers.',
    `Location: ${location || 'India'}.`,
    'Give advice a farmer can act on TODAY based on this weather data.',
    'Use simple Hindi-English mix if helpful. Keep it short and practical.',
    '',
    `Current weather: ${currentSummary}`,
    `5-day forecast: ${forecastSummary}`,
    '',
    'Return ONLY valid JSON (no extra text) in this exact schema:',
    '{',
    '  "title": "short weather advisory title",',
    '  "summary": "1-2 sentence overview of what farmer should watch for today",',
    '  "recommendations": ["actionable tip 1", "tip 2", ...],',
    '  "warnings": ["alert 1", ...],',
    '  "irrigationAdvice": "when and how much to irrigate",',
    '  "sprayAdvice": "whether to spray today or wait, and why",',
    '  "cropRisk": "which crops are most at risk from this weather and why"',
    '}',
    '',
    'Rules:',
    '- Be specific to the weather numbers, not generic.',
    '- If rain is coming, mention field drainage and harvesting timing.',
    '- If hot and dry, mention irrigation timing and mulching.',
    '- If humid, mention fungal risk and ventilation.',
    '- Max 5 recommendations, max 3 warnings.',
    '- Do not recommend specific pesticide brands or doses.'
  ].join('\n');

  try {
    const resp = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        max_tokens: 600,
        messages: [
          {
            role: 'system',
            content: 'You are a careful agricultural weather advisor. Output ONLY valid JSON. Be specific to the weather data provided.'
          },
          { role: 'user', content: prompt }
        ]
      })
    });

    if (!resp.ok) return null;

    const payload = await resp.json();
    const content = payload?.choices?.[0]?.message?.content?.trim();
    if (!content) return null;

    const start = content.indexOf('{');
    const end = content.lastIndexOf('}');
    if (start === -1 || end === -1) return null;

    const parsed = JSON.parse(content.slice(start, end + 1));
    return {
      title: parsed.title || 'Weather-based farming advisory',
      summary: parsed.summary || '',
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
      irrigationAdvice: parsed.irrigationAdvice || '',
      sprayAdvice: parsed.sprayAdvice || '',
      cropRisk: parsed.cropRisk || ''
    };
  } catch {
    return null;
  }
};

const weekday = (dateString) =>
  new Date(dateString).toLocaleDateString('en-IN', { weekday: 'long' });

const INDIAN_REGION_HINT =
  /\b(maharashtra|kerala|karnataka|tamil\s*nadu|gujarat|punjab|bihar|rajasthan|uttar\s*pradesh|madhya\s*pradesh|telangana|andhra\s*pradesh|west\s*bengal|odisha|orissa|chhattisgarh|assam|goa|jharkhand|haryana|himachal|jammu)\b/i;

const suggestsIndiaBias = (q) => /\bindia\b/i.test(q) || INDIAN_REGION_HINT.test(q);

const geoDisplay = (row) => [row.name, row.state, row.country].filter(Boolean).join(', ');

const scoreGeoMatch = (row, rawQuery) => {
  const tokens = rawQuery
    .toLowerCase()
    .split(/[\s,]+/)
    .filter((t) => t.length > 1);
  const blob = `${row.name || ''} ${row.state || ''} ${row.country || ''}`.toLowerCase();
  let score = row.country === 'IN' ? 12 : 0;
  for (const tok of tokens) {
    if (blob.includes(tok)) score += 6;
  }
  return score;
};

const pickBestGeo = (rows, rawQuery, { biasIndia } = {}) => {
  if (!rows?.length) return null;
  const ranked = [...rows].sort((a, b) => scoreGeoMatch(b, rawQuery) - scoreGeoMatch(a, rawQuery));
  const indian = ranked.filter((r) => r.country === 'IN');

  if (biasIndia || suggestsIndiaBias(rawQuery)) {
    if (!indian.length) return null;
    return indian[0];
  }

  return ranked[0];
};

const fetchGeoRows = async (apiKey, q, limit = 8) => {
  const geoResponse = await fetch(`${GEO_BASE_URL}?q=${encodeURIComponent(q)}&limit=${limit}&appid=${apiKey}`);
  if (!geoResponse.ok) {
    const errorPayload = await safeJson(geoResponse);
    const err = new Error(errorPayload?.message || 'Failed to fetch location coordinates');
    err.status = geoResponse.status === 401 ? 401 : 502;
    if (geoResponse.status === 401) {
      err.message = `Invalid weather API key. Use a valid OpenWeather key from ${OPEN_WEATHER_HOST}.`;
    }
    throw err;
  }
  const geoData = await geoResponse.json();
  return Array.isArray(geoData) ? geoData : [];
};

const INDIAN_STATE_FIXES = {
  maharastra: 'Maharashtra', maharasthra: 'Maharashtra', maharastra: 'Maharashtra',
  marashtra: 'Maharashtra', maharstra: 'Maharashtra',
  karnatka: 'Karnataka', karnatak: 'Karnataka',
  tamilnadu: 'Tamil Nadu', tamilnad: 'Tamil Nadu',
  uttarpradesh: 'Uttar Pradesh', uttrakhand: 'Uttarakhand',
  madhyapradesh: 'Madhya Pradesh', madhyaprdesh: 'Madhya Pradesh',
  andhrapradesh: 'Andhra Pradesh', andrapradesh: 'Andhra Pradesh',
  westbengal: 'West Bengal',
  chhattisgarh: 'Chhattisgarh', chatisgarh: 'Chhattisgarh', chattisgarh: 'Chhattisgarh',
  himachal: 'Himachal Pradesh',
  jharkhand: 'Jharkhand', jharkand: 'Jharkhand',
  rajsthan: 'Rajasthan', rjasthan: 'Rajasthan',
  gujrat: 'Gujarat', gujarth: 'Gujarat',
  punjb: 'Punjab',
  orissa: 'Odisha',
  telgana: 'Telangana', telengana: 'Telangana'
};

// Built-in coordinates for common Indian cities (fallback when geocoding fails)
const INDIAN_CITY_COORDS = {
  kolhapur: { lat: 16.7050, lon: 74.2433, name: 'Kolhapur', state: 'Maharashtra', country: 'IN' },
  pune: { lat: 18.5204, lon: 73.8567, name: 'Pune', state: 'Maharashtra', country: 'IN' },
  mumbai: { lat: 19.0760, lon: 72.8777, name: 'Mumbai', state: 'Maharashtra', country: 'IN' },
  nashik: { lat: 19.9975, lon: 73.7898, name: 'Nashik', state: 'Maharashtra', country: 'IN' },
  nagpur: { lat: 21.1458, lon: 79.0882, name: 'Nagpur', state: 'Maharashtra', country: 'IN' },
  delhi: { lat: 28.7041, lon: 77.1025, name: 'New Delhi', state: 'Delhi', country: 'IN' },
  bangalore: { lat: 12.9716, lon: 77.5946, name: 'Bengaluru', state: 'Karnataka', country: 'IN' },
  bengaluru: { lat: 12.9716, lon: 77.5946, name: 'Bengaluru', state: 'Karnataka', country: 'IN' },
  chennai: { lat: 13.0827, lon: 80.2707, name: 'Chennai', state: 'Tamil Nadu', country: 'IN' },
  hyderabad: { lat: 17.3850, lon: 78.4867, name: 'Hyderabad', state: 'Telangana', country: 'IN' },
  kolkata: { lat: 22.5726, lon: 88.3639, name: 'Kolkata', state: 'West Bengal', country: 'IN' },
  jaipur: { lat: 26.9124, lon: 75.7873, name: 'Jaipur', state: 'Rajasthan', country: 'IN' },
  lucknow: { lat: 26.8467, lon: 80.9462, name: 'Lucknow', state: 'Uttar Pradesh', country: 'IN' },
  ahmedabad: { lat: 23.0225, lon: 72.5714, name: 'Ahmedabad', state: 'Gujarat', country: 'IN' },
  surat: { lat: 21.1702, lon: 72.8311, name: 'Surat', state: 'Gujarat', country: 'IN' },
  indore: { lat: 22.7196, lon: 75.8577, name: 'Indore', state: 'Madhya Pradesh', country: 'IN' },
  bhopal: { lat: 23.2599, lon: 77.4126, name: 'Bhopal', state: 'Madhya Pradesh', country: 'IN' },
  patna: { lat: 25.6093, lon: 85.1376, name: 'Patna', state: 'Bihar', country: 'IN' },
  chandigarh: { lat: 30.7333, lon: 76.7794, name: 'Chandigarh', state: 'Chandigarh', country: 'IN' },
  thiruvananthapuram: { lat: 8.5241, lon: 76.9366, name: 'Thiruvananthapuram', state: 'Kerala', country: 'IN' },
  kochi: { lat: 9.9312, lon: 76.2673, name: 'Kochi', state: 'Kerala', country: 'IN' },
  coimbatore: { lat: 11.0168, lon: 76.9558, name: 'Coimbatore', state: 'Tamil Nadu', country: 'IN' },
  vizag: { lat: 17.6868, lon: 83.2185, name: 'Visakhapatnam', state: 'Andhra Pradesh', country: 'IN' },
  visakhapatnam: { lat: 17.6868, lon: 83.2185, name: 'Visakhapatnam', state: 'Andhra Pradesh', country: 'IN' },
  bhubaneswar: { lat: 20.2961, lon: 85.8245, name: 'Bhubaneswar', state: 'Odisha', country: 'IN' },
  dehradun: { lat: 30.3165, lon: 78.0322, name: 'Dehradun', state: 'Uttarakhand', country: 'IN' },
  ranchi: { lat: 23.3441, lon: 85.3096, name: 'Ranchi', state: 'Jharkhand', country: 'IN' },
  guwahati: { lat: 26.1445, lon: 91.7362, name: 'Guwahati', state: 'Assam', country: 'IN' }
};

const fixIndianStateTypos = (q) => {
  let fixed = q;
  for (const [typo, correct] of Object.entries(INDIAN_STATE_FIXES)) {
    fixed = fixed.replace(new RegExp(`\\b${typo}\\b`, 'gi'), correct);
  }
  return fixed;
};

const resolveGeo = async (apiKey, rawLocation) => {
  const location = rawLocation.trim() || 'India';
  const preferIndia = suggestsIndiaBias(location);

  // Fix common Indian state misspellings
  const fixedLocation = fixIndianStateTypos(location);

  const attempts = [
    fixedLocation,
    !/,\s*(india|in)\s*$/i.test(fixedLocation) ? `${fixedLocation}, India` : null,
    !/,\s*(india|in)\s*$/i.test(fixedLocation) ? `${fixedLocation}, IN` : null
  ].filter(Boolean);

  // Fallback: if query has 2+ tokens, also try just first token (city) + India
  const tokens = fixedLocation.split(/[\s,]+/).filter((t) => t.length > 1);
  if (tokens.length >= 2) {
    const cityOnly = tokens[0];
    attempts.push(`${cityOnly}, India`);
    attempts.push(`${cityOnly}, IN`);
  }

  const tried = new Set();
  for (const q of attempts) {
    if (tried.has(q)) continue;
    tried.add(q);
    let rows;
    try {
      rows = await fetchGeoRows(apiKey, q, 8);
    } catch (e) {
      throw e;
    }
    const best = pickBestGeo(rows, location, {
      biasIndia: preferIndia || /,\s*(india|in)\s*$/i.test(q)
    });
    if (best) return best;
  }

  // Ultimate fallback: check built-in Indian city coordinates
  for (const tok of tokens) {
    const cityKey = tok.toLowerCase();
    if (INDIAN_CITY_COORDS[cityKey]) {
      return INDIAN_CITY_COORDS[cityKey];
    }
  }

  return null;
};

router.get('/', async (req, res) => {
  try {
    const location = (req.query.location || 'India').trim();
    const apiKey = process.env.WEATHER_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ message: 'WEATHER_API_KEY is missing in backend .env' });
    }

    let geoRow;
    try {
      geoRow = await resolveGeo(apiKey, location);
    } catch (err) {
      const status = err.status || 502;
      return res.status(status).json({ message: err.message });
    }

    if (!geoRow) {
      return res.status(404).json({
        message: 'Location not found. Try: "Kolhapur, Maharashtra, India" or district + state.'
      });
    }

    const { lat, lon } = geoRow;
    const displayLocation = geoDisplay(geoRow);

    const [currentResp, forecastResp] = await Promise.all([
      fetch(`${WEATHER_BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`),
      fetch(`${WEATHER_BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`)
    ]);

    if (!currentResp.ok || !forecastResp.ok) {
      const currentErr = !currentResp.ok ? await safeJson(currentResp) : null;
      const forecastErr = !forecastResp.ok ? await safeJson(forecastResp) : null;
      return res.status(502).json({
        message: currentErr?.message || forecastErr?.message || 'Failed to fetch weather data'
      });
    }

    const currentData = await currentResp.json();
    const forecastData = await forecastResp.json();

    const current = {
      temperature: Math.round(currentData.main.temp),
      humidity: currentData.main.humidity,
      rainfall: Number((currentData.rain?.['1h'] || 0).toFixed(1)),
      windSpeed: Number((currentData.wind.speed * 3.6).toFixed(1)),
      visibility: Number(((currentData.visibility || 0) / 1000).toFixed(1)),
      condition: currentData.weather?.[0]?.main || 'Clear'
    };

    const byDate = new Map();
    for (const item of forecastData.list || []) {
      const date = item.dt_txt?.split(' ')[0];
      if (!date) continue;
      if (!byDate.has(date)) byDate.set(date, []);
      byDate.get(date).push(item);
    }

    const forecast = [...byDate.entries()].slice(0, 7).map(([date, items], index) => {
      const temps = items.map((x) => x.main.temp);
      const rain = items.reduce((sum, x) => sum + (x.rain?.['3h'] || 0), 0);
      const noonLike = items.find((x) => x.dt_txt?.includes('12:00:00')) || items[0];
      return {
        day: index === 0 ? 'Today' : weekday(date),
        high: Math.round(Math.max(...temps)),
        low: Math.round(Math.min(...temps)),
        condition: noonLike.weather?.[0]?.main || 'Clear',
        rainfall: Number(rain.toFixed(1))
      };
    });

    // Try dynamic Groq advisory first (8s timeout), fall back to static
    let advisory;
    try {
      const dynamicPromise = getDynamicWeatherAdvisory({ current, forecast, location: displayLocation });
      const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 8000));
      advisory = await Promise.race([dynamicPromise, timeoutPromise]);
    } catch {
      advisory = null;
    }

    if (!advisory) {
      advisory = getAdviceFromWeather(current, forecast);
    }

    return res.json({ location: displayLocation, current, forecast, advisory });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to load weather information' });
  }
});

module.exports = router;
