import React from 'react';
import { render } from '@testing-library/react-native';
import UsScreen from '../us';

jest.mock('../../../src/features/lovemap/useLearnings', () => ({
  useLearnings: jest.fn(() => ({
    items: [],
    isSample: true,
  })),
}));

jest.mock('../../../src/features/lovemap/useCoupleHistory', () => ({
  useCoupleHistory: jest.fn(() => ({
    history: [],
    isSample: true,
  })),
}));

describe('UsScreen', () => {
  it('renders the couple name', async () => {
    const { getByText } = await render(<UsScreen />);
    expect(getByText('Yash & Dani')).toBeTruthy();
  });

  it('renders the love map card title', async () => {
    const { getByText } = await render(<UsScreen />);
    expect(getByText('Your Love Map')).toBeTruthy();
  });

  it('renders the wavelength section', async () => {
    const { getByText } = await render(<UsScreen />);
    expect(getByText('LAST 7 DROPS')).toBeTruthy();
  });

  it('renders a stat card', async () => {
    const { getByText } = await render(<UsScreen />);
    expect(getByText('answered')).toBeTruthy();
  });

  it('renders the drop history label', async () => {
    const { getByText } = await render(<UsScreen />);
    expect(getByText('your drop history')).toBeTruthy();
  });
});
