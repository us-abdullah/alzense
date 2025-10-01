import { WalkSession, MoodEntry, CalmZone, StressZone, Location } from '../types';
import { GPSService } from './gps';

export class InsightsService {
  // Generate insights for a walk session
  static generateSessionInsights(session: WalkSession): string {
    const { moodEntries, stressCount, calmCount } = session;
    
    if (moodEntries.length === 0) {
      return "No mood data recorded for this walk.";
    }

    const totalEntries = moodEntries.length;
    const stressPercentage = Math.round((stressCount / totalEntries) * 100);
    const calmPercentage = Math.round((calmCount / totalEntries) * 100);
    
    let insights = [];
    
    // Overall mood summary
    if (stressCount > calmCount) {
      insights.push(`The walk had more stressful moments (${stressPercentage}%) than calm ones.`);
    } else if (calmCount > stressCount) {
      insights.push(`The walk was mostly peaceful (${calmPercentage}% calm moments).`);
    } else {
      insights.push(`The walk had a balanced mix of emotions.`);
    }

    // Noise correlation
    const highNoiseEntries = moodEntries.filter(entry => entry.noiseLevel > 60);
    const highNoiseStressed = highNoiseEntries.filter(entry => entry.mood === 'stressed');
    
    if (highNoiseStressed.length > 0) {
      const noiseStressCorrelation = Math.round((highNoiseStressed.length / highNoiseEntries.length) * 100);
      insights.push(`High noise levels (${highNoiseStressed.length} instances) often correlated with stress (${noiseStressCorrelation}% of the time).`);
    }

    // Time-based patterns
    const morningEntries = moodEntries.filter(entry => {
      const hour = new Date(entry.timestamp).getHours();
      return hour >= 6 && hour < 12;
    });
    const afternoonEntries = moodEntries.filter(entry => {
      const hour = new Date(entry.timestamp).getHours();
      return hour >= 12 && hour < 18;
    });
    const eveningEntries = moodEntries.filter(entry => {
      const hour = new Date(entry.timestamp).getHours();
      return hour >= 18 || hour < 6;
    });

    const timeInsights = this.analyzeTimePatterns(morningEntries, afternoonEntries, eveningEntries);
    if (timeInsights) {
      insights.push(timeInsights);
    }

    // Location clustering
    const locationInsights = this.analyzeLocationPatterns(moodEntries);
    if (locationInsights) {
      insights.push(locationInsights);
    }

    return insights.join(' ');
  }

  // Analyze time-based mood patterns
  private static analyzeTimePatterns(
    morning: MoodEntry[],
    afternoon: MoodEntry[],
    evening: MoodEntry[]
  ): string | null {
    const periods = [
      { name: 'morning', entries: morning },
      { name: 'afternoon', entries: afternoon },
      { name: 'evening', entries: evening }
    ];

    const periodStressRates = periods.map(period => ({
      name: period.name,
      stressRate: period.entries.length > 0 
        ? period.entries.filter(e => e.mood === 'stressed').length / period.entries.length
        : 0
    }));

    const bestPeriod = periodStressRates.reduce((best, current) => 
      current.stressRate < best.stressRate ? current : best
    );
    const worstPeriod = periodStressRates.reduce((worst, current) => 
      current.stressRate > worst.stressRate ? current : worst
    );

    if (bestPeriod.stressRate < 0.2 && worstPeriod.stressRate > 0.4) {
      return `Consider walking more in the ${bestPeriod.name} when stress levels are lower.`;
    }

    return null;
  }

  // Analyze location-based patterns
  private static analyzeLocationPatterns(entries: MoodEntry[]): string | null {
    if (entries.length < 3) return null;

    // Group nearby entries (within 50 meters)
    const clusters = this.clusterNearbyEntries(entries, 50);
    
    const clusterMoods = clusters.map(cluster => ({
      center: cluster.center,
      entries: cluster.entries,
      stressRate: cluster.entries.filter(e => e.mood === 'stressed').length / cluster.entries.length,
      calmRate: cluster.entries.filter(e => e.mood === 'calm').length / cluster.entries.length
    }));

    const stressClusters = clusterMoods.filter(c => c.stressRate > 0.6);
    const calmClusters = clusterMoods.filter(c => c.calmRate > 0.6);

    if (stressClusters.length > 0) {
      return `Some areas consistently triggered stress. Consider avoiding these locations.`;
    }

    if (calmClusters.length > 0) {
      return `Some areas consistently provided calm moments. These might be good rest spots.`;
    }

    return null;
  }

