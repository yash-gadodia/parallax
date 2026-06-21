import { Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  let LinearGradient: any;
  try {
    LinearGradient = require('expo-linear-gradient').default;
  } catch {
    LinearGradient = null;
  }

  if (LinearGradient) {
    return (
      <LinearGradient
        colors={gradients.dawn.colors}
        locations={gradients.dawn.locations}
        style={styles.container}
      >
        <ScreenStubInner label={label} />
      </LinearGradient>
    );
  }

  return (
    <View style={styles.fallback}>
      <ScreenStubInner label={label} />
    </View>
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
