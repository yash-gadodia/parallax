import { Stack } from 'expo-router';
import { useAppFonts } from '../src/design/fonts';

export default function RootLayout() {
  const fontsLoaded = useAppFonts();

  if (!fontsLoaded) {
    return null;
  }

  return <Stack />;
}