  // Cluster nearby mood entries
  private static clusterNearbyEntries(entries: MoodEntry[], radiusMeters: number) {
    const clusters: Array<{ center: Location; entries: MoodEntry[] }> = [];
    const processed = new Set<string>();

    entries.forEach(entry => {
      if (processed.has(entry.id)) return;

      const cluster = {
        center: entry.location,
        entries: [entry]
      };

      // Find nearby entries
      entries.forEach(otherEntry => {
        if (otherEntry.id === entry.id || processed.has(otherEntry.id)) return;
        
        if (GPSService.calculateDistance(entry.location, otherEntry.location) <= radiusMeters) {
          cluster.entries.push(otherEntry);
          processed.add(otherEntry.id);
        }
      });

      processed.add(entry.id);
      clusters.push(cluster);
    });

    return clusters;
  }

  // Update calm and stress zones based on session data
  static updateZonesFromSession(
    session: WalkSession,
    existingCalmZones: CalmZone[],
    existingStressZones: StressZone[]
  ): { calmZones: CalmZone[]; stressZones: StressZone[] } {
    const calmZones = [...existingCalmZones];
    const stressZones = [...existingStressZones];

    // Group entries by location clusters
    const clusters = this.clusterNearbyEntries(session.moodEntries, 30);
    
    clusters.forEach(cluster => {
      const stressRate = cluster.entries.filter(e => e.mood === 'stressed').length / cluster.entries.length;
      const calmRate = cluster.entries.filter(e => e.mood === 'calm').length / cluster.entries.length;
      
      if (stressRate > 0.6 && cluster.entries.length >= 2) {
        // This is a stress zone
        const existingZone = stressZones.find(zone => 
          GPSService.calculateDistance(zone.center, cluster.center) < 50
        );
        
        if (existingZone) {
          existingZone.stressCount += cluster.entries.length;
          existingZone.stressScore = Math.min(1, existingZone.stressScore + 0.1);
          existingZone.lastStressed = Math.max(existingZone.lastStressed, 
            Math.max(...cluster.entries.map(e => e.timestamp))
          );
        } else {
          stressZones.push({
            id: `stress_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            center: cluster.center,
            radius: 30,
            stressScore: stressRate,
            stressCount: cluster.entries.length,
            lastStressed: Math.max(...cluster.entries.map(e => e.timestamp))
          });
        }
      } else if (calmRate > 0.6 && cluster.entries.length >= 2) {
        // This is a calm zone
        const existingZone = calmZones.find(zone => 
          GPSService.calculateDistance(zone.center, cluster.center) < 50
        );
        
        if (existingZone) {
          existingZone.visitCount += cluster.entries.length;
          existingZone.calmScore = Math.min(1, existingZone.calmScore + 0.1);
          existingZone.lastVisited = Math.max(existingZone.lastVisited, 
            Math.max(...cluster.entries.map(e => e.timestamp))
          );
        } else {
          calmZones.push({
            id: `calm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            center: cluster.center,
            radius: 30,
            calmScore: calmRate,
            visitCount: cluster.entries.length,
            lastVisited: Math.max(...cluster.entries.map(e => e.timestamp))
          });
        }
      }
    });

    return { calmZones, stressZones };
  }

  // Generate route suggestions
  static generateRouteSuggestion(
    start: Location,
    end: Location,
    calmZones: CalmZone[],
    stressZones: StressZone[]
  ) {
    // Simple route suggestion algorithm
    // In a real implementation, this would use a proper routing service
    
    const waypoints: Location[] = [];
    let calmScore = 0.5; // Base score
    
    // Try to include calm zones along the route
    const nearbyCalmZones = calmZones.filter(zone => {
      const distToStart = GPSService.calculateDistance(start, zone.center);
      const distToEnd = GPSService.calculateDistance(end, zone.center);
      return distToStart < 200 && distToEnd < 200;
    });
    
    if (nearbyCalmZones.length > 0) {
      const bestCalmZone = nearbyCalmZones.reduce((best, current) => 
        current.calmScore > best.calmScore ? current : best
      );
      waypoints.push(bestCalmZone.center);
      calmScore += bestCalmZone.calmScore * 0.3;
    }
    
    // Avoid stress zones
    const nearbyStressZones = stressZones.filter(zone => {
      const distToStart = GPSService.calculateDistance(start, zone.center);
      const distToEnd = GPSService.calculateDistance(end, zone.center);
      return distToStart < 200 && distToEnd < 200;
    });
    
    calmScore -= nearbyStressZones.length * 0.2;
    
    // Calculate estimated duration (rough approximation)
    const totalDistance = GPSService.calculateDistance(start, end);
    const estimatedDuration = Math.round(totalDistance / 1000 * 12); // ~12 min per km walking
    
    return {
      id: `route_${Date.now()}`,
      start,
      end,
      waypoints,
      calmScore: Math.max(0, Math.min(1, calmScore)),
      estimatedDuration,
      avoidsStressZones: nearbyStressZones.map(zone => zone.id),
      includesCalmZones: nearbyCalmZones.map(zone => zone.id)
    };
  }
}
