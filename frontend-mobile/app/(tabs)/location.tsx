import React, { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { API_BASE_URL } from '../../lib/api';
import AsyncStorage from '../../lib/storage';

const LANGUAGE_KEY = 'appLanguage';

const NEPAL_BOUNDS = {
  minLat: 26.347,
  maxLat: 30.447,
  minLon: 80.058,
  maxLon: 88.201,
};

type EventItem = {
  id: string;
  location: string;
  magnitude: number;
  occurred_at?: string;
  latitude?: number;
  longitude?: number;
};


export default function LocationScreen() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 27.7,
    longitude: 85.3,
    latitudeDelta: 2.5,
    longitudeDelta: 2.5,
  });
  const [mapReady, setMapReady] = useState(false);
  const [language, setLanguage] = useState<'en' | 'ne'>('en');

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchEvents = async () => {
        try {
          setError('');
          setLoading(true);
          const response = await fetch(`${API_BASE_URL}/api/scraper/events/`);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const data = await response.json();
          if (isActive) {
            setEvents(Array.isArray(data) ? data : []);
          }
        } catch (err) {
          if (isActive) {
            setError('Failed to load events');
          }
        } finally {
          if (isActive) {
            setLoading(false);
          }
        }
      };

      const getUserLocation = async () => {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            if (isActive) {
              setError('Permission to access location was denied');
              setMapReady(true);
            }
            return;
          }

          const location = await Location.getCurrentPositionAsync({});
          if (!isActive) return;
          setUserLocation(location.coords);
          setMapRegion({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.08,
            longitudeDelta: 0.08,
          });
          setMapReady(true);
        } catch (err) {
          if (isActive) {
            setError('Could not get current location');
            setMapReady(true);
          }
        }
      };

      setMapReady(false);
      setLoading(true);
      void fetchEvents();
      void getUserLocation();

      return () => {
        isActive = false;
      };
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      const loadLanguage = async () => {
        try {
          const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
          if (savedLanguage === 'en' || savedLanguage === 'ne') {
            setLanguage(savedLanguage);
          }
        } catch (e) {
          // ignore
        }
      };
      loadLanguage();
    }, [])
  );

  const latestEventIndex = useMemo(() => {
    if (!events.length) return -1;

    let latestIdx = events.length - 1;
    let latestTime: number | null = null;

    for (let index = 0; index < events.length; index += 1) {
      const event = events[index];
      if (!event.occurred_at) continue;

      const time = new Date(event.occurred_at).getTime();
      if (!Number.isNaN(time) && (latestTime === null || time > latestTime)) {
        latestTime = time;
        latestIdx = index;
      }
    }

    return latestIdx;
  }, [events]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#120000', '#2b0000', '#df0000']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.gradientBackground}
      />
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>
          {language === 'ne' ? 'स्थान' : 'Location'}
        </Text>
        <View style={styles.mapContainer}>
          {mapReady ? (
            <MapView style={styles.map} initialRegion={mapRegion} showsUserLocation>
              {userLocation && (
                <Marker
                  coordinate={{
                    latitude: userLocation.latitude,
                    longitude: userLocation.longitude,
                  }}
                  title="You are here"
                  pinColor="#007aff"
                />
              )}
              {events.map((event, index) =>
                event.latitude && event.longitude ? (
                  <Marker
                    key={event.id}
                    coordinate={{ latitude: event.latitude, longitude: event.longitude }}
                    title={`M ${event.magnitude}`}
                    description={event.location}
                    pinColor={index === latestEventIndex ? '#df0000' : undefined}
                  />
                ) : null
              )}
            </MapView>
          ) : (
            <ActivityIndicator size="large" color="#df0000" style={{ marginTop: 24 }} />
          )}
        </View>
        {loading ? (
          <ActivityIndicator size="large" color="#df0000" style={{ marginTop: 24 }} />
        ) : null}
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
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 34,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 56,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 60,
  },
  mapContainer: {
    height: 300,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 40,
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginTop: 24,
  },
});
