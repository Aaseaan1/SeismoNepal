import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SettingsManager, Settings } from '@/lib/settings';
import { AlertService } from '@/lib/alerts';

const SettingScreen: React.FC = () => {
  const [vibration, setVibration] = useState(false);
  const [shake, setShake] = useState(false);
  const [sound, setSound] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await SettingsManager.loadSettings();
      setVibration(settings.vibrationEnabled);
      setShake(settings.shakeEnabled);
      setSound(settings.soundEnabled);
      await AlertService.initialize();
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVibrationChange = async (value: boolean) => {
    setVibration(value);
    await SettingsManager.updateSetting('vibrationEnabled', value);
    // Test vibration when enabled
    if (value) {
      await AlertService.testVibration();
    }
  };

  const handleShakeChange = async (value: boolean) => {
    setShake(value);
    await SettingsManager.updateSetting('shakeEnabled', value);
  };

  const handleSoundChange = async (value: boolean) => {
    setSound(value);
    await SettingsManager.updateSetting('soundEnabled', value);
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <LinearGradient
          colors={['#000000', '#ff0000']}
          style={styles.gradient}
        />
        <ActivityIndicator size="large" color="#ff0000" />
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#000000', '#ff0000']}
        style={styles.gradient}
      />
      <Text style={styles.textTop}>System Preference</Text>
      <View style={{flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginTop:24, width:250, alignSelf:'center'}}>
        <Text style={{color:'#fff', fontSize:16, fontWeight:'500'}}>Activate Vibration</Text>
        <Switch
          value={vibration}
          onValueChange={handleVibrationChange}
          trackColor={{ false: '#888', true: '#fff' }}
          thumbColor={vibration ? '#ff0000' : '#ccc'}
        />
      </View>
      <View style={{flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginTop:16, width:250, alignSelf:'center'}}>
        <Text style={{color:'#fff', fontSize:16, fontWeight:'500'}}>Activate Shake</Text>
        <Switch
          value={shake}
          onValueChange={handleShakeChange}
          trackColor={{ false: '#888', true: '#fff' }}
          thumbColor={shake ? '#ff0000' : '#ccc'}
        />
      </View>
      <View style={{flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginTop:16, width:250, alignSelf:'center'}}>
        <Text style={{color:'#fff', fontSize:16, fontWeight:'500'}}>Activate Sound</Text>
        <Switch
          value={sound}
          onValueChange={handleSoundChange}
          trackColor={{ false: '#888', true: '#fff' }}
          thumbColor={sound ? '#ff0000' : '#ccc'}
        />
      </View>
      <Text style={{color:'#fff', fontSize:15, fontWeight:'500', marginTop:32, textAlign:'center'}}>Version: 1.0</Text>
      <Text style={{color:'#fff', fontSize:15, fontWeight:'500', marginTop:8, textAlign:'center'}}>Developer: Aaseaan Siwakoti</Text>
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
  textTop: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 75,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 0,
    marginBottom: 16,
  },
  prefBox: {
    width: 90,
    height: 50,
    borderWidth: 1,
    borderColor: '#fff',
    borderRadius: 8,
    marginHorizontal: 8,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SettingScreen;