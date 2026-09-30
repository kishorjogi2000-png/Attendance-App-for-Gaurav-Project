/**
 * Geolocation & Geofencing Utilities
 * Uses standard Haversine formula to compute geodesic distance in meters.
 */

export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c;
  return Math.round(distance);
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters} meters`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
}

export interface GeofenceResult {
  isWithin: boolean;
  distanceMeters: number;
  allowedRadiusMeters: number;
  diffMeters: number;
  userCoords: { latitude: number; longitude: number };
  officeCoords: { latitude: number; longitude: number };
}

export function verifyGeofence(
  userLat: number,
  userLon: number,
  officeLat: number,
  officeLon: number,
  allowedRadiusMeters: number
): GeofenceResult {
  const distance = calculateDistanceMeters(userLat, userLon, officeLat, officeLon);
  return {
    isWithin: distance <= allowedRadiusMeters,
    distanceMeters: distance,
    allowedRadiusMeters,
    diffMeters: Math.max(0, distance - allowedRadiusMeters),
    userCoords: { latitude: userLat, longitude: userLon },
    officeCoords: { latitude: officeLat, longitude: officeLon },
  };
}

/**
 * Detects whether GPS coordinates exhibit typical mock/spoofing anomalies
 */
export function checkSuspiciousGPS(
  accuracy: number,
  speed: number | null,
  altitudeAccuracy: number | null
): { isSuspicious: boolean; reason?: string } {
  // If browser reports 0 accuracy, or exact round integers like 0.000000 with null altitude
  if (accuracy <= 0.1) {
    return { isSuspicious: true, reason: 'Suspicious pinpoint GPS accuracy indicative of mock provider' };
  }
  if (speed !== null && speed > 70) {
    // over 250 km/h during checkin
    return { isSuspicious: true, reason: 'Unrealistic transit velocity detected during attendance attempt' };
  }
  return { isSuspicious: false };
}
