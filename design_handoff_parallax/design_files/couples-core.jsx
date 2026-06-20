// Parallax (couples), soft & dreamy core: shell, atoms, icons, content, shared helpers.
const { useState, useEffect, useRef } = React;

// ── identities ────────────────────────────────────────────────
const YOU = { name: 'you', initial: 'Y' };
const PAR = { name: 'Dani', initial: 'D' };
const TAGLINE = 'mind the parallax error';

// ── today's drop: 3 flirty-tasteful prompts ───────────────────
// A daily drop is a mini Aron arc: light → personal → vulnerable, both answering
// about themselves. Predicting their answer IS a Gottman love-map test. The miss is
// the gift, a wrong guess is tonight's conversation, not a failure.
const DROP = {
  code: 'DROP 27', day: 'Sunday', title: 'soft launch',
  blurb: 'Three questions built to open something, light, then deeper. Answer for you, then guess them.',
  prompts: [
    { id: 'care', emoji: '☕', q: 'I feel most taken care of when you…',
      opts: ['bring me a drink before I ask', 'quietly handle a thing so I don’t have to', 'check in on me midday', 'let me rant with zero fixing', 'just sit close, no words'],
      remy: 1, remyHunch: 4,
      note: ['Same instinct for care. Rare and lovely.', 'You knew exactly how they want to be held.', 'Wrong guess, so now you know. Go do that one tonight.'],
      why: 'Feeling loved hinges on being cared for the way you need, not the way they’d care. (Gottman, love maps)' },
    { id: 'low', emoji: '🌧', q: 'When I’m overwhelmed, what I really need is…',
      opts: ['space, alone, for a bit', 'you near me, not fixing it', 'to talk the whole thing out', 'to be pulled out of my head', 'to hear that we’re okay'],
      remy: 1, remyHunch: 0,
      note: ['You weather storms the same way.', 'You read their storm right, most partners don’t.', 'Missed, and this is the one worth getting right.'],
      why: 'Couples misread each other’s stress needs more than almost anything. Asking beats assuming.' },
    { id: 'unsaid', emoji: '🔓', q: 'Something I think but almost never say out loud…',
      opts: ['that I’m “too much”', 'that I’m not enough', 'where we’re actually headed', 'a dream I haven’t told you', 'how much I really need you'],
      remy: 3, remyHunch: 1,
      note: ['You both carry the same quiet thing. Say it.', 'You saw what they don’t say. That’s intimacy.', 'You didn’t see it coming, which is exactly why it matters.'],
      why: 'Naming the unsaid is the quiet fast-track to closeness. (Aron, 36 questions)' },
  ],
};

// packs, deep is free (one themed pack on the house), rest are Plus
const PACKS = [
  { id: 'deep', emoji: '🌊', title: 'Deep end', tag: 'the real ones', tint: 'var(--p2)', locked: false },
  { id: 'spicy', emoji: '🌶️', title: 'After dark', tag: 'flirty · 18+', tint: 'var(--p1)', locked: true },
  { id: 'silly', emoji: '🎈', title: 'Chaos hour', tag: 'unserious', tint: 'var(--match)', locked: true },
  { id: 'future', emoji: '🔮', title: 'Someday', tag: 'the big stuff', tint: 'var(--p2-deep)', locked: true },
];
const PACK_SAMPLE = {
  deep: ['What do you think I worry about most?', 'When did you know you liked me?', 'What does “home” mean to you now?'],
  spicy: ['Boldest place you’d want to kiss me?', 'One thing you’ve wanted to try together?', 'Describe last night in three words.'],
  silly: ['If we were a sitcom couple, who’s the chaos?', 'Weirdest thing you find cute about me?', 'Our toxic trait as a duo?'],
  future: ['City we eventually end up in?', 'Kids, pets, or plants first?', 'Where do you see us in five years?'],
};

// past drops, feed the Us history + drop detail
const ARCHIVE = [
  { code: 'DROP 26', title: 'the ick list', day: 'yesterday', wave: 88, twins: 2, emoji: '😬',
    rows: [['Biggest ick?', 'Bad texter', 'Bad texter', true], ['My worst habit?', 'I’m always late', 'I overthink', false], ['Dealbreaker?', 'No ambition', 'No ambition', true]] },
  { code: 'DROP 25', title: 'future tense', day: '2 days ago', wave: 74, twins: 1, emoji: '🔮',
    rows: [['Dream city?', 'Lisbon', 'Lisbon', true], ['Kids someday?', 'Maybe two', 'Definitely', false], ['First big buy?', 'A trip', 'A home', false]] },
  { code: 'DROP 24', title: 'red flags', day: '3 days ago', wave: 80, twins: 2, emoji: '🚩',
    rows: [['My red flag?', 'Too competitive', 'Too competitive', true], ['Your love language?', 'Touch', 'Quality time', false], ['Fight style?', 'Talk it out', 'Talk it out', true]] },
];

