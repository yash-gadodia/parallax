import React from 'react';
import { render } from '@testing-library/react-native/pure';
import ThreadScreen from '../thread';

describe('ThreadScreen', () => {
  it('renders the thread UI with title, prompt context, and messages', async () => {
    const { getByText, getByPlaceholderText } = await render(<ThreadScreen />);

    // TopBar title
    expect(getByText('talk about it')).toBeTruthy();

    // Pinned prompt context (DROP code + question)
    expect(getByText('TODAY · the answer you\'re on')).toBeTruthy();
    expect(getByText('Our perfect Friday night?')).toBeTruthy();

    // Initial thread message from THREAD.msgs
    expect(
      getByText(
        'cozy night in?? since when 😭 you wanted to go OUT last week'
      )
    ).toBeTruthy();

    // TextInput placeholder
    expect(getByPlaceholderText('say something…')).toBeTruthy();
  });
});
