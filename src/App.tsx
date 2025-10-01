import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { AppState, WalkSession, MoodEntry, Location, Mood } from './types';
import { StorageService } from './services/storage';
import { GPSService } from './services/gps';
import { AudioService } from './services/audio';
import { InsightsService } from './services/insights';
import MapView from './components/MapView';
import SessionHistory from './components/SessionHistory';
import RouteSuggestions from './components/RouteSuggestions';
import ExportData from './components/ExportData';
import Navigation from './components/Navigation';
import './App.css';

function App() {
  const [appState, setAppState] = useState<AppState>({
    currentSession: null,
    isTracking: false,
    currentLocation: null,
    sessions: [],
    calmZones: [],
    stressZones: [],
    isRecordingAudio: false,
    currentNoiseLevel: 0
  });

  const [gpsService, setGpsService] = useState<GPSService | null>(null);
  const [audioService, setAudioService] = useState<AudioService | null>(null);

  // Load data on app start
  useEffect(() => {
    const sessions = StorageService.loadSessions();
    const calmZones = StorageService.loadCalmZones();
    const stressZones = StorageService.loadStressZones();
    const savedState = StorageService.loadAppState();

    setAppState(prev => ({
      ...prev,
      sessions,
      calmZones,
      stressZones,
      ...savedState
    }));
  }, []);

  // Initialize GPS and Audio services
  useEffect(() => {
    const gps = new GPSService(
      (location: Location) => {
        setAppState(prev => ({ ...prev, currentLocation: location }));
      },
      (error) => {
        console.error('GPS Error:', error);
        alert('GPS access is required for this app to work properly.');
      }
    );

    const audio = new AudioService((noiseLevel: number) => {
      setAppState(prev => ({ ...prev, currentNoiseLevel: noiseLevel }));
    });

    setGpsService(gps);
    setAudioService(audio);

    return () => {
      gps.stopTracking();
      audio.stopRecording();
    };
  }, []);

  // Start a new walk session
  const startWalk = async () => {
    if (!gpsService || !audioService) return;

    const sessionId = uuidv4();
    const newSession: WalkSession = {
      id: sessionId,
      startTime: Date.now(),
      moodEntries: [],
      stressCount: 0,
      calmCount: 0,
      neutralCount: 0
    };

    const gpsStarted = await gpsService.startTracking();
    const audioStarted = await audioService.startRecording();

    if (gpsStarted && audioStarted) {
      setAppState(prev => ({
        ...prev,
        currentSession: newSession,
        isTracking: true,
        isRecordingAudio: true
      }));
    } else {
      alert('Failed to start tracking. Please check permissions.');
    }
  };

  // End the current walk session
  const endWalk = () => {
    if (!gpsService || !audioService || !appState.currentSession) return;

    gpsService.stopTracking();
    audioService.stopRecording();

    const completedSession = {
      ...appState.currentSession,
      endTime: Date.now()
    };

    // Generate insights
    const summary = InsightsService.generateSessionInsights(completedSession);
    completedSession.summary = summary;

    // Update zones based on this session
    const { calmZones, stressZones } = InsightsService.updateZonesFromSession(
      completedSession,
      appState.calmZones,
      appState.stressZones
    );

    // Save everything
    StorageService.addSession(completedSession);
    StorageService.saveCalmZones(calmZones);
    StorageService.saveStressZones(stressZones);

    setAppState(prev => ({
      ...prev,
      currentSession: null,
      isTracking: false,
      isRecordingAudio: false,
      sessions: [...prev.sessions, completedSession],
      calmZones,
      stressZones
    }));
  };

  // Log a mood entry
  const logMood = async (mood: Mood) => {
    if (!appState.currentSession || !appState.currentLocation) return;

    const noiseLevel = appState.currentNoiseLevel;
    
    const moodEntry: MoodEntry = {
      id: uuidv4(),
      location: appState.currentLocation,
      mood,
      noiseLevel,
      timestamp: Date.now()
    };

    const updatedSession = {
      ...appState.currentSession,
      moodEntries: [...appState.currentSession.moodEntries, moodEntry],
      stressCount: appState.currentSession.stressCount + (mood === 'stressed' ? 1 : 0),
      calmCount: appState.currentSession.calmCount + (mood === 'calm' ? 1 : 0),
      neutralCount: appState.currentSession.neutralCount + (mood === 'neutral' ? 1 : 0)
    };

    setAppState(prev => ({
      ...prev,
      currentSession: updatedSession
    }));
  };

  return (
    <Router>
      <div className="App">
        <Navigation />
        
        <Routes>
          <Route 
            path="/" 
            element={
              <MapView
                appState={appState}
                onStartWalk={startWalk}
                onEndWalk={endWalk}
                onLogMood={logMood}
              />
            } 
          />
          <Route 
            path="/history" 
            element={
              <SessionHistory 
                sessions={appState.sessions}
                calmZones={appState.calmZones}
                stressZones={appState.stressZones}
              />
            } 
          />
          <Route 
            path="/routes" 
            element={
              <RouteSuggestions
                calmZones={appState.calmZones}
                stressZones={appState.stressZones}
                currentLocation={appState.currentLocation}
              />
            } 
          />
          <Route 
            path="/export" 
            element={<ExportData />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
