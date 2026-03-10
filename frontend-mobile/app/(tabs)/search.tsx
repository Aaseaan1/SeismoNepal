import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View, FlatList, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

import { API_BASE_URL } from '../../lib/api';
import AsyncStorage from '../../lib/storage';

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
const LANGUAGE_KEY = 'appLanguage';

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
  const [language, setLanguage] = useState<'en' | 'ne'>('en');
  const [liveVisible, setLiveVisible] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const loadLanguage = async () => {
        try {
          const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
          if (savedLanguage === 'en' || savedLanguage === 'ne') {
            setLanguage(savedLanguage);
          }
        } catch (loadError) {
          console.warn('Failed to load language preference:', loadError);
        }
      };

      void loadLanguage();
    }, [])
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveVisible((prev) => !prev);
    }, 700);

    return () => clearInterval(timer);
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
    return date.toLocaleDateString(language === 'ne' ? 'ne-NP' : 'en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });
  };

  const formatMagnitude = (value: number) => {
    if (!Number.isFinite(value) || value <= 0) return '?';
    return value.toFixed(1);
  };

  const titleText = language === 'ne' ? 'नेपालका भूकम्पहरू' : 'Nepal Earthquakes';
  const countText = language === 'ne' ? `कुल घटना: ${events.length}` : `Total events: ${events.length}`;
  const loadingText = language === 'ne' ? 'डेटा लोड हुँदैछ...' : 'Loading...';
  const errorPrefix = language === 'ne' ? 'त्रुटि' : 'Error';
  const emptyText =
    language === 'ne'
      ? 'छानिएको अवधिमा कुनै भूकम्प डेटा फेला परेन।'
      : 'No earthquake data found for selected period.';
  const magnitudeLabel = language === 'ne' ? 'म्याग्निच्युड' : 'Magnitude';
  const dateLabel = language === 'ne' ? 'मिति' : 'Date';

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#120000', '#2b0000', '#df0000']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.gradientBackground}
      />

      <Text style={styles.title}>{titleText}</Text>
      <View style={styles.liveRow}>
        <View style={[styles.liveDot, !liveVisible && styles.liveDotHidden]} />
        <Text style={styles.liveText}>LIVE</Text>
      </View>
      <Text style={styles.count}>{countText}</Text>

      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color="#fff" style={styles.loader} />
          <Text style={styles.loaderText}>{loadingText}</Text>
        </View>
      ) : null}
      {error ? <Text style={styles.error}>{`${errorPrefix}: ${error}`}</Text> : null}

      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          !loading ? <Text style={styles.empty}>{emptyText}</Text> : null
        }
        renderItem={({ item }) => (
          <View style={styles.resultCard}>
            <Text style={styles.location}>{item.location}</Text>
            <Text style={styles.meta}>{`${magnitudeLabel}: ${formatMagnitude(item.magnitude)}`}</Text>
            <Text style={styles.date}>{`${dateLabel}: ${formatDate(item.occurred_at)}`}</Text>
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
  liveRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: '#ff2a2a',
  },
  liveDotHidden: {
    opacity: 0.25,
    transform: [{ scale: 0.72 }],
  },
  liveText: {
    color: '#ffd6d6',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  loader: {
    marginTop: 20,
  },
  loaderWrap: {
    alignItems: 'center',
  },
  loaderText: {
    color: '#fff',
    marginTop: 8,
    fontWeight: '700',
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
