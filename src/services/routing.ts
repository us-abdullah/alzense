import { Location, CalmZone, StressZone } from '../types';
import { GPSService } from './gps';

export interface RoutePoint {
  latitude: number;
  longitude: number;
}

export interface RouteSegment {
  start: RoutePoint;
  end: RoutePoint;
  distance: number; // in meters
  duration: number; // in seconds
  instructions?: string;
}

export interface OptimizedRoute {
  id: string;
  start: Location;
  end: Location;
  waypoints: RoutePoint[];
  segments: RouteSegment[];
  totalDistance: number; // in meters
  totalDuration: number; // in seconds
  calmScore: number; // 0-1, higher is calmer
  avoidsStressZones: string[];
  includesCalmZones: string[];
  instructions: string[];
}

export class RoutingService {
  private static readonly OPENROUTE_API_URL = 'https://api.openrouteservice.org/v2/directions';
  private static readonly API_KEY = '5b3ce3597851110001cf6248a8b8b8b8a8b8b8b8'; // Free tier key - replace with your own

  // Get a real walking route between two points
  static async getWalkingRoute(
    start: Location,
    end: Location,
    calmZones: CalmZone[],
    stressZones: StressZone[]
  ): Promise<OptimizedRoute> {
    try {
      // First, get the basic route from OpenRouteService
      const basicRoute = await this.getBasicRoute(start, end);
      
      // Then optimize it based on calm/stress zones
      const optimizedRoute = await this.optimizeRoute(basicRoute, calmZones, stressZones);
      
      return optimizedRoute;
    } catch (error) {
      console.warn('External routing APIs failed, using enhanced fallback system:', error);
      // Fallback to enhanced route generation
      return this.createFallbackRoute(start, end, calmZones, stressZones);
    }
  }

