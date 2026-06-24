import { useOnboardingStore } from './onboarding';

describe('useOnboardingStore', () => {
  beforeEach(() => {
    useOnboardingStore.setState({ pendingIntents: [] });
  });

  it('starts with empty pendingIntents', () => {
    expect(useOnboardingStore.getState().pendingIntents).toEqual([]);
  });

  it('setPendingIntents stores the given array', () => {
    useOnboardingStore.getState().setPendingIntents(['know', 'talk']);
    expect(useOnboardingStore.getState().pendingIntents).toEqual(['know', 'talk']);
  });

  it('clearPendingIntents resets to empty', () => {
    useOnboardingStore.getState().setPendingIntents(['know', 'fun']);
    useOnboardingStore.getState().clearPendingIntents();
    expect(useOnboardingStore.getState().pendingIntents).toEqual([]);
  });

  it('overwrites previous intents on a second setPendingIntents call', () => {
    useOnboardingStore.getState().setPendingIntents(['know']);
    useOnboardingStore.getState().setPendingIntents(['talk', 'rough']);
    expect(useOnboardingStore.getState().pendingIntents).toEqual(['talk', 'rough']);
  });
});
