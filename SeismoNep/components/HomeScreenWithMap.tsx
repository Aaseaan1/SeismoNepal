import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { fetchRecentEarthquakes } from '../lib/earthquakes';

type EarthquakeEvent = {
  id: string;
  lat: number;
  lng: number;
  magnitude: number;
  location: string;
  time: string;
};

export default function HomeScreenWithMap() {
  const [events, setEvents] = useState<EarthquakeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRecentEarthquakes()
      .then(data => {
        console.log(data);
        setEvents(data);
      })
      .catch(() => setError('Failed to load earthquake data'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recent Earthquakes</Text>
      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 40 }} />
      ) : error ? (
        <Text style={{ color: 'red', margin: 16 }}>{error}</Text>
      ) : (
        <>
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapPlaceholderText}>
              Map view is only available on mobile devices
            </Text>
          </View>
          <FlatList
            data={events}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={styles.eventItem}>
                <Text style={styles.eventText}>
                  {item.location} | M {item.magnitude} | {item.time}
                </Text>
              </View>
            )}
            style={styles.list}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', margin: 16 },
  mapPlaceholder: { 
    height: 220, 
    marginHorizontal: 16, 
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  mapPlaceholderText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  list: { margin: 16 },
  eventItem: { padding: 10, borderBottomWidth: 1, borderColor: '#eee' },
  eventText: { fontSize: 16 },
});
