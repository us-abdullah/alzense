export type Mood = 'calm' | 'neutral' | 'stressed';

export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
}

export interface MoodEntry {
  id: string;
  location: Location;
  mood: Mood;
  noiseLevel: number; // in decibels
  timestamp: number;
  notes?: string;
}

export interface WalkSession {
  id: string;
  startTime: number;
  endTime?: number;
  moodEntries: MoodEntry[];
  totalDistance?: number; // in meters
  averageNoise?: number;
  stressCount: number;
  calmCount: number;
  neutralCount: number;
  summary?: string;
}

export interface CalmZone {
  id: string;
  center: Location;
  radius: number; // in meters
  calmScore: number; // 0-1, higher is calmer
  visitCount: number;
  lastVisited: number;
}

export interface StressZone {
  id: string;
  center: Location;
  radius: number; // in meters
  stressScore: number; // 0-1, higher is more stressful
  stressCount: number;
  lastStressed: number;
}

export interface RouteSuggestion {
  id: string;
  start: Location;
  end: Location;
  waypoints: Location[];
  calmScore: number;
  estimatedDuration: number; // in minutes
  avoidsStressZones: string[];
  includesCalmZones: string[];
}

export interface AppState {
  currentSession: WalkSession | null;
  isTracking: boolean;
  currentLocation: Location | null;
  sessions: WalkSession[];
  calmZones: CalmZone[];
  stressZones: StressZone[];
  isRecordingAudio: boolean;
  currentNoiseLevel: number;
}
