import { startOrUpdateStreakActivity, endStreakActivity } from './bridge';

// OTA-safety regression: this JS can be OTA'd onto a binary (e.g. build 11)
// that does NOT contain the ParallaxLiveActivity native module — there
// requireNativeModule throws. The bridge must no-op (resolve false), never
// crash and never surface an error to the user. jest-expo runs as iOS, so the
// Platform gate passes and the require path is genuinely exercised.

const mockRequireNativeModule = jest.fn();
jest.mock('expo-modules-core', () => {
  const actual = jest.requireActual('expo-modules-core');
  return {
    // Keep the real module intact (expo's own runtime modules resolve through
    // requireNativeModule too) — only the Parallax lookup is intercepted.
    ...actual,
    requireNativeModule: (name: string) =>
      name === 'ParallaxLiveActivity'
        ? mockRequireNativeModule(name)
        : actual.requireNativeModule(name),
  };
});

describe('liveActivity bridge', () => {
  beforeEach(() => {
    mockRequireNativeModule.mockReset();
  });

  describe('binary without the native module (OTA onto build 11)', () => {
    beforeEach(() => {
      mockRequireNativeModule.mockImplementation(() => {
        throw new Error("Cannot find native module 'ParallaxLiveActivity'");
      });
    });

    it('startOrUpdateStreakActivity no-ops: resolves false, never throws', async () => {
      await expect(
        startOrUpdateStreakActivity(14, 1780502400000, '2026-07-03')
      ).resolves.toBe(false);
      // Proves the missing-module path ran (not the Platform gate short-circuit).
      expect(mockRequireNativeModule).toHaveBeenCalledWith('ParallaxLiveActivity');
    });

    it('endStreakActivity no-ops: resolves false, never throws', async () => {
      await expect(endStreakActivity()).resolves.toBe(false);
      expect(mockRequireNativeModule).toHaveBeenCalledWith('ParallaxLiveActivity');
    });
  });

  describe('binary with the native module', () => {
    it('startOrUpdateStreakActivity forwards the exact args and returns the native result', async () => {
      const startOrUpdate = jest.fn().mockResolvedValue(true);
      mockRequireNativeModule.mockReturnValue({
        isSupported: () => true,
        startOrUpdate,
        endAll: jest.fn().mockResolvedValue(true),
      });

      await expect(
        startOrUpdateStreakActivity(14, 1780502400000, '2026-07-03')
      ).resolves.toBe(true);
      expect(startOrUpdate).toHaveBeenCalledWith(14, 1780502400000, '2026-07-03');
    });

    it('a native-side rejection is swallowed to false (lock screen can never break the app)', async () => {
      mockRequireNativeModule.mockReturnValue({
        isSupported: () => true,
        startOrUpdate: jest.fn().mockRejectedValue(new Error('ActivityKit denied')),
        endAll: jest.fn().mockRejectedValue(new Error('ActivityKit denied')),
      });

      await expect(startOrUpdateStreakActivity(1, 1, 'd')).resolves.toBe(false);
      await expect(endStreakActivity()).resolves.toBe(false);
    });
  });
});
