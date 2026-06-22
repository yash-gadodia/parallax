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
  cta: 'play' | 'streak' | 'packs' | 'lovemap' | null;
  read_by: string[];
}

const ACTIVITY_KINDS: Record<string, {
  emoji: string;
  title: (actor?: string | null) => string;
  body: (payload?: Record<string, unknown> | null) => string;
  cta: 'play' | 'streak' | 'packs' | 'lovemap' | null;
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
    title: (actor) => 'You hit a milestone',
    body: () => 'Keep the streak alive.',
    cta: 'streak',
    who: 'us',
  },
  pack: {
    emoji: '🌊',
    title: () => 'Partner sent you a pack',
    body: () => 'See what they picked for you.',
    cta: 'packs',
    who: 'dani',
  },
  refocus: {
    emoji: '🤍',
    title: () => 'You refocused a moment',
    body: () => 'Added to your Love Map.',
    cta: 'lovemap',
    who: 'us',
  },
  reveal: {
    emoji: '👯',
    title: () => 'A twin moment',
    body: () => 'You matched on an answer.',
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