// the comment thread seeded on the Friday-night answer
const THREAD = {
  promptId: 'fri',
  q: 'Our perfect Friday night?',
  emoji: '🌙',
  msgs: [
    { who: 'remy', text: 'cozy night in?? since when 😭 you wanted to go OUT last week' },
    { who: 'you', text: 'that was someone’s birthday, it doesn’t count' },
    { who: 'remy', text: 'mhm. ok my little homebody 🫶' },
  ],
  reactions: ['😭', '🫶', '😂', '🔥', '🥹'],
};

// what the app has learned about each of you, the Love Map.
// Sourced from fights (refocus) AND daily drops; mastery grows as it's reinforced.
const LEARNINGS = [
  { id: 'chosen', who: 'dani', emoji: '🤍', need: 'Feels chosen when plans are locked in early', detail: 'Open-ended weekends read as “I’m not a priority.”',
    from: 'refocus', origin: 'the Saturday silence', when: 'today', mastery: 0,
    becameQ: 'When the weekend’s wide open, what’s one small thing that makes Dani feel chosen?' },
  { id: 'slack', who: 'you', emoji: '🌊', need: 'Needs slack when slammed, to be trusted, not chased', detail: 'Going quiet is bandwidth, never distance.',
    from: 'refocus', origin: 'the Saturday silence', when: 'today', mastery: 0, becameQ: null },
  { id: 'stress', who: 'dani', emoji: '🌧', need: 'When overwhelmed, wants you near, not fixing it', detail: 'Presence over solutions.',
    from: 'drop', origin: 'DROP 22 · stress styles', when: 'last week', mastery: 2, becameQ: null },
  { id: 'touch', who: 'you', emoji: '🫶', need: 'Feels most loved through small acts, not big words', detail: 'A made coffee says more than a paragraph.',
    from: 'drop', origin: 'DROP 19 · love languages', when: '3 weeks ago', mastery: 3, becameQ: null },
];
const MASTERY = ['just learned', 'getting it', 'second nature', 'you’ve got this'];

// activity pulse, the two-player back-and-forth (Duolingo red-dot trigger)
const ACTIVITY = [
  { id: 'a1', kind: 'played', who: 'dani', emoji: '💌', title: 'Dani played today’s drop', body: 'Your turn, no peeking at theirs.', when: 'just now', unread: true, cta: 'play' },
  { id: 'a2', kind: 'nudge', who: 'dani', emoji: '👋', title: 'Dani nudged you', body: '“come do today’s one with me 🥺”', when: '2h ago', unread: true, cta: 'play' },
  { id: 'a3', kind: 'milestone', who: 'us', emoji: '🔥', title: 'You hit a 23-day streak', body: 'Next milestone: 30 days. Don’t break it now.', when: 'today', unread: false, cta: 'streak' },
  { id: 'a4', kind: 'pack', who: 'dani', emoji: '🌊', title: 'Dani sent you a pack', body: 'Deep end · 3 of the real questions.', when: 'yesterday', unread: false, cta: 'packs' },
  { id: 'a5', kind: 'refocus', who: 'us', emoji: '🤍', title: 'You refocused “the Saturday silence”', body: 'Added 2 things to your Love Map.', when: '2 days ago', unread: false, cta: 'lovemap' },
  { id: 'a6', kind: 'reveal', who: 'us', emoji: '👯', title: 'A twin moment on DROP 26', body: 'You both said “bad texter.” Iconic.', when: '2 days ago', unread: false, cta: null },
];

