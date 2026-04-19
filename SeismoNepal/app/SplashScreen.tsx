import { View, Text, StyleSheet } from 'react-native';
// @ts-ignore
import { LinearGradient } from 'expo-linear-gradient';

export default function SplashScreen() {
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