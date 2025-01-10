

export const MIN_DISTANCE = 0.1;

// Function to sort sensors based on the distance with target
export function getSensorsWithDistance(lat: number, lon: number, sensors: any[]) {
    const result = [];

    for (const sensor of sensors) {
      const distance = calculateDistance(
        lat,
        lon,
        sensor.latitude,
        sensor.longitude
      );
      result.push({ ...sensor, distance });
    }
    result.sort((a, b) => a.distance - b.distance);
    return result;
}

// Function to calculate distance between two geographical coordinates (Haversine formula)
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const firstLat = toRadians(lat1);
  const secondLat = toRadians(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) *
      Math.sin(dLon / 2) *
      Math.cos(firstLat) *
      Math.cos(secondLat);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}