// ── icons ─────────────────────────────────────────────────────
const I = {
  spark: 'M10 2.5c.4 3 1.5 4.1 4.5 4.5-3 .4-4.1 1.5-4.5 4.5-.4-3-1.5-4.1-4.5-4.5 3-.4 4.1-1.5 4.5-4.5z',
  home: 'M3.5 9.5L10 4l6.5 5.5M5 8.5V16h10V8.5',
  cards: 'M3 6.5l6.2-2.2a1 1 0 011.3.6l3.4 9.2M5.5 8h9a1 1 0 011 1v6a1 1 0 01-1 1h-9a1 1 0 01-1-1V9a1 1 0 011-1z',
  us: 'M7.2 12.5a3.3 3.3 0 100-6.5 3.3 3.3 0 000 6.5zM12.8 12.5a3.3 3.3 0 100-6.5',
  back: 'M12 4l-5 6 5 6', fwd: 'M8 4l5 6-5 6', chevR: 'M8 5l5 5-5 5',
  check: 'M4.5 10.5l3.2 3.2L15.5 6', cross: 'M5.5 5.5l9 9M14.5 5.5l-9 9',
  share: 'M10 13V3.5m0 0L7 6.5m3-3l3 3M5 10.5V15a1 1 0 001 1h8a1 1 0 001-1v-4.5',
  flame: 'M10 2.5c0 3.5 3.5 4.5 3.5 8a3.5 3.5 0 01-7 0c0-1.8 1-2.8 1.8-3.6.7.7.7 1.6.7 2.4 1-1 1-2.6 0-4.3 0-1.2.5-2 1-2.9z',
  lock: 'M6 9V7a4 4 0 018 0v2M5 9h10v6a1 1 0 01-1 1H6a1 1 0 01-1-1V9z',
  heart: 'M10 16S3.5 12 3.5 7.7A3.2 3.2 0 0110 6a3.2 3.2 0 016.5 1.7C16.5 12 10 16 10 16z',
  copy: 'M7.5 7.5h7v7h-7zM5 12.5H4V4h9v1', close: 'M5 5l10 10M15 5L5 15',
  bell: 'M10 3a3.4 3.4 0 00-3.4 3.4c0 3.9-1.4 4.9-1.4 4.9h9.6s-1.4-1-1.4-4.9A3.4 3.4 0 0010 3zM8.5 14.5a1.5 1.5 0 003 0',
  gear: 'M3 6.5h8M15 6.5h2M3 13.5h2M9 13.5h8M12 4.5v4M6 11.5v4',
  plus: 'M10 4.5v11M4.5 10h11', send: 'M16.5 3.5L8 12M16.5 3.5l-5.5 13-2.8-6.2L2 7.5l14.5-4z',
  chat: 'M4 5.5h12a1 1 0 011 1v6a1 1 0 01-1 1H9l-3.5 3v-3H4a1 1 0 01-1-1v-6a1 1 0 011-1z',
  pencil: 'M13.3 4.4l2.3 2.3M4 16l1-3.6 8.3-8.3 2.6 2.6L7.6 15 4 16z',
  bolt: 'M11 2.5L5 11h4l-1 6.5L15 9h-4l1-6.5z',
  link: 'M8.4 11.6l3.2-3.2M10.5 6.3l1-1a2.8 2.8 0 014 4l-1 1M9.5 13.7l-1 1a2.8 2.8 0 01-4-4l1-1',
  logout: 'M8 5.5V4a1 1 0 011-1h6a1 1 0 011 1v12a1 1 0 01-1 1H9a1 1 0 01-1-1v-1.5M11 10H3m0 0l3-3m-3 3l3 3',
  grid: 'M4 4h5v5H4zM11 4h5v5h-5zM4 11h5v5H4zM11 11h5v5h-5z',
  stack: 'M10 3l7 3.5-7 3.5-7-3.5L10 3zM3 11l7 3.5 7-3.5M3 14.5l7 3.5 7-3.5',
  apple: 'M13.6 10.6c0-1.7 1.4-2.5 1.5-2.6-.8-1.2-2.1-1.3-2.5-1.4-1.1-.1-2.1.6-2.6.6-.5 0-1.4-.6-2.3-.6-1.2 0-2.3.7-2.9 1.8-1.2 2.1-.3 5.3.9 7 .6.8 1.3 1.8 2.2 1.7.9 0 1.2-.6 2.3-.6 1.1 0 1.3.6 2.3.6.9 0 1.5-.8 2.1-1.7.7-1 .9-1.9.9-2-.1 0-1.8-.7-1.9-2.8zM11.9 5.5c.5-.6.8-1.4.7-2.2-.7 0-1.5.5-2 1.1-.4.5-.8 1.3-.7 2.1.8 0 1.6-.4 2-1z',
  card: 'M3 6h14a1 1 0 011 1v6a1 1 0 01-1 1H3a1 1 0 01-1-1V7a1 1 0 011-1zM2 9h16M5 12.5h3',
  star: 'M10 2.8l2.1 4.5 4.9.5-3.7 3.3 1.1 4.8L10 13.9 5.6 16l1.1-4.8L3 7.8l4.9-.5z',
};
function G({ d, size = 20, c = 'currentColor', sw = 1.6, fill = 'none', style }) {
  return <svg width={size} height={size} viewBox="0 0 20 20" fill={fill} stroke={c}
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={style}><path d={d} /></svg>;
}

