import { render } from '@testing-library/react-native';
import Gallery from '../gallery';

// Mock expo-blur to avoid native module warnings in tests
jest.mock('expo-blur', () => ({
  BlurView: ({ children }: any) => <>{children}</>,
}));

test('Gallery renders without throwing', async () => {
  expect(() => render(<Gallery />)).not.toThrow();
});
