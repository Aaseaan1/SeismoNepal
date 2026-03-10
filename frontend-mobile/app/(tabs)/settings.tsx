import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View, Switch } from 'react-native';
import { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import AsyncStorage from '../../lib/storage';

const LANGUAGE_KEY = 'appLanguage';

export default function SettingsScreen() {
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [shakeEnabled, setShakeEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [language, setLanguage] = useState<'en' | 'ne'>('en');

  useEffect(() => {
    loadSettings();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const loadLanguage = async () => {
        try {
          const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
          if (savedLanguage === 'en' || savedLanguage === 'ne') {
            setLanguage(savedLanguage);
          }
        } catch (error) {
          console.warn('Error loading language preference:', error);
        }
      };

      void loadLanguage();
    }, [])
  );

  const t = {
    title: language === 'ne' ? 'सिस्टम प्राथमिकता' : 'System Preference',
    vibration: language === 'ne' ? 'भाइब्रेशन सक्रिय गर्नुहोस्' : 'Activate Vibration',
    shake: language === 'ne' ? 'शेक सक्रिय गर्नुहोस्' : 'Activate Shake',
    sound: language === 'ne' ? 'ध्वनि सक्रिय गर्नुहोस्' : 'Activate Sound',
    version: language === 'ne' ? 'संस्करण' : 'Version',
    developer: language === 'ne' ? 'डेभलपर' : 'Developer',
  };

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
        <Text style={styles.sectionTitle}>{t.title}</Text>

        <View style={styles.settingItem}>
          <Text style={styles.label}>{t.vibration}</Text>
          <Switch
            value={vibrationEnabled}
            onValueChange={saveVibration}
            trackColor={{ false: '#fff', true: '#fff' }}
            thumbColor="#ff1a1a"
          />
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.label}>{t.shake}</Text>
          <Switch
            value={shakeEnabled}
            onValueChange={saveShake}
            trackColor={{ false: '#fff', true: '#fff' }}
            thumbColor="#ff1a1a"
          />
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.label}>{t.sound}</Text>
          <Switch
            value={soundEnabled}
            onValueChange={saveSound}
            trackColor={{ false: '#fff', true: '#fff' }}
            thumbColor="#ff1a1a"
          />
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>{`${t.version}: 1.0`}</Text>
        <Text style={styles.footerText}>{`${t.developer}: SeismoNep Team`}</Text>
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
