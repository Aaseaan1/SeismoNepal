import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, TextInput, Animated } from 'react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
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
const SEARCH_EVENTS_CACHE_KEY = 'searchEventsCacheV2';
const REQUEST_TIMEOUT_MS = 4500;
const USGS_FALLBACK_START_DATE = '2006-01-01';
const USGS_FALLBACK_END_DATE = '2026-12-31';
const USGS_FALLBACK_LIMIT = 1200;

const fetchWithTimeout = async (url: string, timeoutMs: number) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
};

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
  const [searchText, setSearchText] = useState('');
  const [minMag, setMinMag] = useState('');
  const [maxMag, setMaxMag] = useState('');
  const liveDotOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const bootstrapSearch = async () => {
      let hasCachedData = false;

      try {
        const rawCachedEvents = await AsyncStorage.getItem(SEARCH_EVENTS_CACHE_KEY);
        if (rawCachedEvents) {
          const parsedEvents = JSON.parse(rawCachedEvents) as EventItem[];
          if (Array.isArray(parsedEvents) && parsedEvents.length > 0) {
            setEvents(parsedEvents);
            setLoading(false);
            hasCachedData = true;
          }
        }
      } catch (error) {
        console.warn('Failed to load cached search events:', error);
      }

      await fetchEvents(!hasCachedData);
    };

    void bootstrapSearch();
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
    const blinkAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(liveDotOpacity, {
          toValue: 0.25,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.timing(liveDotOpacity, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
      ])
    );

    blinkAnimation.start();

    return () => {
      blinkAnimation.stop();
    };
  }, [liveDotOpacity]);

  const persistEvents = async (nextEvents: EventItem[]) => {
    try {
      await AsyncStorage.setItem(SEARCH_EVENTS_CACHE_KEY, JSON.stringify(nextEvents));
    } catch (error) {
      console.warn('Failed to cache search events:', error);
    }
  };

  const fetchEvents = async (showLoader: boolean) => {
    if (showLoader) {
      setError(null);
      setLoading(true);
    }

    try {
      const eventsUrl = `${API_BASE_URL}/api/scraper/events/`;

      let backendEvents: EventItem[] = [];
      try {
        const response = await fetchWithTimeout(eventsUrl, REQUEST_TIMEOUT_MS);
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
        await persistEvents(backendEvents);
        return;
      }

      const startDate = USGS_FALLBACK_START_DATE;
      const endDate = USGS_FALLBACK_END_DATE;
      const usgsUrl =
        `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson` +
        `&minlatitude=${NEPAL_BOUNDS.minLat}&maxlatitude=${NEPAL_BOUNDS.maxLat}` +
        `&minlongitude=${NEPAL_BOUNDS.minLon}&maxlongitude=${NEPAL_BOUNDS.maxLon}` +
        `&starttime=${startDate}&endtime=${endDate}` +
        `&orderby=time&limit=${USGS_FALLBACK_LIMIT}`;

      const usgsResponse = await fetchWithTimeout(usgsUrl, REQUEST_TIMEOUT_MS);
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

      if (usgsEvents.length > 0) {
        setEvents(usgsEvents);
        await persistEvents(usgsEvents);
      }
    } catch (e: any) {
      console.error('Error loading earthquakes:', e);
      if (showLoader) {
        setError(e?.message ?? 'Failed to load earthquakes');
      }
    } finally {
      if (showLoader) {
        setLoading(false);
      }
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
  const loadingText = language === 'ne' ? 'डेटा लोड हुँदैछ...' : 'Loading...';
  const errorPrefix = language === 'ne' ? 'त्रुटि' : 'Error';
  const emptyText =
    language === 'ne'
      ? 'छानिएको अवधिमा कुनै भूकम्प डेटा फेला परेन।'
      : 'No earthquake data found for selected period.';
  const magnitudeLabel = language === 'ne' ? 'म्याग्निच्युड' : 'Magnitude';
  const dateLabel = language === 'ne' ? 'मिति' : 'Date';

  // Filter events based on search and magnitude
  const filteredEvents = useMemo(() => {
    const normalizedSearchText = searchText.trim().toLowerCase();
    const min = parseFloat(minMag);
    const max = parseFloat(maxMag);

    return events.filter((event) => {
      const matchesLocation = event.location.toLowerCase().includes(normalizedSearchText);
      const matchesMin = Number.isNaN(min) ? true : event.magnitude >= min;
      const matchesMax = Number.isNaN(max) ? true : event.magnitude <= max;
      return matchesLocation && matchesMin && matchesMax;
    });
  }, [events, searchText, minMag, maxMag]);

  const countText =
    language === 'ne' ? `कुल भूकम्पहरू: ${filteredEvents.length}` : `Total Earthquakes: ${filteredEvents.length}`;

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
        <Animated.View style={[styles.liveDot, { opacity: liveDotOpacity }]} />
        <Text style={styles.liveText}>LIVE</Text>
      </View>
      <Text style={styles.count}>{countText}</Text>

      {/* Search and filter UI */}
      <View style={styles.filterRow}>
        <View style={styles.filterCol}>
          <Text style={styles.filterLabel}>{language === 'ne' ? 'स्थान खोज्नुहोस्' : 'Search Location'}</Text>
          <TextInput
            style={styles.filterInput}
            placeholder={language === 'ne' ? 'स्थान' : 'Location'}
            placeholderTextColor="#fff8"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
        <View style={styles.filterColSmall}>
          <Text style={styles.filterLabel}>{language === 'ne' ? 'न्यूनतम म्याग्निच्युड' : 'Min Mag'}</Text>
          <TextInput
            style={styles.filterInput}
            placeholder="Min"
            placeholderTextColor="#fff8"
            value={minMag}
            onChangeText={setMinMag}
            keyboardType="numeric"
            maxLength={4}
          />
        </View>
        <View style={styles.filterColSmall}>
          <Text style={styles.filterLabel}>{language === 'ne' ? 'अधिकतम म्याग्निच्युड' : 'Max Mag'}</Text>
          <TextInput
            style={styles.filterInput}
            placeholder="Max"
            placeholderTextColor="#fff8"
            value={maxMag}
            onChangeText={setMaxMag}
            keyboardType="numeric"
            maxLength={4}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color="#fff" style={styles.loader} />
          <Text style={styles.loaderText}>{loadingText}</Text>
        </View>
      ) : null}
      {error ? <Text style={styles.error}>{`${errorPrefix}: ${error}`}</Text> : null}

      <FlatList
        data={filteredEvents}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        initialNumToRender={12}
        maxToRenderPerBatch={12}
        windowSize={7}
        removeClippedSubviews
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
    filterRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'center',
      gap: 10,
      marginTop: 18,
      marginBottom: 2,
      paddingHorizontal: 10,
    },
    filterCol: {
      flex: 1.5,
      marginRight: 6,
    },
    filterColSmall: {
      flex: 1,
      marginRight: 6,
    },
    filterLabel: {
      color: '#fff',
      fontSize: 13,
      fontWeight: '700',
      marginBottom: 2,
    },
    filterInput: {
      backgroundColor: 'rgba(255,255,255,0.08)',
      color: '#fff',
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 6,
      fontSize: 15,
      fontWeight: '700',
    },
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
