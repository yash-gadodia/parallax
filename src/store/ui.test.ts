import { useUiStore } from './ui';

describe('useUiStore', () => {
  beforeEach(() => {
    useUiStore.setState({ toast: null, sheet: null });
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('fireToast', () => {
    it('should set toast message immediately', () => {
      const { fireToast } = useUiStore.getState();

      fireToast('Test message');

      const { toast } = useUiStore.getState();
      expect(toast).toBe('Test message');
    });

    it('should clear toast after 1900ms', () => {
      const { fireToast } = useUiStore.getState();

      fireToast('Test message');
      expect(useUiStore.getState().toast).toBe('Test message');

      jest.advanceTimersByTime(1900);

      expect(useUiStore.getState().toast).toBeNull();
    });

    it('should cancel previous timer if toast fired again', () => {
      const { fireToast } = useUiStore.getState();

      fireToast('First message');
      jest.advanceTimersByTime(1500);
      expect(useUiStore.getState().toast).toBe('First message');

      fireToast('Second message');
      jest.advanceTimersByTime(400);

      expect(useUiStore.getState().toast).toBe('Second message');

      jest.advanceTimersByTime(1500);
      expect(useUiStore.getState().toast).toBeNull();
    });
  });

  describe('openSheet', () => {
    it('should set sheet name', () => {
      const { openSheet } = useUiStore.getState();

      openSheet('confirm');

      const { sheet } = useUiStore.getState();
      expect(sheet).toBe('confirm');
    });
  });

  describe('closeSheet', () => {
    it('should clear sheet', () => {
      const { openSheet, closeSheet } = useUiStore.getState();

      openSheet('confirm');
      expect(useUiStore.getState().sheet).toBe('confirm');

      closeSheet();

      expect(useUiStore.getState().sheet).toBeNull();
    });
  });

  describe('initial state', () => {
    it('should have null toast and sheet initially', () => {
      useUiStore.setState({ toast: null, sheet: null });
      const { toast, sheet } = useUiStore.getState();

      expect(toast).toBeNull();
      expect(sheet).toBeNull();
    });
  });
});
