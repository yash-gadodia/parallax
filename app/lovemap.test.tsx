import React from 'react';
import { render } from '@testing-library/react-native';
import LovemapScreen from './lovemap';

jest.mock('../src/features/lovemap/useLearnings', () => ({
  useLearnings: jest.fn(() => ({
    items: [
      {
        id: 'chosen',
        couple_id: '',
        about: 'partner',
        emoji: '🤍',
        need: 'Feels chosen when plans are locked in early',
        detail: 'Open-ended weekends read as "I\'m not a priority."',
        source: 'refocus',
        origin: 'the Saturday silence',
        mastery: 0,
        became_prompt_id: 'prompt-chosen',
        became_question: 'When the weekend\'s wide open, what\'s one small thing that makes Dani feel chosen?',
        created_at: new Date().toISOString(),
      },
    ],
    loading: false,
    isSample: true,
    error: null,
  })),
}));

jest.mock('../src/lib/nav', () => ({
  safeBack: jest.fn(),
}));

describe('LovemapScreen', () => {
  it('renders the love map heading and hero copy', async () => {
    const { getByText } = await render(<LovemapScreen />);

    expect(getByText(/What you're learning/)).toBeTruthy();
    expect(getByText(/about each other/)).toBeTruthy();
  });

  it('renders the parallax loop section', async () => {
    const { getByText } = await render(<LovemapScreen />);

    expect(getByText('the parallax loop')).toBeTruthy();
    expect(getByText('A fight becomes a lesson.')).toBeTruthy();
  });

  it('renders learning cards when learnings exist', async () => {
    const { getByText } = await render(<LovemapScreen />);

    expect(getByText('Feels chosen when plans are locked in early')).toBeTruthy();
  });

  it('renders the refocus button', async () => {
    const { getByText } = await render(<LovemapScreen />);

    expect(getByText('Refocus something')).toBeTruthy();
  });
});
