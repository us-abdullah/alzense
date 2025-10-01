import { WalkSession, CalmZone, StressZone, AppState } from '../types';

const STORAGE_KEYS = {
  SESSIONS: 'alzense_sessions',
  CALM_ZONES: 'alzense_calm_zones',
  STRESS_ZONES: 'alzense_stress_zones',
  APP_STATE: 'alzense_app_state'
};

export class StorageService {
  // Sessions
  static saveSessions(sessions: WalkSession[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    } catch (error) {
      console.error('Failed to save sessions:', error);
    }
  }

  static loadSessions(): WalkSession[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load sessions:', error);
      return [];
    }
  }

  static addSession(session: WalkSession): void {
    const sessions = this.loadSessions();
    sessions.push(session);
    this.saveSessions(sessions);
  }

  static updateSession(session: WalkSession): void {
    const sessions = this.loadSessions();
    const index = sessions.findIndex(s => s.id === session.id);
    if (index !== -1) {
      sessions[index] = session;
      this.saveSessions(sessions);
    }
  }

  // Calm Zones
  static saveCalmZones(zones: CalmZone[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CALM_ZONES, JSON.stringify(zones));
    } catch (error) {
      console.error('Failed to save calm zones:', error);
    }
  }

  static loadCalmZones(): CalmZone[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CALM_ZONES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load calm zones:', error);
      return [];
    }
  }

  // Stress Zones
  static saveStressZones(zones: StressZone[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.STRESS_ZONES, JSON.stringify(zones));
    } catch (error) {
      console.error('Failed to save stress zones:', error);
    }
  }

  static loadStressZones(): StressZone[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STRESS_ZONES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load stress zones:', error);
      return [];
    }
  }

  // App State
  static saveAppState(state: Partial<AppState>): void {
    try {
      const currentState = this.loadAppState();
      const newState = { ...currentState, ...state };
      localStorage.setItem(STORAGE_KEYS.APP_STATE, JSON.stringify(newState));
    } catch (error) {
      console.error('Failed to save app state:', error);
    }
  }

  static loadAppState(): Partial<AppState> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.APP_STATE);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Failed to load app state:', error);
      return {};
    }
  }

  // Export data
  static exportData(): string {
    const data = {
      sessions: this.loadSessions(),
      calmZones: this.loadCalmZones(),
      stressZones: this.loadStressZones(),
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };
    return JSON.stringify(data, null, 2);
  }

  // Clear all data
  static clearAllData(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }
}
