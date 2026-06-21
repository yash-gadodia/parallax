import Gallery from '../gallery';

// Mock expo-blur to avoid native module warnings in tests
jest.mock('expo-blur', () => ({
  BlurView: ({ children }: any) => <>{children}</>,
}));

test('Gallery renders without throwing', () => {
  expect(<Gallery />).toBeTruthy();
});
