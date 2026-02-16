// Script to fetch real earthquake data from USGS and populate the database
import * as SQLite from 'expo-sqlite';

type EarthquakeEvent = {
  country: string;
  district: string;
  epicenter: string;
  magnitude: number;
  date: string;
  latitude: number;
  longitude: number;
};

async function fetchRealEarthquakes() {
  try {
    console.log('Fetching earthquake data from USGS...');
    const url = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson';
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to fetch earthquake data');
    }
    
    const data = await response.json();
    
    // Helper function to parse district from location string
    const parseDistrict = (location: string): string => {
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

    const earthquakes: EarthquakeEvent[] = data.features
      .map((f: any) => ({
        country: 'Nepal',
        district: parseDistrict(f.properties.place),
        epicenter: f.properties.place,
        magnitude: f.properties.mag,
        date: formatDateNepal(f.properties.time),
        latitude: f.geometry.coordinates[1],
        longitude: f.geometry.coordinates[0],
      }))
      .filter((e: any) => {
        // Filter for Nepal region (approx: lat 26-31°N, lng 80-88°E)
        return (
          e.latitude >= 26 && 
          e.latitude <= 31 && 
          e.longitude >= 80 && 
          e.longitude <= 88
        ) || e.epicenter.toLowerCase().includes('nepal');
      });

    console.log(`Found ${earthquakes.length} earthquakes in Nepal region`);
    
    // Open database and insert
    const db = SQLite.openDatabaseSync('sql.db');
    
    db.withTransactionSync(() => {
      for (const eq of earthquakes) {
        db.runSync(
          `INSERT OR REPLACE INTO earthquakes (country, district, epicenter, magnitude, date, latitude, longitude) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [eq.country, eq.district, eq.epicenter, eq.magnitude, eq.date, eq.latitude, eq.longitude]
        );
      }
    });
    
    console.log(`✓ Successfully inserted ${earthquakes.length} earthquakes into database`);
    
  } catch (error) {
    console.error('Error fetching earthquakes:', error);
  }
}

// Run the function
fetchRealEarthquakes();
