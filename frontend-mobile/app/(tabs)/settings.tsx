import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View, Switch } from 'react-native';
import { useState, useEffect } from 'react';
import AsyncStorage from '../../lib/storage';

export default function SettingsScreen() {
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [shakeEnabled, setShakeEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const vibration = await AsyncStorage.getItem('vibrationEnabled');
      const shake = await AsyncStorage.getItem('shakeEnabled');
      const sound = await AsyncStorage.getItem('soundEnabled');
      
      if (vibration !== null) setVibrationEnabled(vibration === 'true');
      if (shake !== null) setShakeEnabled(shake === 'true');
      if (sound !== null) setSoundEnabled(sound === 'true');
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveVibration = async (value: boolean) => {
    setVibrationEnabled(value);
    await AsyncStorage.setItem('vibrationEnabled', value.toString());
  };

  const saveShake = async (value: boolean) => {
    setShakeEnabled(value);
    await AsyncStorage.setItem('shakeEnabled', value.toString());
  };

  const saveSound = async (value: boolean) => {
    setSoundEnabled(value);
    await AsyncStorage.setItem('soundEnabled', value.toString());
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#120000', '#2b0000', '#df0000']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.gradientBackground}
      />

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>System Preference</Text>

        <View style={styles.settingItem}>
          <Text style={styles.label}>Activate Vibration</Text>
          <Switch
            value={vibrationEnabled}
            onValueChange={saveVibration}
            trackColor={{ false: '#fff', true: '#fff' }}
            thumbColor="#ff1a1a"
          />
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.label}>Activate Shake</Text>
          <Switch
            value={shakeEnabled}
            onValueChange={saveShake}
            trackColor={{ false: '#fff', true: '#fff' }}
            thumbColor="#ff1a1a"
          />
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.label}>Activate Sound</Text>
          <Switch
            value={soundEnabled}
            onValueChange={saveSound}
            trackColor={{ false: '#fff', true: '#fff' }}
            thumbColor="#ff1a1a"
          />
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Version: 1.0</Text>
        <Text style={styles.footerText}>Developer: Aaseaan Siwakoti</Text>
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
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
  },
  label: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  footer: {
    paddingBottom: 90,
    alignItems: 'center',
  },
  footerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
});
