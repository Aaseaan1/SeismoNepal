import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';

const safetyTips = [
  { id: '1', title: 'Drop, Cover, and Hold On', content: 'During an earthquake, get under a sturdy table and hold on until shaking stops.' },
  { id: '2', title: 'Stay Away from Windows', content: 'Move away from glass, windows, and exterior walls.' },
  { id: '3', title: 'Prepare an Emergency Kit', content: 'Have water, food, flashlight, and first aid supplies ready.' },
];

export default function SafetyTipsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Safety Tips</Text>
      <FlatList
        data={safetyTips}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.tipItem}>
            <Text style={styles.tipTitle}>{item.title}</Text>
            <Text style={styles.tipContent}>{item.content}</Text>
          </View>
        )}
        style={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', margin: 16 },
  list: { margin: 16 },
  tipItem: { padding: 12, borderBottomWidth: 1, borderColor: '#eee' },
  tipTitle: { fontSize: 18, fontWeight: 'bold' },
  tipContent: { fontSize: 15, marginTop: 4 },
});
