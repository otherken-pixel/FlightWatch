const { onRequest } = require("firebase-functions/v2/https");

/**
 * Proxy requests to OpenSky Network API to avoid CORS issues in production.
 * Usage: /api/opensky?icao24=abc123,def456
 */
exports.opensky = onRequest({ region: "us-central1", cors: true }, async (req, res) => {
  const params = new URLSearchParams(req.query);
  const url = `https://opensky-network.org/api/states/all?${params.toString()}`;
  console.log('[opensky] Fetching:', url);

  try {
    const response = await fetch(url, {
      headers: { "Accept": "application/json" },
    });

    if (!response.ok) {
      console.warn('[opensky] upstream returned', response.status);
      res.status(response.status).json({ error: `OpenSky API error: ${response.status}` });
      return;
    }

    const data = await response.json();
    res.set("Cache-Control", "no-cache");
    res.json(data);
  } catch (err) {
    console.error("OpenSky proxy error:", err);
    res.status(502).json({ error: "Failed to reach OpenSky API" });
  }
});

/**
 * Proxy requests to adsb.lol (no API key required).
 * Uses query params to avoid path-extraction issues with Firebase Hosting rewrites.
 * Usage: /api/adsblol?type=icao&ids=abc123,def456
 *    or: /api/adsblol?type=reg&ids=N312NG,N48KL
 */
exports.adsbLol = onRequest({ region: "us-central1", cors: true }, async (req, res) => {
  const type = req.query.type; // 'icao' or 'reg'
  const ids = req.query.ids;

  if (!type || !ids) {
    res.status(400).json({ error: 'Missing type or ids query parameter' });
    return;
  }

  const url = `https://api.adsb.lol/v2/${type}/${ids}`;
  console.log('[adsbLol] Fetching:', url);

  try {
    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "FlightWatch/1.0",
      },
    });

    if (!response.ok) {
      const body = await response.text();
      console.warn('[adsbLol] upstream returned', response.status, body.substring(0, 200));
      res.status(response.status).json({ error: `adsb.lol API error: ${response.status}` });
      return;
    }

    const data = await response.json();
    res.set("Cache-Control", "no-cache");
    res.json(data);
  } catch (err) {
    console.error("adsb.lol proxy error:", err);
    res.status(502).json({ error: "Failed to reach adsb.lol API" });
  }
});

/**
 * Proxy requests to OpenWeatherMap API.
 */
exports.weather = onRequest({ region: "us-central1", cors: true }, async (req, res) => {
  const params = new URLSearchParams(req.query);
  const url = `https://api.openweathermap.org/data/2.5/weather?${params.toString()}`;

  try {
    const response = await fetch(url, {
      headers: { "Accept": "application/json" },
    });

    if (!response.ok) {
      res.status(response.status).json({ error: `Weather API error: ${response.status}` });
      return;
    }

    const data = await response.json();
    res.set("Cache-Control", "public, max-age=300");
    res.json(data);
  } catch (err) {
    console.error("Weather proxy error:", err);
    res.status(502).json({ error: "Failed to reach Weather API" });
  }
});
