import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import { API_BASE_URL } from '../../lib/api';
import AsyncStorage from '../../lib/storage';
import { registerDeviceToken } from '../../lib/pushToken';

type Profile = {
  id?: number;
  full_name?: string;
  username?: string;
  email?: string;
  phone?: string;
  phone_number?: string;
};

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  const getToken = async () => {
    const accessToken = await AsyncStorage.getItem('accessToken');
    if (accessToken) return accessToken;

    // Backward compatibility for previously stored token keys.
    return await AsyncStorage.getItem('token');
  };

  const fetchProfile = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    setError(null);

    try {
      const token = await getToken();

      if (!token) {
        setIsAuthenticated(false);
        setProfile(null);
        return;
      }

      setIsAuthenticated(true);

      // Best-effort background token registration for sessions restored from storage.
      registerDeviceToken(token).catch((err) => {
        console.warn('Push token registration skipped from profile sync:', err);
      });

      const response = await fetch(`${API_BASE_URL}/api/accounts/profile/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        await AsyncStorage.removeItem('accessToken');
        await AsyncStorage.removeItem('refreshToken');
        setIsAuthenticated(false);
        setProfile(null);
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to load profile (${response.status})`);
      }

      const data: Profile = await response.json();
      setProfile(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unexpected error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('refreshToken');
    setProfile(null);
    setIsAuthenticated(false);
    Alert.alert('Logged out', 'Your session has been cleared.');
    router.replace('/(auth)/login');
  };

  const emailFallback = profile?.email?.split('@')[0]?.trim();
  const displayName =
    profile?.full_name?.trim() ||
    profile?.username?.trim() ||
    emailFallback ||
    'User';

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.subtle}>Loading profile...</Text>
        </View>
      );
    }

    if (!isAuthenticated) {
      return (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Session expired</Text>
          <Text style={styles.cardText}>Please log in again to view your profile.</Text>
          <TouchableOpacity style={styles.button} onPress={() => router.replace('/(auth)/login')}>
            <Text style={styles.buttonText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Something went wrong</Text>
          <Text style={styles.cardText}>{error}</Text>
          <TouchableOpacity style={styles.button} onPress={() => fetchProfile()}>
            <Text style={styles.buttonText}>Try again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.card}>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.row}>Username: {profile?.username || '-'}</Text>
        <Text style={styles.row}>Email: {profile?.email || '-'}</Text>
        <Text style={styles.row}>Phone: {profile?.phone_number || profile?.phone || '-'}</Text>

        <TouchableOpacity style={styles.buttonSecondary} onPress={handleLogout}>
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#120000', '#2b0000', '#df0000']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchProfile(true)}
            tintColor="#fff"
          />
        }
      >
        <View style={styles.titleWrap}>
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.subtitle}>Account And Session Details</Text>
        </View>

        {renderContent()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  titleWrap: {
    marginBottom: 60,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 56,
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'center',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  centered: {
    alignItems: 'center',
    marginTop: 40,
    gap: 10,
  },
  subtle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    backgroundColor: 'rgba(31, 0, 0, 0.36)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    padding: 16,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  cardText: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  name: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 10,
  },
  row: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  button: {
    marginTop: 14,
    backgroundColor: '#ffffff22',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonSecondary: {
    marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
});
