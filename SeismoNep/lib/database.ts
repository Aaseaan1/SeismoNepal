// SQLite database for earthquake data
import * as SQLite from 'expo-sqlite';

type EarthquakeEvent = {
  id?: number;
  country: string;
  district: string;
  epicenter: string;
  magnitude: number;
  date: string;
  latitude: number;
  longitude: number;
};

class Database {
  private db: SQLite.SQLiteDatabase;

  constructor() {
    this.db = SQLite.openDatabaseSync('sql.db');
    this.init();
  }

  // Initialize database
  private init() {
    this.db.execSync(`
      CREATE TABLE IF NOT EXISTS earthquakes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        country TEXT DEFAULT 'Nepal',
        district TEXT NOT NULL,
        epicenter TEXT NOT NULL,
        magnitude REAL NOT NULL,
        date TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL
      );
    `);
  }

  // Insert or update earthquakes
  saveEarthquakes(earthquakes: EarthquakeEvent[]) {
    try {
      this.db.withTransactionSync(() => {
        for (const eq of earthquakes) {
          this.db.runSync(
            `INSERT OR REPLACE INTO earthquakes (country, district, epicenter, magnitude, date, latitude, longitude) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [eq.country, eq.district, eq.epicenter, eq.magnitude, eq.date, eq.latitude, eq.longitude]
          );
        }
      });
    } catch (error) {
      console.error('Error saving earthquakes:', error);
    }
  }

  // Get all earthquakes
  getAllEarthquakes(): EarthquakeEvent[] {
    try {
      const result = this.db.getAllSync<EarthquakeEvent>(
        'SELECT id, country, district, epicenter, magnitude, date, latitude, longitude FROM earthquakes ORDER BY id DESC LIMIT 100'
      );
      return result;
    } catch (error) {
      console.error('Error loading earthquakes:', error);
      return [];
    }
  }

  // Get earthquake by id
  getEarthquakeById(id: number): EarthquakeEvent | null {
    try {
      const result = this.db.getFirstSync<EarthquakeEvent>(
        'SELECT id, country, district, epicenter, magnitude, date, latitude, longitude FROM earthquakes WHERE id = ?',
        [id]
      );
      return result || null;
    } catch (error) {
      console.error('Error getting earthquake:', error);
      return null;
    }
  }

  // Delete all earthquakes
  clearAll() {
    try {
      this.db.runSync('DELETE FROM earthquakes');
    } catch (error) {
      console.error('Error clearing earthquakes:', error);
    }
  }

  // Get total count
  getCount(): number {
    try {
      const result = this.db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM earthquakes');
      return result?.count || 0;
    } catch (error) {
      console.error('Error getting count:', error);
      return 0;
    }
  }

  // Auto-fetch and populate earthquake data from USGS API
  async autoFetchEarthquakes() {
    try {
      console.log('Auto-fetching earthquake data from USGS...');
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

      if (earthquakes.length > 0) {
        this.saveEarthquakes(earthquakes);
        console.log(`✓ Auto-populated database with ${earthquakes.length} earthquakes`);
      } else {
        console.log('No earthquakes found for Nepal region');
      }
      
    } catch (error) {
      console.error('Error auto-fetching earthquakes:', error);
    }
  }
}

// Export singleton instance
export const db = new Database();
