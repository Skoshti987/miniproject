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

const resolveGeo = async (apiKey, rawLocation) => {
  const location = rawLocation.trim() || 'India';
  const preferIndia = suggestsIndiaBias(location);

  const attempts = [
    location,
    !/,\s*(india|in)\s*$/i.test(location) ? `${location}, India` : null,
    !/,\s*(india|in)\s*$/i.test(location) ? `${location}, IN` : null
  ].filter(Boolean);

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
