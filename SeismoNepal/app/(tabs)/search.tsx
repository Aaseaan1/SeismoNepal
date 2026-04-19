
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchRecentEarthquakes } from '../../lib/earthquakes';

type EarthquakeEvent = {
  id: string;
  country: string;
  district: string;
  epicenter: string;
  magnitude: number;
  date: string;
  latitude: number;
  longitude: number;
};

export default function SearchScreen() {
  const [events, setEvents] = useState<EarthquakeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRecentEarthquakes()
      .then(data => {
        setEvents(data);
      })
      .catch(() => setError('Failed to load earthquake data'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#000000', '#ff0000']}
        style={styles.gradient}
      />
      <Text style={styles.title}>Nepal Earthquakes</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#fff" style={{ marginTop: 40 }} />
      ) : error ? (
        <Text style={{ color: '#fff', margin: 16 }}>{error}</Text>
      ) : events.length === 0 ? (
        <Text style={styles.text}>No Earthquake Detected in Nepal Today</Text>
      ) : (
          <FlatList
            data={events}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={styles.eventItem}>
                <Text style={styles.eventLocation}>{item.epicenter}</Text>
                <Text style={styles.eventText}>District: {item.district}</Text>
                <Text style={styles.eventText}>Magnitude: {item.magnitude}</Text>
                <Text style={styles.eventText}>Date: {item.date}</Text>
              </View>
            )}
            style={styles.list}
            scrollEnabled={true}
          />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  text: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  list: { 
    width: '100%',
    paddingHorizontal: 16,
  },
  eventItem: { 
    padding: 12, 
    borderBottomWidth: 1, 
    borderColor: 'rgba(255,255,255,0.2)', 
    marginBottom: 8, 
    borderRadius: 8, 
    backgroundColor: 'rgba(255,255,255,0.1)' 
  },
  eventLocation: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    marginBottom: 4,
    color: '#fff',
  },
  eventText: { 
    fontSize: 14, 
    color: '#ddd', 
    marginBottom: 2 
  },
});