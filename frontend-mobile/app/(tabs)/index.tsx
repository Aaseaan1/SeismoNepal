import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View, Image } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { sendEmergencyAlert } from '../../utils/sendEmergencyAlert';

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
const MIN_SPLASH_MS = 2500;
const ALERT_MIN_MAGNITUDE = 4.0;

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
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const lastAlertedEventId = useRef<string | null>(null);

  useEffect(() => {
    fetchEarthquakes();
  }, []);

  useEffect(() => {
    (async () => {
      await Notifications.requestPermissionsAsync();
    })();
  }, []);

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

  const fetchEarthquakes = async () => {
    const splashDelay = new Promise<void>((resolve) => setTimeout(resolve, MIN_SPLASH_MS));

    try {
      const backendUrl = `${API_BASE_URL}/api/scraper/events/`;

      let backendEvents: EventItem[] = [];
      try {
        const response = await fetch(backendUrl);
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
    } catch (error) {
      console.error('Error fetching earthquakes:', error);
    } finally {
      await splashDelay; // keep splash visible for at least MIN_SPLASH_MS
      setLoading(false);
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
          <Text style={styles.splashTitle}>SeismoNep</Text>
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

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#120000', '#2b0000', '#df0000']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.gradientBackground}
      />

      <View style={styles.content}>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>Monitor Earthquake Activity In Nepal</Text>

        <View style={styles.statsRow}>
          <StatCard icon="trending-up-outline" value={String(monthlyCount)} label="This Month" />
          <StatCard icon="calendar-outline" value={String(todayCount)} label="Today" />
          <StatCard icon="speedometer-outline" value={averageMagnitude} label="Avg Magnitude" />
        </View>
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
