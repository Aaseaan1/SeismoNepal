import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

export default function WelcomeScreen() {
  const router = useRouter();

  const handleLanguageSelect = (language: string) => {
    // Navigate to login screen
    router.replace('/login');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#000000', '#ff0000']}
        style={styles.gradient}
      />
      <Text style={styles.splashText}>Welcome To SeismoNepal</Text>
      <Text style={styles.languageSubtitle}>Choose Language</Text>
      <View style={styles.rowContainer}>
        <Pressable style={styles.languageBox} onPress={() => handleLanguageSelect('English')}> 
          <Text style={styles.languageText}>English</Text>
        </Pressable>
        <Pressable style={styles.languageBox} onPress={() => handleLanguageSelect('Nepali')}>
          <Text style={styles.languageText}>Nepali</Text>
        </Pressable>
      </View>
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
  splashText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  languageSubtitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 16,
  },
  rowContainer: {
    flexDirection: 'row',
    marginTop: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  languageBox: {
    width: 100,
    height: 50,
    borderWidth: 1,
    borderColor: '#fff',
    borderRadius: 8,
    marginHorizontal: 8,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  languageText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
