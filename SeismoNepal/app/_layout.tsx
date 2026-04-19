import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* This will automatically include index, welcome, login, and (tabs) */}
    </Stack>
  );
}
