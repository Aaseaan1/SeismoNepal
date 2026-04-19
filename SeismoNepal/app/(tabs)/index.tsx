
// This is the Home/Dashboard screen for the main tab navigator.
// Do NOT put splash screen logic here. Splash screen should only be in app/index.tsx.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <Text style={styles.infoText}>Monitor Earthquake Activity In Nepal</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ff0000',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
  },
    title: {
        color: '#fff',
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    subtitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '600',
        textAlign: 'center',
        marginTop: 16,
    },
    infoText: {
        color: '#fff',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 8,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        paddingHorizontal: 20,
        marginTop: 40,
    },
    statCard: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        minWidth: 100,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    statNumber: {
        color: '#fff',
        fontSize: 28,
        fontWeight: 'bold',
        marginTop: 8,
    },
    statLabel: {
        color: '#fff',
        fontSize: 12,
        marginTop: 4,
        textAlign: 'center',
    },
});
