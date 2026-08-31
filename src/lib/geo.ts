// Great-circle distance in km between two lat/lng points.
export function haversineKm(
  lat1?: number | null,
  lon1?: number | null,
  lat2?: number | null,
  lon2?: number | null
): number | null {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Deep link to the device's map app for turn-by-turn navigation — no
// proprietary navigation is built, per the product spec.
export function mapsDirectionsUrl(destLat?: number | null, destLng?: number | null, label?: string) {
  if (destLat == null || destLng == null) return null;
  const dest = `${destLat},${destLng}`;
  const q = label ? `&destination_place_id=&travelmode=driving` : "";
  return `https://www.google.com/maps/dir/?api=1&destination=${dest}${q}`;
}
