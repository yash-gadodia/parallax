try {
  require('react-native-reanimated').setUpTests?.();
} catch (e) {
  // Ignore errors from reanimated setup in test environment
}
