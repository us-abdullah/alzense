import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation, Clock, Shield, AlertTriangle } from 'lucide-react';
import { CalmZone, StressZone, Location } from '../types';
import { InsightsService } from '../services/insights';
import { GPSService } from '../services/gps';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface RouteSuggestionsProps {
  calmZones: CalmZone[];
  stressZones: StressZone[];
  currentLocation: Location | null;
}

// Component to center map on route
const MapCenter: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, 15);
  }, [center, map]);
  
  return null;
};

// Component to handle map clicks
const MapClickHandler: React.FC<{ onMapClick: (lat: number, lng: number) => void }> = ({ onMapClick }) => {
  const map = useMap();
  
  useEffect(() => {
    const handleClick = (e: any) => {
      const { lat, lng } = e.latlng;
      onMapClick(lat, lng);
    };
    
    map.on('click', handleClick);
    
    return () => {
      map.off('click', handleClick);
    };
  }, [map, onMapClick]);
  
  return null;
};

const RouteSuggestions: React.FC<RouteSuggestionsProps> = ({ 
  calmZones, 
  stressZones, 
  currentLocation 
}) => {
  const [startLocation, setStartLocation] = useState<Location | null>(currentLocation);
  const [endLocation, setEndLocation] = useState<Location | null>(null);
  const [suggestedRoute, setSuggestedRoute] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Update start location when current location changes
  useEffect(() => {
    if (currentLocation) {
      setStartLocation(currentLocation);
    }
  }, [currentLocation]);

  const handleMapClick = (lat: number, lng: number) => {
    setEndLocation({
      latitude: lat,
      longitude: lng,
      timestamp: Date.now()
    });
  };

  const generateRoute = async () => {
    if (!startLocation || !endLocation) return;

    setIsGenerating(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const route = InsightsService.generateRouteSuggestion(
      startLocation,
      endLocation,
      calmZones,
      stressZones
    );
    
    setSuggestedRoute(route);
    setIsGenerating(false);
  };

  const getMapCenter = (): [number, number] => {
    if (suggestedRoute) {
      const lat = (suggestedRoute.start.latitude + suggestedRoute.end.latitude) / 2;
      const lng = (suggestedRoute.start.longitude + suggestedRoute.end.longitude) / 2;
      return [lat, lng];
    }
    
    if (startLocation) {
      return [startLocation.latitude, startLocation.longitude];
    }
    
    return [40.7128, -74.0060]; // Default to NYC
  };

  const getCalmScoreColor = (score: number): string => {
    if (score >= 0.8) return '#4ade80';
    if (score >= 0.6) return '#84cc16';
    if (score >= 0.4) return '#fbbf24';
    return '#ef4444';
  };

  const getCalmScoreDescription = (score: number): string => {
    if (score >= 0.8) return 'Very Calm';
    if (score >= 0.6) return 'Calm';
    if (score >= 0.4) return 'Moderate';
    return 'Stressful';
  };

  return (
    <div className="page-content">
      <h1 className="page-title">Route Suggestions</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', height: 'calc(100vh - 200px)' }}>
        {/* Controls Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card">
            <h2 className="card-title">Route Planning</h2>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                Start Location
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
                <MapPin size={16} />
                <span>
                  {startLocation 
                    ? `${startLocation.latitude.toFixed(4)}, ${startLocation.longitude.toFixed(4)}`
                    : 'Current location'
                  }
                </span>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                End Location
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
                <MapPin size={16} />
                <span>
                  {endLocation 
                    ? `${endLocation.latitude.toFixed(4)}, ${endLocation.longitude.toFixed(4)}`
                    : 'Click on map to set destination'
                  }
                </span>
              </div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem', fontStyle: 'italic' }}>
                💡 Click anywhere on the map to set your destination
              </p>
            </div>

            <button
              className="btn btn-primary"
              onClick={generateRoute}
              disabled={!startLocation || !endLocation || isGenerating}
              style={{ width: '100%' }}
            >
              {isGenerating ? 'Generating...' : 'Generate Calm Route'}
            </button>
          </div>

          {/* Route Details */}
          {suggestedRoute && (
            <div className="card">
              <h3 className="card-title">Route Details</h3>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: getCalmScoreColor(suggestedRoute.calmScore)
                  }}
                ></div>
                <span style={{ fontWeight: '600' }}>
                  Calm Score: {getCalmScoreDescription(suggestedRoute.calmScore)} ({(suggestedRoute.calmScore * 100).toFixed(0)}%)
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Clock size={16} />
                <span>Duration: ~{suggestedRoute.estimatedDuration} minutes</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Navigation size={16} />
                <span>Distance: {GPSService.calculateDistance(suggestedRoute.start, suggestedRoute.end).toFixed(0)}m</span>
              </div>

              {suggestedRoute.includesCalmZones.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Shield size={16} style={{ color: '#4ade80' }} />
                  <span>Includes {suggestedRoute.includesCalmZones.length} calm zone(s)</span>
                </div>
              )}

              {suggestedRoute.avoidsStressZones.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <AlertTriangle size={16} style={{ color: '#ef4444' }} />
                  <span>Avoids {suggestedRoute.avoidsStressZones.length} stress zone(s)</span>
                </div>
              )}
            </div>
          )}

          {/* Zone Information */}
          <div className="card">
            <h3 className="card-title">Zone Information</h3>
            
            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ color: '#4ade80', marginBottom: '0.5rem' }}>Calm Zones ({calmZones.length})</h4>
              {calmZones.length === 0 ? (
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>No calm zones identified yet</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {calmZones.slice(0, 3).map((zone) => (
                    <div key={zone.id} style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      • Calm Score: {(zone.calmScore * 100).toFixed(0)}% ({zone.visitCount} visits)
                    </div>
                  ))}
                  {calmZones.length > 3 && (
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      • ... and {calmZones.length - 3} more
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <h4 style={{ color: '#ef4444', marginBottom: '0.5rem' }}>Stress Zones ({stressZones.length})</h4>
              {stressZones.length === 0 ? (
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>No stress zones identified yet</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {stressZones.slice(0, 3).map((zone) => (
                    <div key={zone.id} style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      • Stress Score: {(zone.stressScore * 100).toFixed(0)}% ({zone.stressCount} instances)
                    </div>
                  ))}
                  {stressZones.length > 3 && (
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      • ... and {stressZones.length - 3} more
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Map */}
        <div style={{ height: '100%', borderRadius: '8px', overflow: 'hidden' }}>
          <MapContainer
            center={getMapCenter()}
            zoom={15}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            
            <MapCenter center={getMapCenter()} />
            <MapClickHandler onMapClick={handleMapClick} />
            
            {/* Start location marker */}
            {startLocation && (
              <Marker
                position={[startLocation.latitude, startLocation.longitude]}
                icon={L.divIcon({
                  className: 'start-marker',
                  html: `<div style="
                    background-color: #3b82f6;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    border: 3px solid white;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                  "></div>`,
                  iconSize: [20, 20],
                  iconAnchor: [10, 10]
                })}
              >
                <Popup>Start Location</Popup>
              </Marker>
            )}

            {/* End location marker */}
            {endLocation && (
              <Marker
                position={[endLocation.latitude, endLocation.longitude]}
                icon={L.divIcon({
                  className: 'end-marker',
                  html: `<div style="
                    background-color: #ef4444;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    border: 3px solid white;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                  "></div>`,
                  iconSize: [20, 20],
                  iconAnchor: [10, 10]
                })}
              >
                <Popup>End Location</Popup>
              </Marker>
            )}

            {/* Suggested route */}
            {suggestedRoute && (
              <Polyline
                positions={[
                  [suggestedRoute.start.latitude, suggestedRoute.start.longitude],
                  ...suggestedRoute.waypoints.map((wp: Location) => [wp.latitude, wp.longitude]),
                  [suggestedRoute.end.latitude, suggestedRoute.end.longitude]
                ]}
                pathOptions={{
                  color: getCalmScoreColor(suggestedRoute.calmScore),
                  weight: 6,
                  opacity: 0.8
                }}
              />
            )}

            {/* Calm zones */}
            {calmZones.map((zone) => (
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
                    Score: {(zone.calmScore * 100).toFixed(0)}%
                    <br />
                    Visits: {zone.visitCount}
                  </div>
                </Popup>
              </Circle>
            ))}

            {/* Stress zones */}
            {stressZones.map((zone) => (
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
                    Score: {(zone.stressScore * 100).toFixed(0)}%
                    <br />
                    Count: {zone.stressCount}
                  </div>
                </Popup>
              </Circle>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default RouteSuggestions;
