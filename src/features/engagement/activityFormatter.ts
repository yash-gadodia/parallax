import { Activity } from '../../types/db';

export interface DisplayActivity {
  id: string;
  kind: string;
  who: 'you' | 'dani' | 'us';
  emoji: string;
  title: string;
  body: string;
  when: string;
  created_at?: string;
  unread: boolean;
  cta: 'play' | 'streak' | null;
  read_by: string[];
}

// Only kinds with a real server-side producer get copy (audit item (c)12/15 —
// no dead promises): 'played' + 'milestone' from _increment_streak (0014/0017),
// 'nudge' from nudge_partner, 'refocus' from start_refocus (0020), 'pack' from
// send_pack (0023 — the queued theme rides in payload.theme). 'reveal' stays
// removed until something actually emits it; unknown kinds fall through to the
// generic map.
const ACTIVITY_KINDS: Record<string, {
  emoji: string;
  title: (actor?: string | null) => string;
  body: (payload?: Record<string, unknown> | null) => string;
  cta: 'play' | 'streak' | null;
  who: 'you' | 'dani' | 'us';
}> = {
  played: {
    emoji: '💌',
    title: () => 'Partner played today\'s drop',
    body: () => 'Your turn, no peeking at theirs.',
    cta: 'play',
    who: 'dani',
  },
  nudge: {
    emoji: '👋',
    title: () => 'Partner nudged you',
    body: () => '"come do today\'s one with me 🥺"',
    cta: 'play',
    who: 'dani',
  },
  milestone: {
    emoji: '🔥',
    title: () => 'You hit a milestone',
    body: () => 'Keep the streak alive.',
    cta: 'streak',
    who: 'us',
  },
  pack: {
    emoji: '🎁',
    title: () => 'Partner queued a pack',
    body: (payload) =>
      typeof payload?.theme === 'string' && payload.theme
        ? `Tomorrow's drop comes from the ${payload.theme} pack.`
        : "Tomorrow's drop comes from it.",
    cta: null,
    who: 'dani',
  },
  refocus: {
    emoji: '💛',
    title: () => 'A refocus session started',
    body: (payload) =>
      typeof payload?.topic === 'string' && payload.topic
        ? `"${payload.topic}" — untangling it together.`
        : 'Untangling something together.',
    cta: null,
    who: 'us',
  },
};

export function formatActivityTime(createdAt: string): string {
  const now = new Date();
  const then = new Date(createdAt);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function mapActivityToDisplay(activity: Activity): DisplayActivity {
  const kind = activity.kind.toLowerCase();
  const config = ACTIVITY_KINDS[kind] || {
    emoji: '📌',
    title: () => activity.kind,
    body: () => '',
    cta: null,
    who: 'us' as const,
  };

  return {
    id: activity.id,
    kind: activity.kind,
    who: config.who,
    emoji: config.emoji,
    title: config.title(activity.actor || undefined),
    body: config.body(activity.payload as Record<string, unknown> | undefined),
    when: formatActivityTime(activity.created_at),
    created_at: activity.created_at,
    unread: false,
    cta: config.cta,
    read_by: activity.read_by || [],
  };
}
