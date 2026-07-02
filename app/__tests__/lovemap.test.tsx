import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import LovemapScreen from '../lovemap';

const SAMPLE_LEARNING = {
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
};

const mockUseLearnings = jest.fn();
jest.mock('../../src/features/lovemap/useLearnings', () => ({
  useLearnings: () => mockUseLearnings(),
}));

jest.mock('../../src/lib/nav', () => ({
  safeBack: jest.fn(),
}));

describe('LovemapScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLearnings.mockReturnValue({
      items: [SAMPLE_LEARNING],
      loading: false,
      isSample: true,
      error: null,
      refetch: jest.fn(),
    });
  });

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

  it('never renders the decorative mastery meter (no producer increments it)', async () => {
    const { queryByText } = await render(<LovemapScreen />);

    expect(queryByText('just learned')).toBeNull();
    expect(queryByText('getting it')).toBeNull();
    expect(queryByText('second nature')).toBeNull();
    expect(queryByText("you've got this")).toBeNull();
  });

  it('shows skeleton cards (not the empty state) while learnings load', async () => {
    mockUseLearnings.mockReturnValue({
      items: [],
      loading: true,
      isSample: false,
      error: null,
      refetch: jest.fn(),
    });
    const { getAllByTestId, queryByText } = await render(<LovemapScreen />);

    expect(getAllByTestId('lovemap-skeleton-card')).toHaveLength(2);
    expect(queryByText('Nothing learned yet')).toBeNull();
    expect(queryByText(/the map ·/)).toBeNull();
  });

  it('shows the warm retryable error state when the fetch fails', async () => {
    const refetch = jest.fn();
    mockUseLearnings.mockReturnValue({
      items: [],
      loading: false,
      isSample: false,
      error: new Error('boom'),
      refetch,
    });
    const { getByText, queryByText } = await render(<LovemapScreen />);

    expect(getByText("hmm, that didn't load")).toBeTruthy();
    expect(getByText("Your map is safe — we just couldn't reach it.")).toBeTruthy();
    expect(queryByText('Nothing learned yet')).toBeNull();

    fireEvent.press(getByText('try again'));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('keeps the honest empty state for a real couple with nothing learned yet', async () => {
    mockUseLearnings.mockReturnValue({
      items: [],
      loading: false,
      isSample: false,
      error: null,
      refetch: jest.fn(),
    });
    const { getByText } = await render(<LovemapScreen />);

    expect(getByText('Nothing learned yet')).toBeTruthy();
    expect(getByText('the map · 0 learnings')).toBeTruthy();
  });
});
