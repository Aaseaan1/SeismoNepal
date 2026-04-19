// Utility to fetch recent earthquakes from USGS API
export async function fetchRecentEarthquakes() {
  const url = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson';
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch earthquake data');
  const data = await response.json();
  
  // Helper function to parse district from location string
  const parseDistrict = (location: string): string => {
    // Extract district name from USGS location format
    // Example: "26.8 km NW of Dharan, Nepal" -> "Dharan"
    const match = location.match(/(?:of\s+)?([A-Za-z\s]+),\s*Nepal/i);
    return match ? match[1].trim() : location;
  };

  // Helper function to format date as MM/DD/YYYY
  const formatDateNepal = (timestamp: number): string => {
    const date = new Date(timestamp);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  return data.features
    .map((f: any) => ({
      id: f.id,
      district: parseDistrict(f.properties.place),
      epicenter: f.properties.place,
      magnitude: f.properties.mag,
      date: formatDateNepal(f.properties.time),
      latitude: f.geometry.coordinates[1],
      longitude: f.geometry.coordinates[0],
    }))
    .filter((e: any) => {
      // Manual override for Lobuche (and similar border cases)
      const isLobuche =
        (typeof e.epicenter === 'string' && e.epicenter.toLowerCase().includes('lobuche')) ||
        (Math.abs(e.latitude - 27.96) < 0.05 && Math.abs(e.longitude - 86.80) < 0.05);

      // Show all earthquakes within Nepal bounding box (regardless of 'Nepal' in epicenter)
      const inNepalBox =
        e.latitude >= 26.347 &&
        e.latitude <= 30.447 &&
        e.longitude >= 80.058 &&
        e.longitude <= 88.201;
      return isLobuche || inNepalBox;
    });
}
