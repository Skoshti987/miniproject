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

const getAdviceFromWeather = (current, forecast) => {
  const recommendations = [];
  const warnings = [];

  if (current.humidity >= 80) {
    recommendations.push('Humidity is high. Check crops for fungal disease and keep good field ventilation.');
    warnings.push('High humidity can increase fungus risk in vegetables and pulses.');
  }

  if (current.windSpeed >= 20) {
    recommendations.push('Support weak plants and postpone pesticide spraying in strong wind.');
    warnings.push('Strong wind expected. Avoid spraying chemicals now.');
  }

  const heavyRainDay = forecast.find((day) => day.rainfall >= 20);
  if (heavyRainDay) {
    recommendations.push('Clean field drains so rainwater can move out quickly.');
    warnings.push(`Heavy rain expected on ${heavyRainDay.day}. Protect harvested produce.`);
  } else {
    recommendations.push('If rain is low, plan irrigation and mulching to save moisture.');
  }

  if (current.temperature >= 35) {
    recommendations.push('Irrigate in early morning or evening to reduce heat stress.');
    warnings.push('High temperature can stress crops. Avoid daytime fertilizer spray.');
  }

  if (!recommendations.length) {
    recommendations.push('Continue normal crop care and monitor weather updates daily.');
  }

  return {
    title: 'Weather-based farming advisory',
    recommendations,
    warnings
  };
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

    const advisory = getAdviceFromWeather(current, forecast);
    return res.json({ location: displayLocation, current, forecast, advisory });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to load weather information' });
  }
});

module.exports = router;
