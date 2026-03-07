import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import useStore from '../store/useStore';
import { metersToFeet, msToKnots } from '../utils/api';

// Create a rotatable plane icon
function createPlaneIcon(heading = 0, color = '#007AFF') {
  return L.divIcon({
    className: 'plane-marker',
    html: `<div class="plane-icon" style="transform: rotate(${heading || 0}deg); color: ${color};">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
        <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
      </svg>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

// Component that auto-centers on selected aircraft
function MapController({ selectedPosition }) {
  const map = useMap();

  useEffect(() => {
    if (selectedPosition) {
      map.flyTo(selectedPosition, map.getZoom() < 8 ? 10 : map.getZoom(), {
        duration: 1.5,
      });
    }
  }, [selectedPosition?.[0], selectedPosition?.[1]]);

  return null;
}

export default function FlightMap() {
  const aircraft = useStore(s => s.aircraft);
  const liveData = useStore(s => s.liveData);
  const trails = useStore(s => s.trails);
  const selectedTail = useStore(s => s.selectedTail);
  const setSelectedTail = useStore(s => s.setSelectedTail);
  const settings = useStore(s => s.settings);

  const isDark = settings.mapStyle === 'dark';
  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const attribution = isDark
    ? '&copy; <a href="https://carto.com/">CARTO</a>'
    : '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>';

  // Find selected aircraft position for map centering
  const selectedPosition = useMemo(() => {
    if (!selectedTail) return null;
    const ac = aircraft.find(a => a.tailNumber === selectedTail);
    if (!ac?.icao24) return null;
    const data = liveData[ac.icao24];
    if (!data?.latitude || !data?.longitude) return null;
    return [data.latitude, data.longitude];
  }, [selectedTail, liveData, aircraft]);

  return (
    <MapContainer
      center={[39.8, -98.5]}
      zoom={5}
      zoomControl={true}
      className="h-full w-full"
    >
      <TileLayer url={tileUrl} attribution={attribution} />
      <MapController selectedPosition={selectedPosition} />

      {aircraft.map(ac => {
        const data = liveData[ac.icao24];
        if (!data?.latitude || !data?.longitude) return null;

        const position = [data.latitude, data.longitude];
        const trail = trails[ac.tailNumber] || [];
        const trailPositions = trail.map(p => [p.lat, p.lng]);

        return (
          <div key={ac.id}>
            {/* Flight trail */}
            {trailPositions.length > 1 && (
              <Polyline
                positions={trailPositions}
                pathOptions={{
                  color: ac.color,
                  weight: 2,
                  opacity: 0.6,
                  dashArray: '5, 10',
                }}
              />
            )}

            {/* Aircraft marker */}
            <Marker
              position={position}
              icon={createPlaneIcon(data.heading, ac.color)}
              eventHandlers={{
                click: () => setSelectedTail(ac.tailNumber),
              }}
            />
          </div>
        );
      })}
    </MapContainer>
  );
}
