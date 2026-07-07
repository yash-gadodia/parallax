import * as Notifications from 'expo-notifications';
import { requestPermissions, scheduleDailyNudge, cancelDailyNudge, registerPushToken, notifyPartner, notifyPaired, notifyNudge, notifyRefocus } from './index';

jest.mock('expo-notifications');
// Stub supabase so notifyPartner tests control functions.invoke independently.
jest.mock('../../lib/supabase', () => ({
  supabase: {
    functions: { invoke: jest.fn(() => Promise.resolve({ data: null, error: null })) },
    auth: {
      getUser: jest.fn(() => Promise.resolve({ data: { user: null } })),
      getSession: jest.fn(() => Promise.resolve({ data: { session: null } })),
    },
    from: jest.fn(() => ({
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
    })),
  },
}));
import { supabase } from '../../lib/supabase';

const mockNotifications = Notifications as jest.Mocked<typeof Notifications>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('requestPermissions', () => {
  it('returns true when permission is already granted', async () => {
    mockNotifications.getPermissionsAsync.mockResolvedValue({
      status: 'granted',
      expires: 'never',
      granted: true,
      canAskAgain: true,
      ios: undefined,
    } as any);

    const result = await requestPermissions();
    expect(result).toBe(true);
    expect(mockNotifications.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  it('requests permissions when not yet granted and returns true on grant', async () => {
    mockNotifications.getPermissionsAsync.mockResolvedValue({
      status: 'undetermined',
      expires: 'never',
      granted: false,
      canAskAgain: true,
    } as any);
    mockNotifications.requestPermissionsAsync.mockResolvedValue({
      status: 'granted',
      expires: 'never',
      granted: true,
      canAskAgain: false,
    } as any);

    const result = await requestPermissions();
    expect(result).toBe(true);
  });

  it('returns false when permission is denied', async () => {
    mockNotifications.getPermissionsAsync.mockResolvedValue({
      status: 'denied',
      expires: 'never',
      granted: false,
      canAskAgain: false,
    } as any);
    mockNotifications.requestPermissionsAsync.mockResolvedValue({
      status: 'denied',
      expires: 'never',
      granted: false,
      canAskAgain: false,
    } as any);

    const result = await requestPermissions();
    expect(result).toBe(false);
  });

  it('returns false when the module throws', async () => {
    mockNotifications.getPermissionsAsync.mockRejectedValue(new Error('unavailable'));

    const result = await requestPermissions();
    expect(result).toBe(false);
  });
});

describe('scheduleDailyNudge', () => {
  beforeEach(() => {
    mockNotifications.getPermissionsAsync.mockResolvedValue({
      status: 'granted',
      expires: 'never',
      granted: true,
      canAskAgain: true,
    } as any);
    mockNotifications.cancelScheduledNotificationAsync.mockResolvedValue(undefined);
    mockNotifications.scheduleNotificationAsync.mockResolvedValue('parallax-daily-nudge');
  });

  it('schedules a daily notification with correct hour and minute', async () => {
    await scheduleDailyNudge('20:00');

    expect(mockNotifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: 'parallax-daily-nudge',
        content: expect.objectContaining({
          title: "Today's drop is waiting 💛",
        }),
        trigger: expect.objectContaining({
          hour: 20,
          minute: 0,
        }),
      })
    );
  });

  it('parses 08:00 correctly as hour=8 minute=0', async () => {
    await scheduleDailyNudge('08:00');

    expect(mockNotifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        trigger: expect.objectContaining({ hour: 8, minute: 0 }),
      })
    );
  });

  it('parses 22:30 correctly as hour=22 minute=30', async () => {
    await scheduleDailyNudge('22:30');

    expect(mockNotifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        trigger: expect.objectContaining({ hour: 22, minute: 30 }),
      })
    );
  });

  it('cancels existing nudge before scheduling a new one', async () => {
    await scheduleDailyNudge('08:00');

    const cancelOrder = mockNotifications.cancelScheduledNotificationAsync.mock.invocationCallOrder[0];
    const scheduleOrder = mockNotifications.scheduleNotificationAsync.mock.invocationCallOrder[0];
    expect(cancelOrder).toBeLessThan(scheduleOrder);
  });

  it('does not schedule when permissions are denied', async () => {
    mockNotifications.getPermissionsAsync.mockResolvedValue({
      status: 'denied',
      expires: 'never',
      granted: false,
      canAskAgain: false,
    } as any);
    mockNotifications.requestPermissionsAsync.mockResolvedValue({
      status: 'denied',
      expires: 'never',
      granted: false,
      canAskAgain: false,
    } as any);

    await scheduleDailyNudge('20:00');

    expect(mockNotifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('does not throw when scheduleNotificationAsync rejects', async () => {
    mockNotifications.scheduleNotificationAsync.mockRejectedValue(new Error('expo go'));

    await expect(scheduleDailyNudge('20:00')).resolves.toBeUndefined();
  });

  it('does not schedule for an invalid time string', async () => {
    await scheduleDailyNudge('invalid');

    expect(mockNotifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });
});

describe('cancelDailyNudge', () => {
  it('cancels the daily nudge notification', async () => {
    mockNotifications.cancelScheduledNotificationAsync.mockResolvedValue(undefined);

    await cancelDailyNudge();

    expect(mockNotifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(
      'parallax-daily-nudge'
    );
  });

  it('does not throw when cancel fails', async () => {
    mockNotifications.cancelScheduledNotificationAsync.mockRejectedValue(new Error('not found'));

    await expect(cancelDailyNudge()).resolves.toBeUndefined();
  });
});

describe('notifyPartner', () => {
  const mockInvoke = supabase.functions.invoke as jest.Mock;

  beforeEach(() => mockInvoke.mockClear());

  it('invokes notify-partner with event=played', async () => {
    await notifyPartner('cd-1', 'played');
    expect(mockInvoke).toHaveBeenCalledWith('notify-partner', {
      body: { couple_drop_id: 'cd-1', event: 'played' },
    });
  });

  it('invokes notify-partner with event=revealed', async () => {
    await notifyPartner('cd-2', 'revealed');
    expect(mockInvoke).toHaveBeenCalledWith('notify-partner', {
      body: { couple_drop_id: 'cd-2', event: 'revealed' },
    });
  });

  it('swallows errors so the submit flow is never interrupted', async () => {
    mockInvoke.mockRejectedValueOnce(new Error('network failure'));
    await expect(notifyPartner('cd-3', 'played')).resolves.toBeUndefined();
  });
});

describe('notifyNudge', () => {
  const mockInvoke = supabase.functions.invoke as jest.Mock;
  const mockGetSession = supabase.auth.getSession as jest.Mock;

  beforeEach(() => {
    mockInvoke.mockClear();
    mockGetSession.mockClear();
  });

  it('invokes notify-partner with event=nudge and the couple_id when signed in', async () => {
    mockGetSession.mockResolvedValueOnce({ data: { session: { user: { id: 'u-1' } } } });
    await notifyNudge('couple-7');
    expect(mockInvoke).toHaveBeenCalledWith('notify-partner', {
      body: { couple_id: 'couple-7', event: 'nudge' },
    });
  });

  it('is a no-op without a session (demo/solo mode)', async () => {
    mockGetSession.mockResolvedValueOnce({ data: { session: null } });
    await notifyNudge('couple-7');
    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it('swallows errors so the nudge flow is never interrupted', async () => {
    mockGetSession.mockResolvedValueOnce({ data: { session: { user: { id: 'u-1' } } } });
    mockInvoke.mockRejectedValueOnce(new Error('network failure'));
    await expect(notifyNudge('couple-7')).resolves.toBeUndefined();
  });
});

describe('notifyRefocus', () => {
  const mockInvoke = supabase.functions.invoke as jest.Mock;
  const mockGetSession = supabase.auth.getSession as jest.Mock;

  beforeEach(() => {
    mockInvoke.mockClear();
    mockGetSession.mockClear();
  });

  it('invokes notify-partner with event=refocus and the couple_id when signed in', async () => {
    mockGetSession.mockResolvedValueOnce({ data: { session: { user: { id: 'u-1' } } } });
    await notifyRefocus('couple-11');
    expect(mockInvoke).toHaveBeenCalledWith('notify-partner', {
      body: { couple_id: 'couple-11', event: 'refocus' },
    });
  });

  it('passes the session id so the edge fn can add the topic to the async copy', async () => {
    mockGetSession.mockResolvedValueOnce({ data: { session: { user: { id: 'u-1' } } } });
    await notifyRefocus('couple-11', 'session-7');
    expect(mockInvoke).toHaveBeenCalledWith('notify-partner', {
      body: {
        couple_id: 'couple-11',
        event: 'refocus',
        refocus_session_id: 'session-7',
      },
    });
  });

  it('is a no-op without a session (demo/solo mode)', async () => {
    mockGetSession.mockResolvedValueOnce({ data: { session: null } });
    await notifyRefocus('couple-11');
    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it('swallows errors so the refocus flow is never interrupted', async () => {
    mockGetSession.mockResolvedValueOnce({ data: { session: { user: { id: 'u-1' } } } });
    mockInvoke.mockRejectedValueOnce(new Error('network failure'));
    await expect(notifyRefocus('couple-11')).resolves.toBeUndefined();
  });
});

describe('notifyPaired', () => {
  const mockInvoke = supabase.functions.invoke as jest.Mock;

  beforeEach(() => mockInvoke.mockClear());

  it('invokes notify-partner with event=paired and the couple_id', async () => {
    await notifyPaired('couple-9');
    expect(mockInvoke).toHaveBeenCalledWith('notify-partner', {
      body: { couple_id: 'couple-9', event: 'paired' },
    });
  });

  it('swallows errors so the pairing flow is never interrupted', async () => {
    mockInvoke.mockRejectedValueOnce(new Error('network failure'));
    await expect(notifyPaired('couple-9')).resolves.toBeUndefined();
  });
});
