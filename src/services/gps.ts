import { Location } from '../types';

export class GPSService {
  private watchId: number | null = null;
  private onLocationUpdate: ((location: Location) => void) | null = null;
  private onError: ((error: GeolocationPositionError) => void) | null = null;

  constructor(
    onLocationUpdate: (location: Location) => void,
    onError: (error: GeolocationPositionError) => void
  ) {
    this.onLocationUpdate = onLocationUpdate;
    this.onError = onError;
  }

  async startTracking(): Promise<boolean> {
    if (!navigator.geolocation) {
      this.onError?.(new GeolocationPositionError());
      return false;
    }

    try {
      // First, get current position
      const position = await this.getCurrentPosition();
      if (position) {
        this.onLocationUpdate?.(this.positionToLocation(position));
      }

      // Then start watching for updates
      this.watchId = navigator.geolocation.watchPosition(
        (position) => {
          this.onLocationUpdate?.(this.positionToLocation(position));
        },
        (error) => {
          console.error('GPS error:', error);
          this.onError?.(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000
        }
      );

      return true;
    } catch (error) {
      console.error('Failed to start GPS tracking:', error);
      this.onError?.(error as GeolocationPositionError);
      return false;
    }
  }

  stopTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  private getCurrentPosition(): Promise<GeolocationPosition | null> {
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position),
        (error) => {
          console.error('Failed to get current position:', error);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  }

  private positionToLocation(position: GeolocationPosition): Location {
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp
    };
  }

  // Calculate distance between two points in meters
  static calculateDistance(loc1: Location, loc2: Location): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (loc1.latitude * Math.PI) / 180;
    const φ2 = (loc2.latitude * Math.PI) / 180;
    const Δφ = ((loc2.latitude - loc1.latitude) * Math.PI) / 180;
    const Δλ = ((loc2.longitude - loc1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  // Check if location is within a certain radius of another location
  static isWithinRadius(
    center: Location,
    point: Location,
    radiusMeters: number
  ): boolean {
    return this.calculateDistance(center, point) <= radiusMeters;
  }
}
