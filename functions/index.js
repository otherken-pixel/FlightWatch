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
 * Proxy requests to adsb.lol (no API key required).
 * Handles: /api/adsblol/v2/icao/{icao24} and /api/adsblol/v2/icao/{hex1,hex2,...}
 * Adds required User-Agent header to avoid being filtered.
 */
exports.adsbLol = onRequest({ region: "us-central1" }, async (req, res) => {
  // Strip the hosting rewrite prefix — req.path includes the full original path
  const upstreamPath = req.path.replace(/^\/api\/adsblol/, '');
  const url = `https://api.adsb.lol${upstreamPath}`;

  try {
    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "FlightWatch-App-Internal",
      },
    });

    if (!response.ok) {
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
 * Proxy requests to airplanes.live (additional ADS-B source, no API key required).
 * Same readsb v2 API format as adsb.lol but with a different feeder network,
 * providing broader coverage for GA aircraft.
 */
exports.airplanesLive = onRequest({ region: "us-central1" }, async (req, res) => {
  // Strip the hosting rewrite prefix — req.path includes the full original path
  const upstreamPath = req.path.replace(/^\/api\/airplaneslive/, '');
  const url = `https://api.airplanes.live${upstreamPath}`;

  try {
    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "FlightWatch-App-Internal",
      },
    });

    if (!response.ok) {
      res.status(response.status).json({ error: `airplanes.live API error: ${response.status}` });
      return;
    }

    const data = await response.json();
    res.set("Cache-Control", "no-cache");
    res.json(data);
  } catch (err) {
    console.error("airplanes.live proxy error:", err);
    res.status(502).json({ error: "Failed to reach airplanes.live API" });
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
