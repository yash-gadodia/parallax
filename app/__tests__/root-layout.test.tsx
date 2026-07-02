import { render } from '@testing-library/react-native';
import RootLayout from '../_layout';

jest.mock('../../src/design/fonts', () => ({
  useAppFonts: jest.fn(),
}));

// GestureHandlerRootView calls the native install() (absent in jest) — render
// it as a plain View so the full layout tree mounts.
jest.mock('react-native-gesture-handler', () => {
  const { View } = jest.requireActual('react-native');
  return { GestureHandlerRootView: View };
});

import { useAppFonts } from '../../src/design/fonts';

const mockUseAppFonts = useAppFonts as jest.Mock;

describe('root layout cold start', () => {
  it('renders the branded loading frame (never a blank frame) while fonts load', async () => {
    mockUseAppFonts.mockReturnValue(false);

    const { getByTestId, toJSON } = await render(<RootLayout />);

    expect(getByTestId('branded-loading')).toBeOnTheScreen();
    expect(toJSON()).not.toBeNull();
  });

  it('renders the app stack (no loading frame) once fonts are ready', async () => {
    mockUseAppFonts.mockReturnValue(true);

    const { queryByTestId } = await render(<RootLayout />);

    expect(queryByTestId('branded-loading')).toBeNull();
  });
});
