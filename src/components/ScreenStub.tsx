import { Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { gradients } from '../design/tokens';

interface ScreenStubProps {
  label: string;
}

function ScreenStubInner({ label }: ScreenStubProps) {
  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.label}>{label}</Text>
    </SafeAreaView>
  );
}

export function ScreenStub({ label }: ScreenStubProps) {
  const colors = gradients.dawn.colors as unknown as readonly [string, string, string];
  const locations = gradients.dawn.locations as unknown as readonly [number, number, number];

  return (
    <LinearGradient
      colors={colors}
      locations={locations}
      style={styles.container}
    >
      <ScreenStubInner label={label} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fallback: {
    flex: 1,
    backgroundColor: '#FCEFF0',
  },
  safe: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 24,
    fontWeight: '600',
    color: '#3A3340',
  },
});
