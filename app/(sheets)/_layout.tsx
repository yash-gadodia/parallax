import { Stack } from 'expo-router';

export default function SheetsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: 'transparentModal',
      }}
    >
      <Stack.Screen name="share" />
      <Stack.Screen name="plus" />
      <Stack.Screen name="spice" />
    </Stack>
  );
}
