import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import TopBar from './TopBar';
import TabBar from './TabBar';

// Mock expo-blur to avoid warnings in tests
jest.mock('expo-blur', () => ({
  BlurView: ({ children, ...props }: any) => <>{children}</>,
}));

// Mock useSafeAreaInsets to provide default values
jest.mock('react-native-safe-area-context', () => ({
  ...jest.requireActual('react-native-safe-area-context'),
  useSafeAreaInsets: () => ({
    top: 48,
    bottom: 0,
    left: 0,
    right: 0,
  }),
}));

describe('TopBar', () => {
  it('renders the title', async () => {
    const { getByText } = await render(
      <TopBar title="LOVE MAP" onBack={() => {}} />
    );
    expect(getByText('LOVE MAP')).toBeTruthy();
  });

  it('calls onBack when the back button is pressed', async () => {
    const mockOnBack = jest.fn();
    const { getByTestId } = await render(
      <TopBar title="LOVE MAP" onBack={mockOnBack} />
    );
    const backButton = getByTestId('topbar-back');
    fireEvent.press(backButton);
    expect(mockOnBack).toHaveBeenCalled();
  });
});

describe('TabBar', () => {
  it('renders all three tab labels', async () => {
    const { getByText } = await render(
      <TabBar active="home" go={() => {}} />
    );
    expect(getByText('Today')).toBeTruthy();
    expect(getByText('Refocus')).toBeTruthy();
    expect(getByText('Us')).toBeTruthy();
  });

  it('calls go with the correct tab name when pressed', async () => {
    const mockGo = jest.fn();
    const { getByText } = await render(
      <TabBar active="home" go={mockGo} />
    );
    const usTab = getByText('Us');
    if (usTab.parent) {
      fireEvent.press(usTab.parent);
    }
    expect(mockGo).toHaveBeenCalledWith('us');
  });
});
