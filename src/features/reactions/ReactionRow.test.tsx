import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ReactionRow from './ReactionRow';

jest.mock('../../lib/haptics', () => ({
  selection: jest.fn(() => Promise.resolve()),
  lightTick: jest.fn(() => Promise.resolve()),
  success: jest.fn(() => Promise.resolve()),
  celebration: jest.fn(() => Promise.resolve()),
}));

import * as haptics from '../../lib/haptics';

const mockSelection = haptics.selection as jest.Mock;

describe('ReactionRow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders exactly the 4 tap-once emojis', async () => {
    const { getByText } = await render(
      <ReactionRow
        promptId="p1"
        myEmoji={null}
        partnerEmoji={null}
        partnerName="Dani"
        onReact={jest.fn()}
      />
    );
    expect(getByText('🥹')).toBeOnTheScreen();
    expect(getByText('😂')).toBeOnTheScreen();
    expect(getByText('❤️')).toBeOnTheScreen();
    expect(getByText('👀')).toBeOnTheScreen();
  });

  it('tapping an emoji fires the upsert callback AND a light haptic', async () => {
    const onReact = jest.fn();
    const { getByLabelText } = await render(
      <ReactionRow
        promptId="p1"
        myEmoji={null}
        partnerEmoji={null}
        partnerName="Dani"
        onReact={onReact}
      />
    );

    fireEvent.press(getByLabelText('React 😂'));

    expect(onReact).toHaveBeenCalledTimes(1);
    expect(onReact).toHaveBeenCalledWith('p1', '😂');
    expect(mockSelection).toHaveBeenCalledTimes(1);
  });

  it('marks my reaction as selected and the others not', async () => {
    const { getByLabelText } = await render(
      <ReactionRow
        promptId="p1"
        myEmoji="❤️"
        partnerEmoji={null}
        partnerName="Dani"
        onReact={jest.fn()}
      />
    );
    expect(getByLabelText('React ❤️')).toBeSelected();
    expect(getByLabelText('React 🥹')).not.toBeSelected();
    expect(getByLabelText('React 😂')).not.toBeSelected();
    expect(getByLabelText('React 👀')).not.toBeSelected();
  });

  it("shows the partner's reaction with their name beside mine when present", async () => {
    const { getAllByText, getByText } = await render(
      <ReactionRow
        promptId="p1"
        myEmoji="😂"
        partnerEmoji="❤️"
        partnerName="Dani"
        onReact={jest.fn()}
      />
    );
    // ❤️ appears twice: once as a tappable option, once as the partner chip.
    expect(getAllByText('❤️')).toHaveLength(2);
    expect(getByText('Dani')).toBeOnTheScreen();
  });

  it('renders no partner chip when the partner has not reacted', async () => {
    const { queryByText, getAllByText } = await render(
      <ReactionRow
        promptId="p1"
        myEmoji="😂"
        partnerEmoji={null}
        partnerName="Dani"
        onReact={jest.fn()}
      />
    );
    expect(queryByText('Dani')).toBeNull();
    expect(getAllByText('❤️')).toHaveLength(1);
  });
});
