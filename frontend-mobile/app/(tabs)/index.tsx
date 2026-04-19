import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { sendEmergencyAlert } from '../../utils/sendEmergencyAlert';
import AsyncStorage from '../../lib/storage';

import { API_BASE_URL } from '../../lib/api';

type EventItem = {
  id: string;
  location: string;
  district: string;
  magnitude: number;
  occurred_at: string;
};

type StatCardProps = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  value: string;
  label: string;
};

const NEPAL_BOUNDS = {
  minLat: 26.347,
  maxLat: 30.447,
  minLon: 80.058,
  maxLon: 88.201,
};

const BLOCKED_PLACE_PATTERN = /(india|china|southern tibetan plateau|tibetan plateau|xizang)/i;
const ALERT_MIN_MAGNITUDE = 4.0;
const LANGUAGE_KEY = 'appLanguage';
const EVENTS_CACHE_KEY = 'dashboardEventsCacheV2';
const REQUEST_TIMEOUT_MS = 4500;
const MIN_SPLASH_MS = 1400;
const USGS_FALLBACK_START_DATE = '2006-01-01';
const USGS_FALLBACK_END_DATE = '2026-12-31';
const USGS_FALLBACK_LIMIT = 1200;

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

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
  const m1 = place.match(/of\s+([^,]+),\s*Nepal/i);
  if (m1?.[1]) return m1[1].trim();

  const m2 = place.match(/^([^,]+),\s*Nepal/i);
  if (m2?.[1]) return m2[1].trim();

  return 'Unknown district';
};

