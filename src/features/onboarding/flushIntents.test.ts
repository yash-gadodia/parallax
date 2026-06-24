import { flushPendingIntents } from './flushIntents';
import { useOnboardingStore } from '../../store/onboarding';

const mockUpdate = jest.fn();
const mockEq = jest.fn();

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      update: mockUpdate,
    })),
  },
}));

describe('flushPendingIntents', () => {
  beforeEach(() => {
    useOnboardingStore.setState({ pendingIntents: [] });
    mockUpdate.mockReset();
    mockEq.mockReset();
    mockUpdate.mockReturnValue({ eq: mockEq });
    mockEq.mockResolvedValue({ error: null });
  });

  it('does nothing when pendingIntents is empty', async () => {
    await flushPendingIntents('uid-123');
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('calls update with pendingIntents and clears the store on success', async () => {
    useOnboardingStore.setState({ pendingIntents: ['know', 'talk'] });

    await flushPendingIntents('uid-abc');

    expect(mockUpdate).toHaveBeenCalledWith({ intents: ['know', 'talk'] });
    expect(mockEq).toHaveBeenCalledWith('id', 'uid-abc');
    expect(useOnboardingStore.getState().pendingIntents).toEqual([]);
  });

  it('does NOT clear the store when supabase returns an error', async () => {
    useOnboardingStore.setState({ pendingIntents: ['fun'] });
    mockEq.mockResolvedValue({ error: new Error('network') });

    await flushPendingIntents('uid-abc');

    expect(useOnboardingStore.getState().pendingIntents).toEqual(['fun']);
  });

  it('is idempotent: calling twice with no new intents skips the second DB call', async () => {
    useOnboardingStore.setState({ pendingIntents: ['know'] });

    await flushPendingIntents('uid-abc');
    await flushPendingIntents('uid-abc');

    expect(mockUpdate).toHaveBeenCalledTimes(1);
  });
});
