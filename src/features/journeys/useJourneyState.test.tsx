import React from 'react';
import { Text } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';
import { useJourneyState } from './useJourneyState';

const mockRpc = jest.fn();
const mockFrom = jest.fn();
jest.mock('../../lib/supabase', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
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
  (q as { then: unknown }).then = (
    resolve: (v: QueryResult) => unknown
  ) => Promise.resolve(resolve(result));
  return q;
}

const LIVE_STATE = {
  exists: true,
  couple_journey_id: 'cj1',
  journey_id: 'j1',
  slug: 'bto',
  title: 'the bto journey',
  emoji: '🏠',
  stage_count: 7,
  current_stage: 2,
  started_at: '2026-06-01T00:00:00Z',
  completed_at: null,
  i_checked_in: true,
  partner_checked_in: false,
  stages: [
    { position: 1, entered_at: '2026-06-01T00:00:00Z', completed_at: '2026-06-20T00:00:00Z' },
    { position: 2, entered_at: '2026-06-20T00:00:00Z', completed_at: null },
  ],
};

let hookResult: ReturnType<typeof useJourneyState>;

function Harness({ coupleId }: { coupleId: string | null }) {
  hookResult = useJourneyState(coupleId);
  const { state, stages, loading, error } = hookResult;
  return (
    <Text>
      {loading
        ? 'loading'
        : error
          ? `error:${error.message}`
          : state?.exists
            ? `stage:${state.current_stage}/${state.stage_count};stages:${stages.length}`
            : `none:${state === null ? 'null' : 'unenrolled'}`}
    </Text>
  );
}

describe('useJourneyState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('with a null coupleId settles to null state and never calls the server', async () => {
    const { getByText } = await render(<Harness coupleId={null} />);
    await waitFor(() => expect(getByText('none:null')).toBeTruthy());
    expect(mockRpc).not.toHaveBeenCalled();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('loads the enrollment state and the enrolled journey stage catalog', async () => {
    mockRpc.mockResolvedValue({ data: LIVE_STATE, error: null });
    mockFrom.mockImplementationOnce(() =>
      makeQuery({
        data: Array.from({ length: 7 }, (_, i) => ({
          id: `s${i + 1}`,
          journey_id: 'j1',
          position: i + 1,
          title: `stage ${i + 1}`,
          talk_prompts: [],
          checkin_prompt: 'q?',
        })),
        error: null,
      })
    );

    const { getByText } = await render(<Harness coupleId="c1" />);

    await waitFor(() => expect(getByText('stage:2/7;stages:7')).toBeTruthy());
    expect(mockRpc).toHaveBeenCalledWith('get_journey_state', { p_couple: 'c1' });
    expect(mockFrom).toHaveBeenCalledWith('journey_stages');
  });

  it('reports the unenrolled state without fetching stages', async () => {
    mockRpc.mockResolvedValue({ data: { exists: false }, error: null });

    const { getByText } = await render(<Harness coupleId="c1" />);

    await waitFor(() => expect(getByText('none:unenrolled')).toBeTruthy());
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('surfaces an honest, retryable error on failure', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'boom' } });

    const { getByText } = await render(<Harness coupleId="c1" />);

    await waitFor(() => expect(getByText(/error:/)).toBeTruthy());
    expect(hookResult.error).not.toBeNull();
    expect(typeof hookResult.refetch).toBe('function');
  });
});
