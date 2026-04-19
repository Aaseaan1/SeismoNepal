import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
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
          {/* @ts-ignore */}
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: 27.7172,
              longitude: 85.324,
              latitudeDelta: 2,
              longitudeDelta: 2,
            }}
          >
            {events.map(event => (
              // @ts-ignore
              <Marker
                key={event.id}
                coordinate={{ latitude: event.lat, longitude: event.lng }}
                title={`M ${event.magnitude}`}
                description={`${event.location} - ${event.time}`}
              />
            ))}
          </MapView>
          <FlatList
            data={events}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={styles.eventItem}>
                <Text style={styles.eventText}>{item.location} | M {item.magnitude} | {item.time}</Text>
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
  map: { height: 220, marginHorizontal: 16, borderRadius: 12 },
  list: { margin: 16 },
  eventItem: { padding: 10, borderBottomWidth: 1, borderColor: '#eee' },
  eventText: { fontSize: 16 },
});
