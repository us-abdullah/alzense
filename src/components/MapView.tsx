import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { AppState, Mood, Location } from '../types';
// import { GPSService } from '../services/gps';
// import { AudioService } from '../services/audio';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapViewProps {
  appState: AppState;
  onStartWalk: () => void;
  onEndWalk: () => void;
  onLogMood: (mood: Mood) => void;
}

// Component to center map on current location
const MapCenter: React.FC<{ location: Location | null }> = ({ location }) => {
  const map = useMap();
  
  useEffect(() => {
    if (location) {
      map.setView([location.latitude, location.longitude], 16);
    }
  }, [location, map]);
  
  return null;
};

const MapView: React.FC<MapViewProps> = ({ appState, onStartWalk, onEndWalk, onLogMood }) => {
  const [mapCenter, setMapCenter] = useState<[number, number]>([40.7128, -74.0060]); // Default to NYC
  const mapRef = useRef<L.Map>(null);

  // Update map center when location changes
  useEffect(() => {
    if (appState.currentLocation) {
      setMapCenter([appState.currentLocation.latitude, appState.currentLocation.longitude]);
    }
  }, [appState.currentLocation]);

  // Get mood color for markers
  const getMoodColor = (mood: Mood): string => {
    switch (mood) {
      case 'calm': return '#4ade80';
      case 'neutral': return '#fbbf24';
      case 'stressed': return '#ef4444';
      default: return '#6b7280';
    }
  };

  // Create custom markers
  const createCustomIcon = (mood: Mood) => {
    const color = getMoodColor(mood);
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="
        background-color: ${color};
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
  };

  // Get noise level description
  const getNoiseDescription = (noiseLevel: number): string => {
    if (noiseLevel < 30) return 'Very Quiet';
    if (noiseLevel < 40) return 'Quiet';
    if (noiseLevel < 50) return 'Moderate';
    if (noiseLevel < 60) return 'Loud';
    if (noiseLevel < 70) return 'Very Loud';
    return 'Extremely Loud';
  };

  const getNoiseClass = (noiseLevel: number): string => {
    if (noiseLevel < 40) return 'quiet';
    if (noiseLevel < 60) return 'moderate';
    return 'loud';
  };

  return (
    <div className="map-view">
      <MapContainer
        center={mapCenter}
        zoom={16}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        <MapCenter location={appState.currentLocation} />
        
        {/* Current location marker */}
        {appState.currentLocation && (
          <Marker
            position={[appState.currentLocation.latitude, appState.currentLocation.longitude]}
            icon={L.divIcon({
              className: 'current-location-marker',
              html: `<div style="
                background-color: #3b82f6;
                width: 16px;
                height: 16px;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                animation: pulse 2s infinite;
              "></div>`,
              iconSize: [16, 16],
              iconAnchor: [8, 8]
            })}
          >
            <Popup>
              <div>
                <strong>Current Location</strong>
                <br />
                Accuracy: {appState.currentLocation.accuracy?.toFixed(0)}m
              </div>
            </Popup>
          </Marker>
        )}

        {/* Current session mood entries */}
        {appState.currentSession?.moodEntries.map((entry) => (
          <Marker
            key={entry.id}
            position={[entry.location.latitude, entry.location.longitude]}
            icon={createCustomIcon(entry.mood)}
          >
            <Popup>
              <div>
                <strong>Mood: {entry.mood}</strong>
                <br />
                Noise: {getNoiseDescription(entry.noiseLevel)} ({entry.noiseLevel.toFixed(0)}dB)
                <br />
                Time: {new Date(entry.timestamp).toLocaleTimeString()}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Calm zones */}
        {appState.calmZones.map((zone) => (
          <Circle
            key={zone.id}
            center={[zone.center.latitude, zone.center.longitude]}
            radius={zone.radius}
            pathOptions={{
              color: '#4ade80',
              fillColor: '#4ade80',
              fillOpacity: 0.2,
              weight: 2
            }}
          >
            <Popup>
              <div>
                <strong>Calm Zone</strong>
                <br />
                Calm Score: {(zone.calmScore * 100).toFixed(0)}%
                <br />
                Visits: {zone.visitCount}
              </div>
            </Popup>
          </Circle>
        ))}

        {/* Stress zones */}
        {appState.stressZones.map((zone) => (
          <Circle
            key={zone.id}
            center={[zone.center.latitude, zone.center.longitude]}
            radius={zone.radius}
            pathOptions={{
              color: '#ef4444',
              fillColor: '#ef4444',
              fillOpacity: 0.2,
              weight: 2
            }}
          >
            <Popup>
              <div>
                <strong>Stress Zone</strong>
                <br />
                Stress Score: {(zone.stressScore * 100).toFixed(0)}%
                <br />
                Stress Count: {zone.stressCount}
              </div>
            </Popup>
          </Circle>
        ))}
      </MapContainer>

      {/* Status indicators */}
      <div className={`status-indicator ${appState.isTracking ? 'tracking' : 'not-tracking'}`}>
        <div className={`status-dot ${appState.isTracking ? 'tracking' : 'not-tracking'}`}></div>
        {appState.isTracking ? 'Tracking Walk' : 'Not Tracking'}
      </div>

      {appState.isRecordingAudio && (
        <div className="noise-indicator">
          <div className={`noise-level ${getNoiseClass(appState.currentNoiseLevel)}`}>
            {appState.currentNoiseLevel.toFixed(0)}dB
          </div>
          <div>{getNoiseDescription(appState.currentNoiseLevel)}</div>
        </div>
      )}

      {/* Session controls */}
      <div className="session-controls">
        <div className={`session-status ${appState.isTracking ? 'tracking' : 'not-tracking'}`}>
          {appState.isTracking ? 'Walk in Progress' : 'Ready to Start Walk'}
        </div>

        {appState.isTracking ? (
          <>
            <div className="mood-buttons">
              <button
                className="mood-button calm"
                onClick={() => onLogMood('calm')}
                disabled={!appState.currentLocation}
              >
                🙂 Calm
              </button>
              <button
                className="mood-button neutral"
                onClick={() => onLogMood('neutral')}
                disabled={!appState.currentLocation}
              >
                😐 Neutral
              </button>
              <button
                className="mood-button stressed"
                onClick={() => onLogMood('stressed')}
                disabled={!appState.currentLocation}
              >
                😟 Stressed
              </button>
            </div>
            <div className="session-buttons">
              <button className="session-button danger" onClick={onEndWalk}>
                End Walk
              </button>
            </div>
          </>
        ) : (
          <div className="session-buttons">
            <button className="session-button primary" onClick={onStartWalk}>
              Start Walk
            </button>
          </div>
        )}

        {appState.currentSession && (
          <div className="session-stats">
            <div>Calm: {appState.currentSession.calmCount}</div>
            <div>Neutral: {appState.currentSession.neutralCount}</div>
            <div>Stressed: {appState.currentSession.stressCount}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapView;
