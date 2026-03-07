import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View, FlatList, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';

import { API_BASE_URL } from '../../lib/api';

type EventItem = {
  id: string;
  location: string;
  district: string;
  magnitude: number;
  occurred_at: string;
};

const NEPAL_BOUNDS = {
  minLat: 26.347,
  maxLat: 30.447,
  minLon: 80.058,
  maxLon: 88.201,
};

const BLOCKED_PLACE_PATTERN = /(india|china|southern tibetan plateau|tibetan plateau|xizang)/i;

const extractDistrict = (place: string) => {
  // Example: "15 km N of Ilam, Nepal" -> "Ilam"
  const m1 = place.match(/of\s+([^,]+),\s*Nepal/i);
  if (m1?.[1]) return m1[1].trim();

  // Example: "Bhojpur, Nepal" -> "Bhojpur"
  const m2 = place.match(/^([^,]+),\s*Nepal/i);
  if (m2?.[1]) return m2[1].trim();

  return 'Unknown district';
};

export default function SearchScreen() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setError(null);
      setLoading(true);

      const eventsUrl = `${API_BASE_URL}/api/scraper/events/`;
      console.log('Fetching events from backend:', eventsUrl);

      let backendEvents: EventItem[] = [];
      try {
        const response = await fetch(eventsUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        backendEvents = (Array.isArray(data) ? data : []).map((item: any) => {
          const place = String(item?.location ?? 'Unknown location');
          return {
            id: String(item?.id ?? `${item?.occurred_at ?? Date.now()}`),
            location: place,
            district: extractDistrict(place),
            magnitude: Number(item?.magnitude ?? 0),
            occurred_at: String(item?.occurred_at ?? new Date().toISOString()),
          };
        });
      } catch (backendError) {
        console.warn('Backend fetch failed, using USGS fallback:', backendError);
      }

      if (backendEvents.length > 0) {
        setEvents(backendEvents);
        return;
      }

      const startDate = '2020-01-01';
      const endDate = new Date().toISOString().slice(0, 10);
      const usgsUrl =
        `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson` +
        `&minlatitude=${NEPAL_BOUNDS.minLat}&maxlatitude=${NEPAL_BOUNDS.maxLat}` +
        `&minlongitude=${NEPAL_BOUNDS.minLon}&maxlongitude=${NEPAL_BOUNDS.maxLon}` +
        `&starttime=${startDate}&endtime=${endDate}` +
        `&orderby=time&limit=5000`;

      console.log('Fetching events from USGS fallback:', usgsUrl);
      const usgsResponse = await fetch(usgsUrl);
      if (!usgsResponse.ok) throw new Error(`USGS HTTP ${usgsResponse.status}`);

      const usgsData = await usgsResponse.json();
      const usgsEvents: EventItem[] = (usgsData?.features ?? [])
        .filter((feature: any) => {
          const [lon, lat] = feature?.geometry?.coordinates ?? [];
          if (typeof lon !== 'number' || typeof lat !== 'number') return false;
          if (
            lat < NEPAL_BOUNDS.minLat ||
            lat > NEPAL_BOUNDS.maxLat ||
            lon < NEPAL_BOUNDS.minLon ||
            lon > NEPAL_BOUNDS.maxLon
          ) {
            return false;
          }

          const place = String(feature?.properties?.place ?? '');
          return !BLOCKED_PLACE_PATTERN.test(place);
        })
        .map((feature: any) => {
          const place = String(feature?.properties?.place ?? 'Unknown location');
          return {
            id: String(feature?.id ?? `${feature?.properties?.time ?? Date.now()}`),
            location: place,
            district: extractDistrict(place),
            magnitude: Number(feature?.properties?.mag ?? 0),
            occurred_at: new Date(feature?.properties?.time ?? Date.now()).toISOString(),
          };
        });

      setEvents(usgsEvents);
    } catch (e: any) {
      console.error('Error loading earthquakes:', e);
      setError(e?.message ?? 'Failed to load earthquakes');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (value: string) => {
    const date = new Date(value);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });
  };

  const formatMagnitude = (value: number) => {
    if (!Number.isFinite(value) || value <= 0) return '?';
    return value.toFixed(1);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#120000', '#2b0000', '#df0000']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.gradientBackground}
      />

      <Text style={styles.title}>Nepal Earthquakes</Text>
      <Text style={styles.count}>Total events: {events.length}</Text>

      {loading ? <ActivityIndicator size="large" color="#fff" style={styles.loader} /> : null}
      {error ? <Text style={styles.error}>Error: {error}</Text> : null}

      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          !loading ? <Text style={styles.empty}>No earthquake data found for selected period.</Text> : null
        }
        renderItem={({ item }) => (
          <View style={styles.resultCard}>
            <Text style={styles.location}>{item.location}</Text>
            <Text style={styles.meta}>Magnitude: {formatMagnitude(item.magnitude)}</Text>
            <Text style={styles.date}>Date: {formatDate(item.occurred_at)}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#df0000',
  },
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  title: {
    color: '#fff',
    fontSize: 42,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 72,
  },
  count: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '700',
    marginTop: 8,
  },
  loader: {
    marginTop: 20,
  },
  error: {
    color: '#ffd6d6',
    textAlign: 'center',
    marginTop: 10,
    fontWeight: '700',
  },
  empty: {
    color: '#fff',
    textAlign: 'center',
    marginTop: 16,
    fontWeight: '700',
  },
  listContainer: {
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 12,
  },
  resultCard: {
    backgroundColor: 'rgba(31, 0, 0, 0.36)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  location: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 6,
  },
  meta: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  date: {
    color: 'rgba(255,255,255,0.86)',
    fontSize: 14,
    fontWeight: '700',
  },
});
