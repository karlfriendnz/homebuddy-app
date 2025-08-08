import { Stack } from 'expo-router';

export default function SettingsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: 'Settings' }} />
      <Stack.Screen name="household" options={{ title: 'Household Settings' }} />
      <Stack.Screen name="profile" options={{ title: 'Profile Settings' }} />
    </Stack>
  );
}