// overlap mark, two viewpoints meeting = "us"
function Mark({ size = 26 }) {
  return (
    <svg width={size} height={size * 0.74} viewBox="0 0 34 25" fill="none">
      <circle cx="13" cy="12.5" r="9.2" fill="var(--p1)" fillOpacity="0.92" />
      <circle cx="21" cy="12.5" r="9.2" fill="var(--p2)" fillOpacity="0.78" style={{ mixBlendMode: 'multiply' }} />
    </svg>
  );
}

// para//ax, the wordmark. The "ll" becomes two parallel slashes (coral + periwinkle).
// offset=true nudges the second stroke out of true → a literal parallax shift.
// light=true for use on a gradient/ink background.
// Bars are inline-block with vertical-align:baseline, so their bottoms sit on the
// text baseline exactly like the "ll" they replace. h is ascender height.
function Slashes({ h = '0.7em', offset = false, light = false }) {
  const a = light ? '#fff' : 'var(--p1)';
  const b = light ? 'rgba(255,255,255,0.82)' : 'var(--p2)';
  const bar = { display: 'inline-block', width: '0.1em', height: h, borderRadius: '0.05em',
    verticalAlign: 'baseline', transform: 'skewX(-11deg)', transformOrigin: 'bottom' };
  return (
    <span style={{ display: 'inline-block', whiteSpace: 'nowrap', margin: '0 0.1em', verticalAlign: 'baseline' }}>
      <span style={{ ...bar, background: a }} />
      <span style={{ ...bar, background: b, marginLeft: '0.08em',
        transform: `skewX(-11deg)${offset ? ' translateY(-0.13em)' : ''}`, transition: 'transform .55s cubic-bezier(.3,.9,.3,1)' }} />
    </span>
  );
}
function Wordmark({ size = 25, c = 'var(--ink)', offset = false, light = false }) {
  return (
    <span style={{ ...serif, fontSize: size, color: light ? '#fff' : c, letterSpacing: '0.01em', lineHeight: 1, whiteSpace: 'nowrap' }}>
      para<Slashes offset={offset} light={light} />ax
    </span>
  );
}

// Peek, the cute lens-pair mascot. Two googly "3D-glasses" eyes (coral + periwinkle)
// that blink, search for each other, and snap into focus. Parallax error, made adorable.
function Peek({ size = 88, mood = 'happy' }) {
  const focus = mood === 'focus', love = mood === 'love', search = mood === 'search';
  const inward = !(focus || love);
  const lpx = inward ? 30 : 28, rpx = inward ? 50 : 52;
  const Eye = ({ ex, px, delay }) => love
    ? <path d={`M${ex - 6} 25 q6 -6.5 12 0`} stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none" />
    : (
      <g style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: `pxblink 4.2s ${delay}s infinite` }}>
        <ellipse cx={ex} cy="26" rx="7.6" ry="8.6" fill="#fff" />
        <g style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: search ? `pxdart 1.6s ease-in-out ${delay}s infinite` : 'none' }}>
          <circle cx={px} cy="27" r="3.7" fill="#3A3340" />
          <circle cx={px + 1.4} cy="25.5" r="1.3" fill="#fff" />
        </g>
      </g>
    );
  return (
    <svg width={size} height={size * 0.7} viewBox="0 0 80 56" fill="none" style={{ overflow: 'visible' }}>
      <circle cx="28" cy="28" r="20" fill="var(--p1)" fillOpacity="0.92" />
      <circle cx="52" cy="28" r="20" fill="var(--p2)" fillOpacity="0.8" style={{ mixBlendMode: 'multiply' }} />
      <Eye ex={28} px={lpx} delay={0} />
      <Eye ex={52} px={rpx} delay={0.18} />
      {(love || focus) && <>
        <circle cx="19" cy="34" r="3.2" fill="#FF8E7A" fillOpacity="0.45" />
        <circle cx="61" cy="34" r="3.2" fill="#9D95F5" fillOpacity="0.45" />
      </>}
      <path d={focus || love ? 'M33 39 q7 7.5 14 0' : (search ? 'M37 40 q3 3 6 0' : 'M35 39 q5 4.5 10 0')}
        stroke="#3A3340" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      {focus && <path d="M65 12 l1.5 3.6 3.6 1.5 -3.6 1.5 -1.5 3.6 -1.5 -3.6 -3.6 -1.5 3.6 -1.5z" fill="var(--p2-deep)" />}
    </svg>
  );
}

