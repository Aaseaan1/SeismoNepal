import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView } from 'react-native';
import { SettingsManager, Settings } from '../lib/settings';

export default function SettingsScreen() {
  const [settings, setSettings] = useState<Settings>({
    vibrationEnabled: false,
    shakeEnabled: false,
    soundEnabled: false,
  });

  // Load settings on mount
  useEffect(() => {
    SettingsManager.loadSettings().then(setSettings);
  }, []);

  // Update setting handler
  const updateSetting = async (key: keyof Settings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await SettingsManager.saveSettings(newSettings);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      
      <Text style={styles.sectionTitle}>Earthquake Alerts</Text>
      
      <View style={styles.row}>
        <View style={styles.labelContainer}>
          <Text style={styles.label}>Shake Detection</Text>
          <Text style={styles.description}>Alert when device shaking detected</Text>
        </View>
        <Switch 
          value={settings.shakeEnabled} 
          onValueChange={(value) => updateSetting('shakeEnabled', value)} 
        />
      </View>

      <View style={styles.row}>
        <View style={styles.labelContainer}>
          <Text style={styles.label}>Sound Alerts</Text>
          <Text style={styles.description}>Play sound for earthquake alerts</Text>
        </View>
        <Switch 
          value={settings.soundEnabled} 
          onValueChange={(value) => updateSetting('soundEnabled', value)} 
        />
      </View>

      <View style={styles.row}>
        <View style={styles.labelContainer}>
          <Text style={styles.label}>Vibration</Text>
          <Text style={styles.description}>Vibrate on earthquake alerts</Text>
        </View>
        <Switch 
          value={settings.vibrationEnabled} 
          onValueChange={(value) => updateSetting('vibrationEnabled', value)} 
        />
      </View>

      <Text style={styles.info}>About | Privacy Policy | Logout</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 24, marginTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12, marginTop: 8, color: '#555' },
  row: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    marginBottom: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  labelContainer: { flex: 1, marginRight: 12 },
  label: { fontSize: 16, fontWeight: '500', marginBottom: 4 },
  description: { fontSize: 13, color: '#888' },
  info: { marginTop: 32, color: '#888', textAlign: 'center' },
});
