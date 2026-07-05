import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import EscalationCard from './EscalationCard';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage');
jest.mock('react-native/Libraries/Linking/Linking');

describe('EscalationCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  it('renders the card with headline and body text', async () => {
    const { getByText } = await render(<EscalationCard sessionCount={3} />);

    expect(getByText(/You two keep showing up/)).toBeTruthy();
    expect(getByText(/Noticing you've refocused/)).toBeTruthy();
  });

  it('displays both counselling links', async () => {
    const { getByText } = await render(<EscalationCard sessionCount={3} />);

    expect(getByText(/Community Psychology Hub/)).toBeTruthy();
    expect(getByText(/Family Service Centres/)).toBeTruthy();
  });

  it('renders a dismiss button', async () => {
    const { getByText } = await render(<EscalationCard sessionCount={3} />);

    expect(getByText('Not now')).toBeTruthy();
  });

  it('dismisses when the button is pressed', async () => {
    const { getByText, queryByText } = await render(
      <EscalationCard sessionCount={3} />
    );

    const dismissBtn = getByText('Not now');
    await act(async () => {
      fireEvent.press(dismissBtn);
    });
    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'refocus-escalation-dismissed-3',
        'true'
      );
    });

    await waitFor(() => {
      expect(queryByText(/You two keep showing up/)).toBeNull();
    });
  });

  it('stores dismissal in AsyncStorage with the correct key', async () => {
    const { getByText } = await render(<EscalationCard sessionCount={3} />);

    const dismissBtn = getByText('Not now');
    await act(async () => {
      fireEvent.press(dismissBtn);
    });
    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'refocus-escalation-dismissed-3',
        'true'
      );
    });
  });

  it('does not render when already dismissed', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('true');

    const { queryByText } = await render(
      <EscalationCard sessionCount={3} />
    );

    await waitFor(() => {
      expect(queryByText(/You two keep showing up/)).toBeNull();
    });
  });

  it('calls onDismiss callback when dismissed', async () => {
    const onDismiss = jest.fn();
    const { getByText } = await render(
      <EscalationCard sessionCount={3} onDismiss={onDismiss} />
    );

    const dismissBtn = getByText('Not now');
    await act(async () => {
      fireEvent.press(dismissBtn);
    });
    await waitFor(() => {
      expect(onDismiss).toHaveBeenCalled();
    });
  });

  it('uses different dismissal keys for different session counts', async () => {
    const { getByText, rerender } = await render(
      <EscalationCard sessionCount={3} />
    );

    const dismissBtn = getByText('Not now');
    await act(async () => {
      fireEvent.press(dismissBtn);
    });
    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'refocus-escalation-dismissed-3',
        'true'
      );
    });

    // Reset the mock
    (AsyncStorage.setItem as jest.Mock).mockClear();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

    // Re-render with a different count
    const { getByText: getByText2 } = await render(
      <EscalationCard sessionCount={4} />
    );

    const dismissBtn2 = getByText2('Not now');
    await act(async () => {
      fireEvent.press(dismissBtn2);
    });
    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'refocus-escalation-dismissed-4',
        'true'
      );
    });
  });
});
