import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { fetchRecentEarthquakes } from './api/earthquakes';

type EarthquakeEvent = {
  id: string;
  lat: number;
  lng: number;
  magnitude: number;
  location: string;
  time: string;
};

export default function HomeScreen() {
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
        <FlatList
          data={events}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.eventItem}>
              <Text style={styles.eventLocation}>{item.location}</Text>
              <Text style={styles.eventText}>Magnitude: {item.magnitude}</Text>
              <Text style={styles.eventText}>Time: {item.time}</Text>
              <Text style={styles.eventText}>Lat: {item.lat.toFixed(2)}, Lng: {item.lng.toFixed(2)}</Text>
            </View>
          )}
          style={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', margin: 16, marginTop: 20 },
  list: { margin: 16 },
  eventItem: { padding: 12, borderBottomWidth: 1, borderColor: '#eee', marginBottom: 8, borderRadius: 8, backgroundColor: '#f9f9f9' },
  eventLocation: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  eventText: { fontSize: 14, color: '#666', marginBottom: 2 },
});
