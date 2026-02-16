import React from 'react';
import { Button, Image, StyleSheet, Text, TextInput, View } from 'react-native';

export default function ProfileScreen() {
  const [name, setName] = React.useState('User Name');
  const [email, setEmail] = React.useState('user@email.com');
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Image source={require('../assets/images/icon.png')} style={styles.avatar} />
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Name"
      />
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        keyboardType="email-address"
      />
      <Button title="Save" onPress={() => {}} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', backgroundColor: '#fff', padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 16 },
  input: { width: '100%', maxWidth: 320, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 12 },
});
