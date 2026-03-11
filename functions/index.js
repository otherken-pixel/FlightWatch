const { onRequest } = require("firebase-functions/v2/https");

/**
 * Extract the upstream path from the request.
 * Firebase Hosting rewrites may deliver the original path in req.path,
 * req.originalUrl, or req.url depending on the runtime version.
 * We try all three and strip the known prefix.
 */
function extractUpstreamPath(req, prefix) {
  // Try multiple sources for the original path
  const candidates = [req.originalUrl, req.url, req.path];
  for (const raw of candidates) {
    if (raw && raw.startsWith(prefix)) {
      const stripped = raw.replace(prefix, '');
      // Remove any query string (originalUrl may include it)
      return stripped.split('?')[0];
    }
  }
  // If none matched, the path might already be stripped by the hosting rewrite
  // In that case, req.path is the upstream portion
  const fallback = (req.path || '/').split('?')[0];
  console.log(`[extractUpstreamPath] No prefix match for '${prefix}', using req.path: '${fallback}'`);
  return fallback;
}

/**
 * Proxy requests to OpenSky Network API to avoid CORS issues in production.
 * Handles: /api/opensky/states/all?icao24=...
 */
exports.opensky = onRequest({ region: "us-central1", cors: true }, async (req, res) => {
  const params = new URLSearchParams(req.query);
  const url = `https://opensky-network.org/api/states/all?${params.toString()}`;
  console.log('[opensky] req.path:', req.path, '| req.originalUrl:', req.originalUrl, '| url:', url);

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
 * Handles: /api/adsblol/v2/icao/{icao24} and /api/adsblol/v2/reg/{reg}
 */
exports.adsbLol = onRequest({ region: "us-central1", cors: true }, async (req, res) => {
  const upstreamPath = extractUpstreamPath(req, '/api/adsblol');
  const url = `https://api.adsb.lol${upstreamPath}`;
  console.log('[adsbLol] req.path:', req.path, '| req.originalUrl:', req.originalUrl, '| upstream:', url);

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
 * Proxy requests to airplanes.live (additional ADS-B source).
 * Same readsb v2 API format as adsb.lol.
 */
exports.airplanesLive = onRequest({ region: "us-central1", cors: true }, async (req, res) => {
  const upstreamPath = extractUpstreamPath(req, '/api/airplaneslive');
  const url = `https://api.airplanes.live${upstreamPath}`;
  console.log('[airplanesLive] req.path:', req.path, '| req.originalUrl:', req.originalUrl, '| upstream:', url);

  try {
    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "FlightWatch/1.0",
      },
    });

    if (!response.ok) {
      const body = await response.text();
      console.warn('[airplanesLive] upstream returned', response.status, body.substring(0, 200));
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
