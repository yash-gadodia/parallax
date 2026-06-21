module.exports = {
  useSharedValue: jest.fn((initialValue) => ({
    value: initialValue,
  })),
  useAnimatedStyle: jest.fn((callback) => ({})),
  withTiming: jest.fn((targetValue, config) => targetValue),
  Easing: {
    bezier: jest.fn(() => ({})),
    linear: jest.fn(() => ({})),
  },
  Animated: {
    View: require('react-native').View,
  },
  setUpTests: jest.fn(),
};
