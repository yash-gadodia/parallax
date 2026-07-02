import React from 'react';
import { Text } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';
import { usePackSamples } from './usePackSamples';

const mockFrom = jest.fn();
jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

interface QueryResult {
  data: unknown;
  error: { message: string } | null;
}

function makeQuery(result: QueryResult) {
  const q: Record<string, unknown> = {};
  for (const m of ['select', 'eq', 'order']) {
    q[m] = jest.fn(() => q);
  }
  q.limit = jest.fn(() => Promise.resolve(result));
  return q;
}

let hookResult: ReturnType<typeof usePackSamples>;

function Harness({ theme }: { theme: string | null }) {
  hookResult = usePackSamples(theme);
  const { samples, loading, error } = hookResult;
  return (
    <Text>
      {loading ? 'loading' : error ? `error:${error.message}` : `samples:${samples.join('|')}`}
    </Text>
  );
}

describe('usePackSamples', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads the first 3 real catalog questions for a theme', async () => {
    const dropsQuery = makeQuery({ data: [{ id: 'drop-42' }], error: null });
    const promptsQuery = makeQuery({
      data: [
        { question: 'what do i worry about most?' },
        { question: 'when did you know?' },
        { question: 'what does home mean now?' },
      ],
      error: null,
    });
    mockFrom.mockImplementationOnce(() => dropsQuery).mockImplementationOnce(() => promptsQuery);

    const { getByText } = await render(<Harness theme="deeper" />);

    await waitFor(() =>
      expect(
        getByText('samples:what do i worry about most?|when did you know?|what does home mean now?')
      ).toBeTruthy()
    );
    expect(mockFrom).toHaveBeenNthCalledWith(1, 'drops');
    expect(dropsQuery.eq).toHaveBeenCalledWith('theme', 'deeper');
    expect(dropsQuery.order).toHaveBeenCalledWith('position', { ascending: true });
    expect(mockFrom).toHaveBeenNthCalledWith(2, 'drop_prompts');
    expect(promptsQuery.eq).toHaveBeenCalledWith('drop_id', 'drop-42');
    expect(promptsQuery.limit).toHaveBeenCalledWith(3);
    expect(hookResult.error).toBeNull();
  });

  it('surfaces a fetch failure as an honest error, not stub content', async () => {
    const dropsQuery = makeQuery({ data: null, error: { message: 'offline' } });
    mockFrom.mockImplementationOnce(() => dropsQuery);

    const { getByText } = await render(<Harness theme="fun" />);

    await waitFor(() => expect(getByText('error:offline')).toBeTruthy());
    expect(hookResult.samples).toEqual([]);
  });

  it('returns an empty list when the theme has no catalog drops', async () => {
    const dropsQuery = makeQuery({ data: [], error: null });
    mockFrom.mockImplementationOnce(() => dropsQuery);

    const { getByText } = await render(<Harness theme="ghost-theme" />);

    await waitFor(() => expect(getByText('samples:')).toBeTruthy());
    expect(mockFrom).toHaveBeenCalledTimes(1);
    expect(hookResult.error).toBeNull();
  });

  it('never fetches without a theme', async () => {
    const { getByText } = await render(<Harness theme={null} />);

    expect(getByText('samples:')).toBeTruthy();
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
