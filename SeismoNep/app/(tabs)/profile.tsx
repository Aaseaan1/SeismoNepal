import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#000000', '#ff0000']}
        style={styles.gradient}
      />
      <View style={{justifyContent: 'center', alignItems: 'center', position: 'relative'}}>
        <Ionicons name="person-circle" size={200} color="#fff" />
        <View style={styles.plusIconContainer}>
          <Ionicons name="add-circle" size={48} color="#ff0000" />
        </View>
      </View>
      <View style={styles.verticalContainerWrapper}>
        <Pressable style={styles.verticalBox} onPress={() => navigation.navigate('CreateAccount')}>
          <Text style={styles.boxText}>SIGNUP</Text>
        </Pressable>
        <View style={styles.verticalBox}>
          <Text style={styles.boxText}>LOGIN</Text>
        </View>
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
  verticalContainerWrapper: {
    marginTop: 32,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verticalBox: {
    width: 250,
    height: 60,
    borderWidth: 1,
    borderColor: '#fff',
    borderRadius: 10,
    marginVertical: 8,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  boxText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  plusIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
});