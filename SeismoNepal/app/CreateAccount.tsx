import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native'; // Add this import

const labels = [
  'Full Name',
  'Age',
  'DOB',
  'Address',
  'Phone No',
];

export default function CreateAccount() {
  const navigation = useNavigation<any>(); // Add <any> to fix TS error

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#000000', '#ff0000']}
        style={styles.gradient}
      />
      <Text style={styles.title}>Create Account</Text>
      <Ionicons
        name="person-circle"
        size={100}
        color="#fff"
        style={styles.icon}
      />
      <View style={styles.boxContainer}>
        {labels.map((label, i) => (
          <TextInput
            key={i}
            placeholder={label}
            placeholderTextColor="#fff"
            style={styles.input}
          />
        ))}
      </View>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('LoggedIn')} // Update this line
      >
        <Text style={styles.buttonText}>Save</Text>
      </TouchableOpacity>
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
  icon: {
    marginTop: 24,
    marginBottom: 24,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  boxContainer: {
    width: '50%',
    marginTop: 16,
    marginBottom: 24,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    color: '#fff',
    paddingHorizontal: 12,
    backgroundColor: 'transparent',
    textAlign: 'center', 
  },
  button: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 40,
    borderRadius: 8,
    marginTop: 12,
  },
  buttonText: {
    color: '#ff0000',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
