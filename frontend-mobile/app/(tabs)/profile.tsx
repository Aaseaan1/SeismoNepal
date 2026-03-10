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
import { useFocusEffect } from '@react-navigation/native';

import { API_BASE_URL } from '../../lib/api';
import AsyncStorage from '../../lib/storage';
import { registerDeviceToken } from '../../lib/pushToken';

const LANGUAGE_KEY = 'appLanguage';

type Profile = {
  id?: number;
  full_name?: string;
  date_of_birth?: string;
  address?: string;
  sex?: string;
  district?: string;
  province?: string;
  state_no?: string;
  blood_group?: string;
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
  const [language, setLanguage] = useState<'en' | 'ne'>('en');

  useFocusEffect(
    useCallback(() => {
      const loadLanguage = async () => {
        try {
          const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
          if (savedLanguage === 'en' || savedLanguage === 'ne') {
            setLanguage(savedLanguage);
          }
        } catch (loadError) {
          console.warn('Failed to load language preference:', loadError);
        }
      };

      void loadLanguage();
    }, [])
  );

  const t = {
    loading: language === 'ne' ? 'प्रोफाइल लोड हुँदैछ...' : 'Loading profile...',
    sessionExpired: language === 'ne' ? 'सेसन समाप्त भयो' : 'Session expired',
    relogin: language === 'ne' ? 'प्रोफाइल हेर्न फेरि लगइन गर्नुहोस्।' : 'Please log in again to view your profile.',
    goToLogin: language === 'ne' ? 'लगइनमा जानुहोस्' : 'Go to Login',
    somethingWrong: language === 'ne' ? 'केही समस्या भयो' : 'Something went wrong',
    tryAgain: language === 'ne' ? 'फेरि प्रयास गर्नुहोस्' : 'Try again',
    username: language === 'ne' ? 'प्रयोगकर्ता नाम' : 'Username',
    fullName: language === 'ne' ? 'पुरा नाम' : 'Full Name',
    dob: language === 'ne' ? 'जन्म मिति' : 'DOB',
    address: language === 'ne' ? 'ठेगाना' : 'Address',
    sex: language === 'ne' ? 'लिङ्ग' : 'Sex',
    district: language === 'ne' ? 'जिल्ला' : 'District',
    province: language === 'ne' ? 'प्रदेश' : 'Province',
    stateNo: language === 'ne' ? 'राज्य नं' : 'State No',
    bloodGroup: language === 'ne' ? 'रक्त समूह' : 'Blood Group',
    email: language === 'ne' ? 'इमेल' : 'Email',
    phone: language === 'ne' ? 'फोन' : 'Phone',
    logout: language === 'ne' ? 'लगआउट' : 'Logout',
    title: language === 'ne' ? 'प्रोफाइल' : 'Profile',
    subtitle: language === 'ne' ? 'खाता र सेसन विवरण' : 'Account And Session Details',
    loggedOutTitle: language === 'ne' ? 'लगआउट भयो' : 'Logged out',
    loggedOutMessage: language === 'ne' ? 'तपाईंको सेसन हटाइएको छ।' : 'Your session has been cleared.',
    user: language === 'ne' ? 'प्रयोगकर्ता' : 'User',
  };

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
    Alert.alert(t.loggedOutTitle, t.loggedOutMessage);
    router.replace('/(auth)/login');
  };

  const emailFallback = profile?.email?.split('@')[0]?.trim();
  const displayName =
    profile?.full_name?.trim() ||
    profile?.username?.trim() ||
    emailFallback ||
    t.user;

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.subtle}>{t.loading}</Text>
        </View>
      );
    }

    if (!isAuthenticated) {
      return (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t.sessionExpired}</Text>
          <Text style={styles.cardText}>{t.relogin}</Text>
          <TouchableOpacity style={styles.button} onPress={() => router.replace('/(auth)/login')}>
            <Text style={styles.buttonText}>{t.goToLogin}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t.somethingWrong}</Text>
          <Text style={styles.cardText}>{error}</Text>
          <TouchableOpacity style={styles.button} onPress={() => fetchProfile()}>
            <Text style={styles.buttonText}>{t.tryAgain}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.card}>
        <Text style={styles.row}>{`${t.fullName}: ${profile?.full_name || '-'}`}</Text>
        <Text style={styles.row}>{`${t.dob}: ${profile?.date_of_birth || '-'}`}</Text>
        <Text style={styles.row}>{`${t.username}: ${profile?.username || '-'}`}</Text>
        <Text style={styles.row}>{`${t.address}: ${profile?.address || '-'}`}</Text>
        <Text style={styles.row}>{`${t.sex}: ${profile?.sex || '-'}`}</Text>
        <Text style={styles.row}>{`${t.district}: ${profile?.district || '-'}`}</Text>
        <Text style={styles.row}>{`${t.province}: ${profile?.province || '-'}`}</Text>
        <Text style={styles.row}>{`${t.stateNo}: ${profile?.state_no || '-'}`}</Text>
        <Text style={styles.row}>{`${t.bloodGroup}: ${profile?.blood_group || '-'}`}</Text>
        <Text style={styles.row}>{`${t.email}: ${profile?.email || '-'}`}</Text>
        <Text style={styles.row}>{`${t.phone}: ${profile?.phone_number || profile?.phone || '-'}`}</Text>

        <TouchableOpacity style={styles.buttonSecondary} onPress={handleLogout}>
          <Text style={styles.buttonText}>{t.logout}</Text>
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
          <Text style={styles.title}>{t.title}</Text>
          <Text style={styles.subtitle}>{t.subtitle}</Text>
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
