import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import Sheet from './Sheet';
import Toast from './Toast';
import { useUiStore } from '../store/ui';

// Mock BlurView for tests
jest.mock('expo-blur', () => ({
  BlurView: ({ children }: any) => children,
}));

describe('Sheet', () => {
  test('Sheet renders with title and children', async () => {
    const onClose = jest.fn();
    const { getByText } = await render(
      <Sheet title="Test Sheet" onClose={onClose}>
        <Text>Sheet content</Text>
      </Sheet>
    );
    expect(getByText('Test Sheet')).toBeTruthy();
    expect(getByText('Sheet content')).toBeTruthy();
  });

  test('Sheet backdrop press calls onClose', async () => {
    const onClose = jest.fn();
    const { getByTestId } = await render(
      <Sheet onClose={onClose}>
        <Text>Sheet content</Text>
      </Sheet>
    );
    fireEvent.press(getByTestId('sheet-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('Sheet renders without title', async () => {
    const onClose = jest.fn();
    const { queryByText } = await render(
      <Sheet onClose={onClose}>
        <Text>Sheet content</Text>
      </Sheet>
    );
    expect(queryByText('Test Sheet')).toBeFalsy();
  });
});

describe('Toast', () => {
  test('Toast renders with message', async () => {
    const { getByText } = await render(<Toast msg="Hello Toast" />);
    expect(getByText('Hello Toast')).toBeTruthy();
  });
});

describe('useUiStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    useUiStore.setState({ toast: null, sheet: null });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('fireToast sets toast and clears after 1900ms', async () => {
    const { fireToast } = useUiStore.getState();
    fireToast('test message');

    expect(useUiStore.getState().toast).toBe('test message');

    jest.advanceTimersByTime(1900);

    expect(useUiStore.getState().toast).toBe(null);
  });

  test('openSheet sets sheet state', () => {
    const { openSheet } = useUiStore.getState();
    openSheet('test-sheet');
    expect(useUiStore.getState().sheet).toBe('test-sheet');
  });

  test('closeSheet clears sheet state', () => {
    const { openSheet, closeSheet } = useUiStore.getState();
    openSheet('test-sheet');
    expect(useUiStore.getState().sheet).toBe('test-sheet');
    closeSheet();
    expect(useUiStore.getState().sheet).toBe(null);
  });

  test('fireToast clears prior timer if called again', () => {
    const { fireToast } = useUiStore.getState();
    fireToast('first');
    expect(useUiStore.getState().toast).toBe('first');

    jest.advanceTimersByTime(900);

    fireToast('second');
    expect(useUiStore.getState().toast).toBe('second');

    jest.advanceTimersByTime(900);
    expect(useUiStore.getState().toast).toBe('second');

    jest.advanceTimersByTime(1000);
    expect(useUiStore.getState().toast).toBe(null);
  });
});
