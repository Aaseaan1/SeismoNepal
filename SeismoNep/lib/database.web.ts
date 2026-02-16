// Web-only stub for database - not functional on web
export class Database {
  autoFetchEarthquakes() {
    console.log('Database not available on web');
  }
}

export const db = new Database();
