const { onRequest } = require("firebase-functions/v2/https");

/**
 * Proxy requests to OpenSky Network API to avoid CORS issues in production.
 * Handles: /api/opensky/states/all?icao24=...
 */
exports.opensky = onRequest({ region: "us-central1" }, async (req, res) => {
  // Forward query params to OpenSky
  const params = new URLSearchParams(req.query);
  const url = `https://opensky-network.org/api/states/all?${params.toString()}`;

  try {
    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
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
 * Proxy requests to ADS-B Exchange (RapidAPI) to keep API keys server-side.
 * Handles: /api/adsbx/v2/icao/:icao24/
 */
exports.adsbx = onRequest({ region: "us-central1" }, async (req, res) => {
  // Extract the path after /api/adsbx/
  const pathMatch = req.path.match(/\/v2\/icao\/([a-fA-F0-9]+)/);
  if (!pathMatch) {
    res.status(400).json({ error: "Invalid request path" });
    return;
  }
  const icao24 = pathMatch[1];
  const apiKey = req.query.apiKey;
  if (!apiKey) {
    res.status(400).json({ error: "Missing apiKey parameter" });
    return;
  }

  const url = `https://adsbexchange-com1.p.rapidapi.com/v2/icao/${icao24}/`;

  try {
    const response = await fetch(url, {
      headers: {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": "adsbexchange-com1.p.rapidapi.com",
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      res.status(response.status).json({ error: `ADSBx API error: ${response.status}` });
      return;
    }

    const data = await response.json();
    res.set("Cache-Control", "no-cache");
    res.json(data);
  } catch (err) {
    console.error("ADSBx proxy error:", err);
    res.status(502).json({ error: "Failed to reach ADS-B Exchange API" });
  }
});

/**
 * Proxy requests to OpenWeatherMap API.
 * Handles: /api/weather/weather?lat=...&lon=...&appid=...&units=...
 */
exports.weather = onRequest({ region: "us-central1" }, async (req, res) => {
  const params = new URLSearchParams(req.query);
  const url = `https://api.openweathermap.org/data/2.5/weather?${params.toString()}`;

  try {
    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
      },
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
