import React from 'react';
import { Text } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';
import { useJourneys } from './useJourneys';

const mockFrom = jest.fn();
jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

jest.mock('../auth/useSession', () => ({ useSession: jest.fn() }));
jest.mock('../pairing/useCouple', () => ({ useCouple: jest.fn() }));

import { useSession } from '../auth/useSession';
import { useCouple } from '../pairing/useCouple';

const mockUseSession = useSession as jest.Mock;
const mockUseCouple = useCouple as jest.Mock;

interface QueryResult {
  data: unknown;
  error: { message: string } | null;
}

function makeQuery(result: QueryResult) {
  const q: Record<string, unknown> = {};
  for (const m of ['select', 'eq', 'order', 'in']) {
    q[m] = jest.fn(() => q);
  }
  (q as { then: unknown }).then = (
    resolve: (v: QueryResult) => unknown
  ) => Promise.resolve(resolve(result));
  return q;
}

let hookResult: ReturnType<typeof useJourneys>;

function Harness() {
  hookResult = useJourneys();
  const { journeys, loading, isSample, error } = hookResult;
  return (
    <Text>
      {loading
        ? 'loading'
        : error
          ? `error:${error.message}`
          : `${isSample ? 'sample' : 'live'}:${journeys
              .map((j) => `${j.slug}(${j.stageCount})`)
              .join('|')}`}
    </Text>
  );
}

describe('useJourneys', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSession.mockReturnValue({ session: null, loading: false });
    mockUseCouple.mockReturnValue({ couple: null, loading: false });
  });

  it('serves the sample catalog to the demo and never queries', async () => {
    const { getByText } = await render(<Harness />);
    await waitFor(() => expect(getByText('sample:bto(7)')).toBeTruthy());
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('loads the live catalog with real stage counts', async () => {
    mockUseSession.mockReturnValue({ session: { user: { id: 'u1' } }, loading: false });
    mockUseCouple.mockReturnValue({ couple: { id: 'c1' }, loading: false });

    const journeysQuery = makeQuery({
      data: [
        {
          id: 'j1',
          slug: 'bto',
          title: 'the bto journey',
          emoji: '🏠',
          tagline: 'from ballot night to your first morning in it',
          description: 'desc',
        },
      ],
      error: null,
    });
    const stagesQuery = makeQuery({
      data: Array.from({ length: 7 }, () => ({ journey_id: 'j1' })),
      error: null,
    });
    mockFrom
      .mockImplementationOnce(() => journeysQuery)
      .mockImplementationOnce(() => stagesQuery);

    const { getByText } = await render(<Harness />);

    await waitFor(() => expect(getByText('live:bto(7)')).toBeTruthy());
    expect(mockFrom).toHaveBeenNthCalledWith(1, 'journeys');
    expect(mockFrom).toHaveBeenNthCalledWith(2, 'journey_stages');
  });

  it('surfaces an honest error for a live couple — never the sample', async () => {
    mockUseSession.mockReturnValue({ session: { user: { id: 'u1' } }, loading: false });
    mockUseCouple.mockReturnValue({ couple: { id: 'c1' }, loading: false });
    mockFrom.mockImplementationOnce(() =>
      makeQuery({ data: null, error: { message: 'network down' } })
    );

    const { getByText } = await render(<Harness />);

    await waitFor(() => expect(getByText(/error:/)).toBeTruthy());
    expect(hookResult.journeys).toEqual([]);
    expect(hookResult.isSample).toBe(false);
  });
});
