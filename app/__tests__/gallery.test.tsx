import { render } from '@testing-library/react-native';
import Gallery from '../gallery';

// expo-blur is mocked globally in jest-setup.ts
test('Gallery renders without throwing', async () => {
  expect(() => render(<Gallery />)).not.toThrow();
});
