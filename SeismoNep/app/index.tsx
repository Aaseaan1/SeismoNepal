import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function SplashScreenRoute() {
  const router = useRouter();
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Artificial delay to show splash screen
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady) {
      // Hide the native splash screen
      SplashScreen.hideAsync();
      // Navigate to welcome screen after a brief moment
      setTimeout(() => {
        router.replace('/welcome');
      }, 500);
    }
  }, [appIsReady]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#000000', '#ff0000']}
        style={styles.gradient}
      />
      <Text style={styles.text}>SeismoNepal</Text>
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
  text: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
});
