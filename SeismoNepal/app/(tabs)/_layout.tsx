import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#ff0000',
        tabBarInactiveTintColor: '#666',
      }}
    />
  );
}