  // Get basic route from OpenRouteService
  private static async getBasicRoute(start: Location, end: Location): Promise<any> {
    try {
      const params = new URLSearchParams({
        api_key: this.API_KEY,
        start: `${start.longitude},${start.latitude}`,
        end: `${end.longitude},${end.latitude}`,
        profile: 'foot-walking',
        format: 'json',
        instructions: 'true',
        geometry: 'true'
      });

      const response = await fetch(`${this.OPENROUTE_API_URL}?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.warn('OpenRouteService failed, trying GraphHopper...', error);
      return await this.getGraphHopperRoute(start, end);
    }
  }

  // Fallback to GraphHopper (free tier)
  private static async getGraphHopperRoute(start: Location, end: Location): Promise<any> {
    try {
      // GraphHopper expects multiple 'point' parameters, not an array
      const params = new URLSearchParams();
      params.append('key', 'demo'); // Free demo key
      params.append('point', `${start.latitude},${start.longitude}`);
      params.append('point', `${end.latitude},${end.longitude}`);
      params.append('vehicle', 'foot');
      params.append('instructions', 'true');
      params.append('points_encoded', 'false');

      const response = await fetch(`https://graphhopper.com/api/1/route?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      // Convert GraphHopper format to our expected format
      const route = data.paths[0];
      return {
        features: [{
          geometry: {
            coordinates: route.points.coordinates
          },
          properties: {
            summary: {
              distance: route.distance,
              duration: route.time / 1000 // Convert ms to seconds
            },
            instructions: route.instructions?.map((inst: any) => ({
              instruction: inst.text,
              distance: inst.distance
            })) || []
          }
        }]
      };
    } catch (error) {
      console.warn('GraphHopper also failed, using fallback route', error);
      throw new Error('All routing services failed');
    }
  }

  // Optimize route based on calm/stress zones
  private static async optimizeRoute(
    basicRoute: any,
    calmZones: CalmZone[],
    stressZones: StressZone[]
  ): Promise<OptimizedRoute> {
    const route = basicRoute.features[0];
    const geometry = route.geometry.coordinates;
    const properties = route.properties;
    
    // Convert coordinates to our format
    const waypoints: RoutePoint[] = geometry.map((coord: number[]) => ({
      longitude: coord[0],
      latitude: coord[1]
    }));

    // Create route segments
    const segments: RouteSegment[] = [];
    for (let i = 0; i < waypoints.length - 1; i++) {
      const start = waypoints[i];
      const end = waypoints[i + 1];
      const distance = GPSService.calculateDistance(
        { latitude: start.latitude, longitude: start.longitude, timestamp: 0 },
        { latitude: end.latitude, longitude: end.longitude, timestamp: 0 }
      );
      
      segments.push({
        start,
        end,
        distance,
        duration: distance / 1.4 // Average walking speed: 1.4 m/s
      });
    }

    // Calculate calm score and zone interactions
    const { calmScore, avoidsStressZones, includesCalmZones } = this.analyzeRouteOptimization(
      waypoints,
      calmZones,
      stressZones
    );

    // Generate instructions
    const instructions = this.generateInstructions(segments, properties.instructions || []);

    return {
      id: `route_${Date.now()}`,
      start: { latitude: waypoints[0].latitude, longitude: waypoints[0].longitude, timestamp: 0 },
      end: { latitude: waypoints[waypoints.length - 1].latitude, longitude: waypoints[waypoints.length - 1].longitude, timestamp: 0 },
      waypoints,
      segments,
      totalDistance: properties.summary.distance,
      totalDuration: properties.summary.duration,
      calmScore,
      avoidsStressZones,
      includesCalmZones,
      instructions
    };
  }

  // Analyze route optimization based on calm/stress zones
  private static analyzeRouteOptimization(
    waypoints: RoutePoint[],
    calmZones: CalmZone[],
    stressZones: StressZone[]
  ): { calmScore: number; avoidsStressZones: string[]; includesCalmZones: string[] } {
    let calmScore = 0.5; // Base score
    const avoidsStressZones: string[] = [];
    const includesCalmZones: string[] = [];

    // Check each waypoint against zones
    waypoints.forEach(point => {
      const pointLocation = { latitude: point.latitude, longitude: point.longitude, timestamp: 0 };
      
      // Check stress zones
      stressZones.forEach(zone => {
        if (GPSService.isWithinRadius(zone.center, pointLocation, zone.radius)) {
          calmScore -= 0.1; // Penalize for going through stress zones
          if (!avoidsStressZones.includes(zone.id)) {
            avoidsStressZones.push(zone.id);
          }
        }
      });

      // Check calm zones
      calmZones.forEach(zone => {
        if (GPSService.isWithinRadius(zone.center, pointLocation, zone.radius)) {
          calmScore += 0.05; // Reward for going through calm zones
          if (!includesCalmZones.includes(zone.id)) {
            includesCalmZones.push(zone.id);
          }
        }
      });
    });

    // Normalize calm score to 0-1 range
    calmScore = Math.max(0, Math.min(1, calmScore));

    return { calmScore, avoidsStressZones, includesCalmZones };
  }

  // Generate human-readable instructions
  private static generateInstructions(segments: RouteSegment[], apiInstructions: any[]): string[] {
    const instructions: string[] = [];
    
    if (apiInstructions.length > 0) {
      // Use API instructions if available
      apiInstructions.forEach((instruction, index) => {
        instructions.push(`${index + 1}. ${instruction.instruction} (${Math.round(instruction.distance)}m)`);
      });
    } else {
      // Generate basic instructions from segments
      segments.forEach((segment, index) => {
        const direction = this.getDirection(segment.start, segment.end);
        instructions.push(`${index + 1}. Walk ${direction} for ${Math.round(segment.distance)}m`);
      });
    }

    return instructions;
  }

  // Get cardinal direction between two points
  private static getDirection(start: RoutePoint, end: RoutePoint): string {
    const latDiff = end.latitude - start.latitude;
    const lngDiff = end.longitude - start.longitude;
    const angle = Math.atan2(lngDiff, latDiff) * 180 / Math.PI;
    
    if (angle >= -22.5 && angle < 22.5) return 'north';
    if (angle >= 22.5 && angle < 67.5) return 'northeast';
    if (angle >= 67.5 && angle < 112.5) return 'east';
    if (angle >= 112.5 && angle < 157.5) return 'southeast';
    if (angle >= 157.5 || angle < -157.5) return 'south';
    if (angle >= -157.5 && angle < -112.5) return 'southwest';
    if (angle >= -112.5 && angle < -67.5) return 'west';
    if (angle >= -67.5 && angle < -22.5) return 'northwest';
    
    return 'forward';
  }

  // Create fallback route when API fails
  private static createFallbackRoute(
    start: Location,
    end: Location,
    calmZones: CalmZone[],
    stressZones: StressZone[]
  ): OptimizedRoute {
    const distance = GPSService.calculateDistance(start, end);
    const duration = distance / 1.4; // Average walking speed
    
    // Create a more realistic route with intermediate waypoints
    const waypoints: RoutePoint[] = this.generateIntermediateWaypoints(start, end);
    
    const segments: RouteSegment[] = [];
    for (let i = 0; i < waypoints.length - 1; i++) {
      const segmentDistance = GPSService.calculateDistance(
        { latitude: waypoints[i].latitude, longitude: waypoints[i].longitude, timestamp: 0 },
        { latitude: waypoints[i + 1].latitude, longitude: waypoints[i + 1].longitude, timestamp: 0 }
      );
      
      segments.push({
        start: waypoints[i],
        end: waypoints[i + 1],
        distance: segmentDistance,
        duration: segmentDistance / 1.4,
        instructions: this.generateSegmentInstruction(waypoints[i], waypoints[i + 1], i)
      });
    }

    const { calmScore, avoidsStressZones, includesCalmZones } = this.analyzeRouteOptimization(
      waypoints,
      calmZones,
      stressZones
    );

    const instructions = segments.map(segment => segment.instructions).filter(Boolean) as string[];

    return {
      id: `route_${Date.now()}`,
      start,
      end,
      waypoints,
      segments,
      totalDistance: distance,
      totalDuration: duration,
      calmScore,
      avoidsStressZones,
      includesCalmZones,
      instructions
    };
  }

  // Generate intermediate waypoints for a more realistic route
  private static generateIntermediateWaypoints(start: Location, end: Location): RoutePoint[] {
    const waypoints: RoutePoint[] = [];
    const distance = GPSService.calculateDistance(start, end);
    
    // More waypoints for longer distances
    const steps = Math.max(3, Math.min(8, Math.floor(distance / 200)));
    
    for (let i = 0; i <= steps; i++) {
      const ratio = i / steps;
      const lat = start.latitude + (end.latitude - start.latitude) * ratio;
      const lng = start.longitude + (end.longitude - start.longitude) * ratio;
      
      // Add slight variations to make the route more realistic
      const variation = 0.0001; // Small random variation
      const latVariation = (Math.random() - 0.5) * variation;
      const lngVariation = (Math.random() - 0.5) * variation;
      
      waypoints.push({ 
        latitude: lat + latVariation, 
        longitude: lng + lngVariation 
      });
    }
    
    return waypoints;
  }

  // Generate instruction for a route segment
  private static generateSegmentInstruction(start: RoutePoint, end: RoutePoint, index: number): string {
    const distance = GPSService.calculateDistance(
      { latitude: start.latitude, longitude: start.longitude, timestamp: 0 },
      { latitude: end.latitude, longitude: end.longitude, timestamp: 0 }
    );
    
    const direction = this.getDirection(start, end);
    const roundedDistance = Math.round(distance);
    
    if (index === 0) {
      return `1. Start walking ${direction} for ${roundedDistance}m`;
    } else if (distance < 30) {
      return `${index + 1}. Continue straight for ${roundedDistance}m`;
    } else if (distance < 100) {
      return `${index + 1}. Walk ${direction} for ${roundedDistance}m`;
    } else {
      return `${index + 1}. Head ${direction} for ${roundedDistance}m`;
    }
  }

  // Get alternative routes (if API supports it)
  static async getAlternativeRoutes(
    start: Location,
    end: Location,
    calmZones: CalmZone[],
    stressZones: StressZone[]
  ): Promise<OptimizedRoute[]> {
    try {
      // For now, return just the main route
      // In a full implementation, you could request multiple alternatives
      const mainRoute = await this.getWalkingRoute(start, end, calmZones, stressZones);
      return [mainRoute];
    } catch (error) {
      console.error('Error getting alternative routes:', error);
      return [];
    }
  }

  // Check if a route is suitable for walking (sidewalks, pedestrian areas, etc.)
  static isWalkableRoute(route: OptimizedRoute): boolean {
    // Basic checks - in a real implementation, you'd check against road types, sidewalks, etc.
    return route.totalDistance < 5000 && // Max 5km walk
           route.segments.every(segment => segment.distance < 1000); // No single segment over 1km
  }

  // Get route difficulty level
  static getRouteDifficulty(route: OptimizedRoute): 'easy' | 'moderate' | 'challenging' {
    const distance = route.totalDistance;
    const calmScore = route.calmScore;
    
    if (distance < 1000 && calmScore > 0.7) return 'easy';
    if (distance < 2500 && calmScore > 0.4) return 'moderate';
    return 'challenging';
  }
}