function StatCard({ icon, value, label }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={34} color="#fff" />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<'en' | 'ne'>('en');
  const lastAlertedEventId = useRef<string | null>(null);

  useEffect(() => {
    const bootstrapDashboard = async () => {
      const splashStart = Date.now();
      let hasCachedData = false;

      try {
        const rawCachedEvents = await AsyncStorage.getItem(EVENTS_CACHE_KEY);
        if (rawCachedEvents) {
          const parsedEvents = JSON.parse(rawCachedEvents) as EventItem[];
          if (Array.isArray(parsedEvents) && parsedEvents.length > 0) {
            setEvents(parsedEvents);
            hasCachedData = true;
          }
        }
      } catch (error) {
        console.warn('Failed to load cached dashboard events:', error);
      }

      if (hasCachedData) {
        const elapsed = Date.now() - splashStart;
        if (elapsed < MIN_SPLASH_MS) {
          await wait(MIN_SPLASH_MS - elapsed);
        }
        setLoading(false);
      }

      await fetchEarthquakes(!hasCachedData);
    };

    void bootstrapDashboard();
  }, []);

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
        if (savedLanguage === 'en' || savedLanguage === 'ne') {
          setLanguage(savedLanguage);
        }
      } catch (error) {
        console.warn('Failed to load language preference:', error);
      }
    };

    loadLanguage();
  }, []);

  const setLanguageAndPersist = async (value: 'en' | 'ne') => {
    setLanguage(value);
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, value);
    } catch (error) {
      console.warn('Failed to save language preference:', error);
    }
  };

  useEffect(() => {
    if (loading || events.length === 0) return;

    const latest = [...events].sort(
      (a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime()
    )[0];

    if (!latest) return;
    if (latest.id === lastAlertedEventId.current) return;
    if (Number(latest.magnitude || 0) < ALERT_MIN_MAGNITUDE) return;

    lastAlertedEventId.current = latest.id;

    void sendEmergencyAlert({
      magnitude: Number(latest.magnitude || 0),
      district: latest.district || extractDistrict(latest.location),
      province: 'Unknown Province',
      stateNo: 'N/A',
      occurredAtISO: latest.occurred_at,
    });
  }, [events, loading]);

  const persistEvents = async (nextEvents: EventItem[]) => {
    try {
      await AsyncStorage.setItem(EVENTS_CACHE_KEY, JSON.stringify(nextEvents));
    } catch (error) {
      console.warn('Failed to cache dashboard events:', error);
    }
  };

  const fetchEarthquakes = async (showLoader: boolean) => {
    if (showLoader) {
      setLoading(true);
    }

    try {
      const backendUrl = `${API_BASE_URL}/api/scraper/events/`;

      let backendEvents: EventItem[] = [];
      try {
        const response = await fetchWithTimeout(backendUrl, REQUEST_TIMEOUT_MS);
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
        console.warn('Dashboard backend fetch failed, using USGS fallback:', backendError);
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
    } catch (error) {
      console.error('Error fetching earthquakes:', error);
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#120000', '#2b0000', '#df0000']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.gradientBackground}
        />
        <View style={styles.loadingContent}>
          <Image
            source={require('../../assets/nepal-outline.png')}
            style={styles.splashMap}
            resizeMode="contain"
          />
          <Text style={styles.splashTitle}>SeismoNepal</Text>
        </View>
      </View>
    );
  }

  const now = new Date();
  const monthlyCount = events.filter((event) => {
    const date = new Date(event.occurred_at);
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;

  const todayCount = events.filter((event) => {
    const date = new Date(event.occurred_at);
    return (
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  }).length;

  const averageMagnitude = events.length
    ? (events.reduce((sum, event) => sum + Number(event.magnitude || 0), 0) / events.length).toFixed(1)
    : '0.0';

  const titleText = language === 'ne' ? 'ड्यासबोर्ड' : 'Dashboard';
  const subtitleText =
    language === 'ne' ? 'नेपालमा भूकम्प गतिविधि निगरानी' : 'Monitor Earthquake Activity In Nepal';
  const monthLabel = language === 'ne' ? 'यस महिना' : 'This Month';
  const todayLabel = language === 'ne' ? 'आज' : 'Today';
  const avgLabel = language === 'ne' ? 'औसत म्याग्निच्युड' : 'Avg Magnitude';
  const safetyButtonText = language === 'ne' ? 'सुरक्षा उपायहरू' : 'Safety Measures';

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#120000', '#2b0000', '#df0000']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.gradientBackground}
      />

      <View style={styles.content}>
        <View style={styles.languageToggleRow}>
          <TouchableOpacity
            style={[styles.languageToggleButton, language === 'en' && styles.languageToggleButtonActive]}
            onPress={() => void setLanguageAndPersist('en')}
          >
            <Text style={[styles.languageToggleText, language === 'en' && styles.languageToggleTextActive]}>
              English
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.languageToggleButton, language === 'ne' && styles.languageToggleButtonActive]}
            onPress={() => void setLanguageAndPersist('ne')}
          >
            <Text style={[styles.languageToggleText, language === 'ne' && styles.languageToggleTextActive]}>
              नेपाली
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>{titleText}</Text>
        <Text style={styles.subtitle}>{subtitleText}</Text>

        <View style={styles.statsRow}>
          <StatCard icon="trending-up-outline" value={String(monthlyCount)} label={monthLabel} />
          <StatCard icon="calendar-outline" value={String(todayCount)} label={todayLabel} />
          <StatCard icon="speedometer-outline" value={averageMagnitude} label={avgLabel} />
        </View>

        <TouchableOpacity style={styles.safetyButton} onPress={() => router.push('/safetymeasures')}>
          <Text style={styles.safetyButtonText}>{safetyButtonText}</Text>
        </TouchableOpacity>
      </View>
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
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashMap: {
    width: 300,
    height: 100,
    marginBottom: 16,
  },
  splashTitle: {
    color: '#fff',
    fontSize: 56,
    fontWeight: '900',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  languageToggleRow: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: 999,
    padding: 4,
    marginBottom: 16,
  },
  languageToggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  languageToggleButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  languageToggleText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  languageToggleTextActive: {
    color: '#6b0000',
  },
  title: {
    color: '#fff',
    fontSize: 62,
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 28,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  safetyButton: {
    marginTop: 16,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  safetyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingVertical: 22,
    alignItems: 'center',
  },
  statValue: {
    color: '#fff',
    fontSize: 56,
    fontWeight: '900',
    marginTop: 8,
    lineHeight: 64,
  },
  statLabel: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
});
