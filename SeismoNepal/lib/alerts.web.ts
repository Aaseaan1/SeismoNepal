// Web-only stub for alerts - haptics and audio not available on web
export class AlertService {
  static async initialize(): Promise<void> {
    console.log('AlertService not available on web');
  }

  static cleanup(): void {
    console.log('AlertService cleanup on web');
  }

  static async triggerEarthquakeAlert(magnitude: number, location: string): Promise<void> {
    console.log(`Earthquake alert on web: ${magnitude} at ${location}`);
  }
}
