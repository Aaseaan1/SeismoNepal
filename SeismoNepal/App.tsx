import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import SplashScreen from './app/SplashScreen';
import Tabs from './app/(tabs)'; // Adjust if your tab navigator is elsewhere

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2000); // 2 seconds
    return () => clearTimeout(timer);
  }, []);

  return (
    <NavigationContainer>
      {showSplash ? <SplashScreen /> : <Tabs />}
    </NavigationContainer>
  );
}