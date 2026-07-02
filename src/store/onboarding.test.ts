import AsyncStorage from '@react-native-async-storage/async-storage';
import { useOnboardingStore } from './onboarding';

const STORAGE_KEY = 'parallax-onboarding';

describe('useOnboardingStore', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useOnboardingStore.setState({ pendingIntents: [], pendingInviteCode: null });
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

  it('persists pendingIntents to AsyncStorage on set', async () => {
    useOnboardingStore.getState().setPendingIntents(['know', 'talk']);

    await new Promise((resolve) => setTimeout(resolve, 0));

    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw as string).state).toEqual({ pendingIntents: ['know', 'talk'] });
  });

  it('rehydrates pendingIntents from AsyncStorage (survives a cold relaunch)', async () => {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ state: { pendingIntents: ['rough', 'far'] }, version: 0 })
    );

    await useOnboardingStore.persist.rehydrate();

    expect(useOnboardingStore.getState().pendingIntents).toEqual(['rough', 'far']);
  });

  it('does NOT persist pendingInviteCode (deep-link codes are transient)', async () => {
    useOnboardingStore.getState().setPendingInviteCode('YASH-4827');

    await new Promise((resolve) => setTimeout(resolve, 0));

    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    expect(JSON.parse(raw as string).state).toEqual({ pendingIntents: [] });
  });
});