// anaglyph, the "3D glasses" chromatic offset. Coral ghost left, periwinkle ghost right.
function anaglyph(amt = 0.03, strength = 0.6) {
  return { color: 'var(--ink)', textShadow: `-${amt}em 0 0 rgba(255,142,122,${strength}), ${amt}em 0 0 rgba(157,149,245,${strength})` };
}

// ── type atoms ────────────────────────────────────────────────
const mono = { fontFamily: 'var(--font-mono)' };
const serif = { fontFamily: 'var(--font-disp)', fontWeight: 400 };
function Kick({ children, c = 'var(--ink-mute)', style }) {
  return <div style={{ ...mono, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: c, ...style }}>{children}</div>;
}
function Serif({ children, s = 34, italic, c = 'var(--ink)', style }) {
  return <div style={{ ...serif, fontStyle: italic ? 'italic' : 'normal', fontSize: s,
    lineHeight: 1.09, color: c, letterSpacing: '0.005em', textWrap: 'balance', ...style }}>{children}</div>;
}

// avatar token
function Tok({ who, size = 30, ring, you }) {
  const c = you ? 'var(--p1)' : 'var(--p2)';
  return (
    <div style={{
      width: size, height: size, borderRadius: 999, background: c, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      ...serif, fontSize: size * 0.5, flexShrink: 0,
      boxShadow: ring ? `0 0 0 3px var(--surface), 0 0 0 5px ${c}` : '0 3px 8px rgba(58,40,70,0.16)',
    }}>{who.initial}</div>
  );
}

// pressable
function Press({ children, onClick, style, disabled, scale = true }) {
  const [d, setD] = useState(false);
  return (
    <button onClick={disabled ? undefined : onClick}
      onPointerDown={() => setD(true)} onPointerUp={() => setD(false)} onPointerLeave={() => setD(false)}
      style={{ border: 'none', background: 'none', padding: 0, cursor: disabled ? 'default' : 'pointer',
        display: 'block', color: 'inherit', font: 'inherit', width: '100%',
        transform: scale && d && !disabled ? 'scale(0.975)' : 'none', transition: 'transform .14s ease', ...style }}>
      {children}
    </button>
  );
}

// big pill button
function Btn({ children, onClick, kind = 'ink', sub, disabled, style }) {
  const pal = {
    ink: { bg: 'var(--ink)', fg: '#fff' },
    us: { bg: 'var(--us)', fg: '#fff' },
    coral: { bg: 'var(--p1-deep)', fg: '#fff' },
    soft: { bg: 'var(--surface)', fg: 'var(--ink)', bd: '1px solid var(--line)' },
  }[kind];
  return (
    <Press onClick={onClick} disabled={disabled}>
      <div style={{
        background: disabled ? 'var(--sunken)' : pal.bg, color: disabled ? 'var(--ink-mute)' : pal.fg,
        border: pal.bd || 'none', borderRadius: 999, minHeight: 58,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
        padding: '12px 24px', boxSizing: 'border-box', boxShadow: disabled ? 'none' : 'var(--shadow-soft)', ...style }}>
        <span style={{ fontSize: 16.5, fontWeight: 700, lineHeight: 1.1, whiteSpace: 'nowrap' }}>{children}</span>
        {sub && <span style={{ ...mono, fontSize: 9.5, letterSpacing: '0.12em', opacity: 0.8, textTransform: 'uppercase' }}>{sub}</span>}
      </div>
    </Press>
  );
}

const cardBase = { background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 26, boxShadow: 'var(--shadow)' };

// ── shared bits used across screens ───────────────────────────
const P = DROP.prompts;

