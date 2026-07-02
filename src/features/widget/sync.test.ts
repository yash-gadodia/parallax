import { APP_GROUP, SNAPSHOT_KEY, syncWidgetState } from './sync';
import type { WidgetSnapshot } from './snapshot';

const mockSet = jest.fn();
const mockReload = jest.fn();
const mockCtor = jest.fn();

jest.mock('@bacons/apple-targets', () => {
  class ExtensionStorage {
    constructor(appGroup: string) {
      mockCtor(appGroup);
    }
    set(key: string, value: string) {
      mockSet(key, value);
    }
    static reloadWidget(name?: string) {
      mockReload(name);
    }
  }
  return { ExtensionStorage };
});

const snapshot: WidgetSnapshot = {
  state: 'guess',
  partnerName: 'Dani',
  wavePct: 0,
  streak: 6,
  date: '2026-07-02',
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('syncWidgetState', () => {
  it('writes the snapshot JSON to the App Group and reloads the widget', () => {
    expect(syncWidgetState(snapshot)).toBe(true);
    expect(mockCtor).toHaveBeenCalledWith(APP_GROUP);
    expect(mockSet).toHaveBeenCalledWith(SNAPSHOT_KEY, JSON.stringify(snapshot));
    expect(mockReload).toHaveBeenCalledTimes(1);
  });

  it('uses the wired App Group id and key', () => {
    expect(APP_GROUP).toBe('group.com.yashgadodia.parallax');
    expect(SNAPSHOT_KEY).toBe('widget_snapshot');
  });

  it('no-ops safely (returns false, never throws) when the native layer throws', () => {
    mockSet.mockImplementationOnce(() => {
      throw new Error('native module missing');
    });
    expect(syncWidgetState(snapshot)).toBe(false);
    expect(mockReload).not.toHaveBeenCalled();
  });
});
