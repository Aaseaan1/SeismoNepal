// Utility to fetch recent earthquakes from USGS API
export async function fetchRecentEarthquakes() {
  const url = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson';
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch earthquake data');
  const data = await response.json();
  return data.features.map(f => ({
    id: f.id,
    magnitude: f.properties.mag,
    location: f.properties.place,
    time: new Date(f.properties.time).toLocaleString(),
    lat: f.geometry.coordinates[1],
    lng: f.geometry.coordinates[0],
  }));
}