function Brand({ c = 'var(--ink)', size = 25 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
      <Wordmark size={size} c={c} />
    </div>
  );
}
function Chip({ children, you, soft }) {
  const c = you ? 'var(--p1-deep)' : 'var(--p2-deep)';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 999,
      background: soft ? (you ? 'rgba(255,142,122,0.14)' : 'rgba(157,149,245,0.16)') : c,
      color: soft ? c : '#fff', fontSize: 13.5, fontWeight: 600, lineHeight: 1.25 }}>{children}</span>
  );
}
function Stat({ big, label, grad }) {
  return (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <div style={{ ...serif, fontSize: 30, lineHeight: 1,
        ...(grad ? { background: 'var(--us)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', paddingRight: '0.06em' } : { color: 'var(--ink)' }) }}>{big}</div>
      <div style={{ ...mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-mute)', marginTop: 6 }}>{label}</div>
    </div>
  );
}
function Ring({ pct, size = 168 }) {
  const r = (size - 18) / 2, c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <linearGradient id="usg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FF8E7A" /><stop offset="100%" stopColor="#9D95F5" />
        </linearGradient>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--sunken)" strokeWidth="14" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="url(#usg)" strokeWidth="14" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(.3,.9,.3,1)' }} />
    </svg>
  );
}
function reveal(state) {
  let yourHits = 0, remyHits = 0, twins = 0;
  P.forEach((p, i) => {
    if (state.myHunches[i] === p.remy) yourHits++;
    if (p.remyHunch === state.myPicks[i]) remyHits++;
    if (state.myPicks[i] === p.remy) twins++;
  });
  const wave = Math.round(((yourHits + remyHits) / (P.length * 2)) * 100);
  return { yourHits, remyHits, twins, wave };
}

// ── phone shell ───────────────────────────────────────────────
function Phone({ children }) {
  return (
    <div style={{
      width: 390, height: 820, borderRadius: 52, position: 'relative', overflow: 'hidden',
      background: 'var(--dawn)', color: 'var(--ink)', fontFamily: 'var(--font-ui)',
      boxShadow: '0 50px 100px rgba(58,40,70,0.26), 0 0 0 1px rgba(58,40,70,0.06), inset 0 0 0 7px #15101c',
    }}>
      <div style={{ position: 'absolute', inset: 7, borderRadius: 45, overflow: 'hidden', background: 'var(--dawn)' }}>
        <div style={{ position: 'absolute', top: -60, left: -40, width: 220, height: 220, borderRadius: 999,
          background: 'radial-gradient(circle,rgba(255,142,122,0.34),transparent 68%)', filter: 'blur(8px)' }} />
        <div style={{ position: 'absolute', top: 120, right: -70, width: 240, height: 240, borderRadius: 999,
          background: 'radial-gradient(circle,rgba(157,149,245,0.30),transparent 68%)', filter: 'blur(8px)' }} />
        <div style={{ position: 'absolute', top: 11, left: '50%', transform: 'translateX(-50%)',
          width: 116, height: 31, borderRadius: 16, background: '#15101c', zIndex: 60 }} />
        <StatusBar />
        {children}
      </div>
    </div>
  );
}
function StatusBar() {
  const c = 'var(--ink)';
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 48, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 26px',
      ...mono, fontSize: 13, fontWeight: 700, color: c }}>
      <span>9:41</span>
      <span style={{ display: 'flex', gap: 5, alignItems: 'center', opacity: 0.85 }}>
        <svg width="17" height="11" viewBox="0 0 17 11"><rect x="0" y="7" width="2.5" height="4" rx="0.6" fill={c} /><rect x="4" y="4.5" width="2.5" height="6.5" rx="0.6" fill={c} /><rect x="8" y="2" width="2.5" height="9" rx="0.6" fill={c} /><rect x="12" y="0" width="2.5" height="11" rx="0.6" fill={c} /></svg>
        <svg width="24" height="12" viewBox="0 0 24 12"><rect x="0.5" y="0.5" width="20" height="11" rx="3" stroke={c} fill="none" opacity="0.4" /><rect x="2" y="2" width="16" height="8" rx="1.6" fill={c} /><rect x="21.5" y="4" width="1.5" height="4" rx="1" fill={c} /></svg>
      </span>
    </div>
  );
}

