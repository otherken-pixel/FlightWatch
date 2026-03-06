# FlightWatch

Real-time general aviation tracking app for the families and loved ones of private pilots. Peace of mind in your pocket.

## Features

- **Live Map Tracking** — Full-screen interactive map with animated plane icons, heading rotation, and 30-minute flight trails
- **Flight Dashboard** — Position, heading, speed, altitude, squawk code, vertical rate, weather, and wind data
- **Multi-Aircraft Tracking** — Save multiple planes by tail number with custom nicknames, emojis, and color tags
- **Smart Notifications** — Takeoff, landing, and lost-signal alerts via browser notifications with audio cues
- **Flight History** — Automatic logging of detected flights
- **Dark/Light Map** — Automatic dark mode with aviation-inspired design

## Tech Stack

- **React 18** + **Vite** — Fast development and builds
- **Leaflet.js** + **React Leaflet** — Interactive mapping
- **Zustand** — Lightweight state management
- **Tailwind CSS v4** — Utility-first styling
- **OpenSky Network API** — Free ADS-B flight data
- **OpenWeatherMap API** — Weather at aircraft position
- **Nominatim** — Reverse geocoding (lat/lon to city name)
- **Web Push API** — Browser-native notifications

## Quick Start

```bash
npm install
npm run dev
```

Then open http://localhost:5173

## Setup

1. Go to **Settings** and add an aircraft by tail number and ICAO24 hex code
2. Find ICAO24 codes at [OpenSky Aircraft Database](https://opensky-network.org/aircraft-database)
3. Optionally add an [OpenWeatherMap API key](https://openweathermap.org/api) for weather data
4. Return to the map and watch your aircraft in real time

## API Keys

| API | Purpose | Required |
|-----|---------|----------|
| OpenSky Network | Live aircraft positions | No (free, no key needed) |
| OpenWeatherMap | Weather at aircraft position | Optional (free tier) |
| ADS-B Exchange | Enhanced tracking | Optional (paid) |

All API keys are stored locally in your browser and never sent to any third-party server.