// scroll container with safe paddings (outer is the scroller, avoids height:100% + padding clip)
function Screen({ children, pb = 104 }) {
  return (
    <div style={{ position: 'absolute', inset: 0, paddingTop: 48, overflowY: 'auto', overflowX: 'hidden', boxSizing: 'border-box', WebkitOverflowScrolling: 'touch' }}>
      <div style={{ padding: `8px 20px ${pb}px` }}>{children}</div>
    </div>
  );
}

// frosted bottom nav
function Nav({ active, go }) {
  const tabs = [['home', 'Today', I.home], ['refocus', 'Refocus', I.heart], ['us', 'Us', I.us]];
  return (
    <div style={{ position: 'absolute', left: 20, right: 20, bottom: 18, height: 62, zIndex: 40,
      borderRadius: 999, display: 'flex', alignItems: 'center', overflow: 'hidden',
      boxShadow: '0 12px 34px rgba(58,40,70,0.18)' }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: 999, backdropFilter: 'blur(18px) saturate(180%)',
        WebkitBackdropFilter: 'blur(18px) saturate(180%)', background: 'rgba(255,253,253,0.66)',
        border: '1px solid rgba(255,255,255,0.6)' }} />
      {tabs.map(t => {
        const on = t[0] === active;
        const isRef = t[0] === 'refocus';
        const col = isRef || on ? 'var(--p1-deep)' : 'var(--ink-mute)';
        return (
          <Press key={t[0]} onClick={() => go(t[0])} scale={false} style={{ flex: 1, width: 'auto' }}>
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, color: col }}>
              <G d={t[2]} size={isRef ? 22 : 21} sw={isRef ? 1.5 : (on ? 2 : 1.6)} c={col} fill={isRef ? 'var(--p1)' : 'none'} />
              <span style={{ ...mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: on || isRef ? 700 : 400 }}>{t[1]}</span>
            </div>
          </Press>
        );
      })}
    </div>
  );
}

// top bar for sub-screens (back + title + optional right)
function TopBar({ title, onBack, right }) {
  return (
    <div style={{ position: 'absolute', top: 48, left: 0, right: 0, height: 52, zIndex: 30,
      display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10 }}>
      <Press onClick={onBack} scale={false} style={{ width: 'auto' }}>
        <div style={{ width: 38, height: 38, borderRadius: 999, background: 'var(--surface-soft)',
          backdropFilter: 'blur(8px)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <G d={I.back} size={20} c="var(--ink)" />
        </div>
      </Press>
      <div style={{ flex: 1, textAlign: 'center', ...mono, fontSize: 11, letterSpacing: '0.14em',
        textTransform: 'uppercase', color: 'var(--ink-soft)' }}>{title}</div>
      <div style={{ width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{right}</div>
    </div>
  );
}

// bottom sheet
function Sheet({ children, onClose, title }) {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 80, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(40,28,50,0.4)',
        backdropFilter: 'blur(2px)', animation: 'pxdim .25s ease' }} />
      <div style={{ position: 'relative', background: 'var(--surface)', borderTopLeftRadius: 32, borderTopRightRadius: 32,
        padding: '12px 20px 26px', boxShadow: 'var(--shadow-pop)', animation: 'pxsheet .34s cubic-bezier(.22,.9,.3,1)' }}>
        <div style={{ width: 40, height: 4.5, borderRadius: 3, background: 'var(--sunken)', margin: '0 auto 16px' }} />
        {title && <div style={{ ...mono, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase',
          color: 'var(--ink-mute)', textAlign: 'center', marginBottom: 14 }}>{title}</div>}
        {children}
      </div>
    </div>
  );
}
function Toast({ msg }) {
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 96, zIndex: 90, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
      <div style={{ background: 'var(--ink)', color: '#fff', padding: '11px 18px', borderRadius: 999,
        fontSize: 13.5, fontWeight: 600, boxShadow: 'var(--shadow)', maxWidth: '80%', animation: 'pxtoast .3s ease' }}>{msg}</div>
    </div>
  );
}

window.PXC = {
  useState, useEffect, useRef, YOU, PAR, TAGLINE, DROP, PACKS, PACK_SAMPLE, ARCHIVE, THREAD, P,
  I, G, Mark, Peek, Slashes, Wordmark, anaglyph, mono, serif, Kick, Serif, Tok, Press, Btn, cardBase,
  Brand, Chip, Stat, Ring, reveal, Phone, StatusBar, Screen, Nav, TopBar, Sheet, Toast,
  LEARNINGS, MASTERY, ACTIVITY,
};
