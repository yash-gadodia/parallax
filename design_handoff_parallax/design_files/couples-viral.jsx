// Parallax (couples), viral engines: Widget (Locket), Wrapped + Couple Type (Spotify), Shared Streak (Duolingo).
const { useState, useEffect, useRef, YOU, PAR, DROP, P, I, G, Mark,
  mono, serif, Kick, Serif, Tok, Press, Btn, cardBase, Ring, Screen, TopBar } = window.PXC;

// ════════════════════════════════════════════════════════════
//  WIDGET, the home-screen growth engine
// ════════════════════════════════════════════════════════════

// the live medium widget (reused in setup + on the springboard)
function WaveWidget({ onTap, big }) {
  return (
    <Press onClick={onTap} scale={!!onTap}>
      <div style={{ borderRadius: 26, background: 'var(--surface)', overflow: 'hidden',
        boxShadow: '0 12px 30px rgba(58,40,70,0.18)', padding: '15px 16px', textAlign: 'left',
        height: big ? 158 : 150, boxSizing: 'border-box', position: 'relative' }}>
        <div style={{ position: 'absolute', top: -24, right: -24, width: 96, height: 96, borderRadius: 999, background: 'var(--us-soft)', filter: 'blur(4px)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, position: 'relative' }}>
          <Mark size={17} /><span style={{ ...mono, fontSize: 9.5, letterSpacing: '0.12em', color: 'var(--ink-mute)', textTransform: 'uppercase' }}>today</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 12, position: 'relative' }}>
          <div style={{ position: 'relative', width: 70, height: 70, flexShrink: 0 }}>
            <Ring pct={83} size={70} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ ...serif, fontSize: 22, background: 'var(--us)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>83</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.2 }}>Dani played 💌</div>
            <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 3, lineHeight: 1.35 }}>your turn, tap to see how in&#8209;sync you are</div>
          </div>
        </div>
      </div>
    </Press>
  );
}

// the small tap-to-ping widget
function PingWidget({ onTap }) {
  return (
    <Press onClick={onTap}>
      <div style={{ width: '100%', aspectRatio: '1', borderRadius: 24, background: 'var(--us)', position: 'relative', overflow: 'hidden',
        boxShadow: '0 12px 30px rgba(112,100,230,0.24)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(70% 80% at 50% 0%,rgba(255,255,255,0.4),transparent 60%)' }} />
        <div style={{ fontSize: 30, position: 'relative' }}>💞</div>
        <div style={{ ...mono, fontSize: 8.5, letterSpacing: '0.1em', color: '#fff', textTransform: 'uppercase', marginTop: 6, position: 'relative', fontWeight: 700 }}>tap to ping</div>
      </div>
    </Press>
  );
}

function WidgetSetup({ go }) {
  return (
    <>
      <TopBar title="home screen" onBack={() => go('home')} />
      <Screen pb={120}>
        <div style={{ height: 50 }} />
        <Kick c="var(--p2-deep)">live on your home screen</Kick>
        <Serif s={38} style={{ margin: '10px 0 8px' }}>See Dani all day, not just in the app.</Serif>
        <div style={{ fontSize: 15, color: 'var(--ink-soft)', lineHeight: 1.5, marginBottom: 24 }}>
          A little piece of <i>us</i> on your home screen. Your wavelength updates live, and one tap sends Dani a “thinking of you.”
        </div>

        {/* preview on a mini wallpaper */}
        <div style={{ borderRadius: 30, padding: 22, background: 'linear-gradient(160deg,#FCEFF0,#EEEDFB)', boxShadow: 'var(--shadow)' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>
            <div style={{ flex: 1.6 }}><WaveWidget /></div>
            <div style={{ flex: 1 }}><PingWidget onTap={() => {}} /></div>
          </div>
        </div>
      </Screen>
      <div style={{ position: 'absolute', left: 20, right: 20, bottom: 22, zIndex: 40 }}>
        <Btn kind="us" onClick={() => go('homeScreen')} sub="long-press · add widget"><span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><G d={I.grid} size={17} c="#fff" />Add to Home Screen</span></Btn>
      </div>
    </>
  );
}

// the iOS springboard, the screen-recordable viral asset
function AppIcon({ label, bg, glyph, mark, onTap }) {
  return (
    <Press onClick={onTap} scale={!!onTap} style={{ width: 'auto' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 58, height: 58, borderRadius: 15, background: bg, boxShadow: '0 4px 12px rgba(58,40,70,0.18)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {mark ? <Mark size={30} /> : glyph}
        </div>
        <span style={{ fontSize: 10.5, color: 'rgba(58,51,64,0.78)', fontWeight: 500 }}>{label}</span>
      </div>
    </Press>
  );
}

function HomeScreen({ go, openPlay, toast }) {
  const [hearts, setHearts] = useState([]);
  const ping = () => {
    const id = Date.now();
    const burst = Array.from({ length: 6 }, (_, i) => ({ id: id + i, x: 10 + Math.random() * 80, d: Math.random() * 0.4, e: ['💞', '💗', '🫶', '❤️'][i % 4] }));
    setHearts(h => [...h, ...burst]);
    toast('Dani felt that 💞');
    setTimeout(() => setHearts(h => h.filter(x => !burst.find(b => b.id === x.id))), 1800);
  };
  const ic = (d, c) => <G d={d} size={26} c={c} sw={1.5} />;
  return (
    <div style={{ position: 'absolute', inset: 0, paddingTop: 48 }}>
      {/* exit pill */}
      <Press onClick={() => go('home')} scale={false} style={{ position: 'absolute', top: 54, right: 18, width: 'auto', zIndex: 30 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 13px', borderRadius: 999,
          background: 'rgba(255,253,253,0.66)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.6)' }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink)' }}>Back to app</span>
        </div>
      </Press>

      {/* clock */}
      <div style={{ textAlign: 'center', marginTop: 18 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'rgba(58,51,64,0.8)' }}>Sunday, June 8</div>
        <div style={{ fontSize: 78, fontWeight: 600, color: 'var(--ink)', lineHeight: 1, letterSpacing: '-0.02em', marginTop: 2,
          fontFamily: 'var(--font-ui)' }}>9:41</div>
      </div>

      {/* widgets */}
      <div style={{ padding: '24px 22px 0' }}>
        <div style={{ display: 'flex', gap: 13, alignItems: 'stretch' }}>
          <div style={{ flex: 1.6 }}><WaveWidget big onTap={openPlay} /></div>
          <div style={{ flex: 1 }}><PingWidget onTap={ping} /></div>
        </div>
      </div>

      {/* app icon grid */}
      <div style={{ padding: '26px 26px 0', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', rowGap: 18 }}>
        <AppIcon label="Parallax" bg="#fff" mark onTap={() => go('home')} />
        <AppIcon label="Messages" bg="#34C759" glyph={ic(I.chat, '#fff')} />
        <AppIcon label="Camera" bg="#3A3340" glyph={ic('M5 7h2l1-1.5h4L13 7h2a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1V8a1 1 0 011-1zM10 13a2.3 2.3 0 100-4.6 2.3 2.3 0 000 4.6z', '#fff')} />
        <AppIcon label="Photos" bg="linear-gradient(135deg,#FF8E7A,#9D95F5)" glyph={ic(I.spark, '#fff')} />
        <AppIcon label="Notes" bg="#FFD60A" glyph={ic(I.pencil, '#3A3340')} />
        <AppIcon label="Music" bg="#FF6A53" glyph={ic('M7 14V5l8-1.5V12M7 14a2 2 0 11-2.5-1.9M15 12a2 2 0 11-2.5-1.9', '#fff')} />
        <AppIcon label="Maps" bg="#54C2A0" glyph={ic('M10 17s5-4.5 5-8a5 5 0 00-10 0c0 3.5 5 8 5 8zM10 7.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z', '#fff')} />
        <AppIcon label="Settings" bg="#8B8398" glyph={ic(I.gear, '#fff')} />
      </div>

      {/* dock */}
      <div style={{ position: 'absolute', left: 16, right: 16, bottom: 16, height: 86, borderRadius: 32,
        background: 'rgba(255,255,255,0.42)', backdropFilter: 'blur(20px) saturate(180%)', WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '0 18px' }}>
        <AppIcon label="" bg="#34C759" glyph={ic('M4 5.5h12a1 1 0 011 1v6a1 1 0 01-1 1H9l-3.5 3v-3H4a1 1 0 01-1-1v-6a1 1 0 011-1z', '#fff')} />
        <AppIcon label="" bg="#3A82F7" glyph={ic('M3 6.5h14M3 10h14M3 13.5h9', '#fff')} />
        <AppIcon label="" bg="#fff" mark onTap={() => go('home')} />
        <AppIcon label="" bg="#5A8DEE" glyph={ic(I.us, '#fff')} />
      </div>

      {/* hearts */}
      {hearts.map(h => (
        <div key={h.id} style={{ position: 'absolute', bottom: 200, left: `${h.x}%`, fontSize: 26, zIndex: 25,
          animation: `pxheart 1.6s ease-out ${h.d}s forwards`, pointerEvents: 'none' }}>{h.e}</div>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  US, WRAPPED, the shareable identity artifact
// ════════════════════════════════════════════════════════════
const WRAP = [
  { bg: 'linear-gradient(160deg,#FF8E7A,#9D95F5)', kind: 'cover' },
  { bg: 'linear-gradient(160deg,#7064E6,#C387C9)', kicker: 'you showed up', big: '28', unit: 'drops, together', sub: 'You didn’t miss a single Sunday this month.' },
  { bg: 'linear-gradient(160deg,#54C2A0,#9D95F5)', kicker: 'in perfect step', big: '38', unit: 'twin moments', sub: 'The times you said the exact same thing, blind. 👯' },
  { bg: 'linear-gradient(160deg,#EF6A53,#C387C9)', kicker: 'the one you kept missing', big: '🌧', unit: '', sub: '“When I’m overwhelmed, what I need…”, it took you three tries. Now you know it by heart.' },
  { bg: 'var(--us)', kind: 'type' },
  { bg: 'linear-gradient(160deg,#9D95F5,#FF8E7A)', kind: 'share' },
];
const COUPLE_TYPE = {
  name: 'The Slow Burn', emoji: '🔥',
  line: 'You don’t say everything out loud, you let it unfold.',
  body: 'Your lightest answers match instantly, but your deepest ones land on the second guess, not the first. That’s not distance. That’s a couple still discovering each other on purpose.',
  traits: ['Quietly devoted', 'Deep over fast', 'Curious about each other'],
};

function Wrapped({ back, share }) {
  const [i, setI] = useState(0);
  const card = WRAP[i];
  const next = () => i < WRAP.length - 1 ? setI(i + 1) : back();
  const prev = () => i > 0 && setI(i - 1);

  return (
    <div style={{ position: 'absolute', inset: 0, background: card.bg, transition: 'background .4s ease', overflow: 'hidden' }}>
      {/* sheen */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(80% 60% at 80% 0%,rgba(255,255,255,0.35),transparent 55%)' }} />

      {/* progress bars */}
      <div style={{ position: 'absolute', top: 56, left: 16, right: 16, display: 'flex', gap: 5, zIndex: 20 }}>
        {WRAP.map((_, k) => (
          <div key={k} style={{ flex: 1, height: 3.5, borderRadius: 3, background: 'rgba(255,255,255,0.35)', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 3, background: '#fff', width: k < i ? '100%' : k === i ? '100%' : '0%',
              animation: k === i ? 'pxbar 0.5s ease both' : 'none' }} />
          </div>
        ))}
      </div>
      <Press onClick={back} scale={false} style={{ position: 'absolute', top: 50, right: 14, width: 'auto', zIndex: 30 }}>
        <div style={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><G d={I.close} size={17} c="#fff" sw={2} /></div>
      </Press>

      {/* tap zones */}
      <Press onClick={prev} scale={false} style={{ position: 'absolute', left: 0, top: 80, bottom: 0, width: '32%', zIndex: 15 }}><div /></Press>
      <Press onClick={next} scale={false} style={{ position: 'absolute', right: 0, top: 80, bottom: 90, width: '68%', zIndex: 15 }}><div /></Press>

      {/* content */}
      <div style={{ position: 'absolute', inset: 0, paddingTop: 80, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        alignItems: 'center', textAlign: 'center', padding: '80px 34px 30px', zIndex: 18 }} key={i}>
        {card.kind === 'cover' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 22 }}>
              <Tok who={YOU} you size={66} ring /><div style={{ marginLeft: -18 }}><Tok who={PAR} size={66} ring /></div>
            </div>
            <Kick c="rgba(255,255,255,0.85)">parallax · june</Kick>
            <Serif s={62} c="#fff" style={{ marginTop: 10, lineHeight: 1.04 }}>Your month,<br />wrapped</Serif>
            <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.9)', marginTop: 14 }}>Yash &amp; Dani · tap to begin →</div>
          </div>
        )}
        {(card.big && card.kind !== 'type') && (
          <div>
            <Kick c="rgba(255,255,255,0.85)">{card.kicker}</Kick>
            <div style={{ ...serif, fontSize: card.big.length > 2 ? 120 : 150, color: '#fff', lineHeight: 0.9, margin: '14px 0 6px' }}>{card.big}</div>
            {card.unit && <Serif s={34} italic c="#fff">{card.unit}</Serif>}
            <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.92)', lineHeight: 1.5, marginTop: 18, maxWidth: 280 }}>{card.sub}</div>
          </div>
        )}
        {card.kind === 'type' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <Kick c="rgba(255,255,255,0.85)">your couple type</Kick>
            <div style={{ fontSize: 56, lineHeight: 1 }}>{COUPLE_TYPE.emoji}</div>
            <Serif s={48} c="#fff" style={{ lineHeight: 1.12 }}>{COUPLE_TYPE.name}</Serif>
            <Serif s={21} italic c="rgba(255,255,255,0.95)" style={{ lineHeight: 1.25 }}>{COUPLE_TYPE.line}</Serif>
            <div style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.9)', lineHeight: 1.55, maxWidth: 300 }}>{COUPLE_TYPE.body}</div>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', justifyContent: 'center' }}>
              {COUPLE_TYPE.traits.map(t => (
                <span key={t} style={{ padding: '7px 13px', borderRadius: 999, background: 'rgba(255,255,255,0.22)',
                  color: '#fff', fontSize: 13, fontWeight: 600 }}>{t}</span>
              ))}
            </div>
          </div>
        )}
        {card.kind === 'share' && (
          <div style={{ width: '100%' }}>
            <Serif s={44} c="#fff" style={{ lineHeight: 1.08 }}>Show the<br />world your type.</Serif>
            <div style={{ background: 'rgba(255,255,255,0.16)', borderRadius: 24, padding: '20px 18px', margin: '24px 0', backdropFilter: 'blur(6px)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9 }}>
                <span style={{ fontSize: 26 }}>{COUPLE_TYPE.emoji}</span>
                <Serif s={28} c="#fff" style={{ lineHeight: 1.1 }}>{COUPLE_TYPE.name}</Serif>
              </div>
              <div style={{ ...mono, fontSize: 11, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.85)' }}>YASH &amp; DANI · 83% IN SYNC</div>
            </div>
            <Btn kind="soft" onClick={share} sub="post your wrapped">Share our Wrapped</Btn>
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  SHARED STREAK, mutual accountability (Duolingo, for two)
// ════════════════════════════════════════════════════════════
const MILES = [7, 30, 50, 100, 365];

function Streak({ state, back, toast, openMilestone }) {
  const streak = state.streak;
  const week = [true, true, true, true, true, true, false]; // mon..sun, today not yet
  const next = MILES.find(m => m > streak) || 365;
  const prevM = [0, ...MILES].reverse().find(m => m <= streak) || 0;
  const prog = Math.min(1, (streak - prevM) / (next - prevM));
  const [frozen, setFrozen] = useState(false);
  return (
    <>
      <TopBar title="your streak" onBack={back} />
      <Screen pb={40}>
        <div style={{ height: 50 }} />
        {/* hero flame */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ position: 'relative', width: 150, height: 150, margin: '0 auto' }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: 999, background: 'radial-gradient(circle,rgba(255,142,122,0.32),transparent 65%)', animation: 'pxfloat 3.5s ease-in-out infinite' }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 72 }}>🔥</div>
          </div>
          <div style={{ ...serif, fontSize: 66, lineHeight: 1, marginTop: 4,
            background: 'var(--us)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{streak}</div>
          <Kick style={{ marginTop: 6 }}>day shared streak</Kick>
          {/* both faces */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 14 }}>
            <Tok who={YOU} you size={34} ring /><div style={{ marginLeft: -10 }}><Tok who={PAR} size={34} ring /></div>
          </div>
        </div>

        {/* mutual accountability */}
        <div style={{ ...cardBase, borderRadius: 22, padding: '15px 16px', marginTop: 22, background: 'var(--us-soft)', border: '1px solid rgba(157,149,245,0.25)', textAlign: 'center' }}>
          <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.5 }}>
            This one’s <i>shared</i>. If <b>either</b> of you skips a day, it resets to zero, so you keep each other honest.
          </div>
        </div>

        {/* this week */}
        <div style={{ marginTop: 22, marginBottom: 10 }}><Kick>this week</Kick></div>
        <div style={{ ...cardBase, borderRadius: 20, padding: '16px 14px', display: 'flex', justifyContent: 'space-between' }}>
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, k) => (
            <div key={k} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <span style={{ ...mono, fontSize: 10, color: 'var(--ink-mute)' }}>{d}</span>
              <div style={{ width: 30, height: 30, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: week[k] ? 'var(--us)' : (k === 6 ? 'var(--sunken)' : 'var(--sunken)'),
                border: k === 6 ? '1.5px dashed var(--p1)' : 'none' }}>
                {week[k] ? <G d={I.check} size={15} c="#fff" sw={2.4} /> : (k === 6 ? <span style={{ fontSize: 13 }}>🔥</span> : null)}
              </div>
            </div>
          ))}
        </div>
        <div style={{ ...mono, fontSize: 11, color: 'var(--p1-deep)', textAlign: 'center', marginTop: 10, fontWeight: 700 }}>play today to keep it alive, 9h 12m left</div>

        {/* milestones */}
        <div style={{ marginTop: 24, marginBottom: 10 }}><Kick>milestones · next at {next}</Kick></div>
        <div style={{ ...cardBase, borderRadius: 22, padding: '18px 16px' }}>
          <div style={{ height: 8, borderRadius: 999, background: 'var(--sunken)', overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ height: '100%', width: `${prog * 100}%`, background: 'var(--us)', borderRadius: 999 }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            {MILES.map(m => {
              const hit = streak >= m, isNext = m === next;
              return (
                <Press key={m} onClick={() => (hit || isNext) && openMilestone && openMilestone(m)} scale={hit || isNext} style={{ width: 'auto', flex: 1 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 999, margin: '0 auto',
                    background: hit ? 'var(--us)' : isNext ? 'var(--surface)' : 'var(--sunken)',
                    border: isNext ? '2px solid var(--p2)' : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, boxShadow: hit ? 'var(--shadow-soft)' : 'none' }}>
                    {hit ? '🔥' : isNext ? '✨' : '🔒'}
                  </div>
                  <div style={{ ...mono, fontSize: 10, fontWeight: 700, color: hit ? 'var(--p1-deep)' : 'var(--ink-mute)', marginTop: 6 }}>{m}</div>
                </div>
                </Press>
              );
            })}
          </div>
        </div>

        {/* streak freeze, forgiveness */}
        <div style={{ ...cardBase, borderRadius: 22, padding: '16px', marginTop: 14, display: 'flex', alignItems: 'center', gap: 13 }}>
          <div style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(90,141,238,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🧊</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--ink)' }}>Streak freeze · {frozen ? 1 : 2} left</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 2, lineHeight: 1.4 }}>Life happens. A freeze saves your streak for one missed day, for both of you.</div>
          </div>
          <Press onClick={() => { if (!frozen) { setFrozen(true); toast('Freeze armed 🧊 you’re covered'); } }} scale={false} style={{ width: 'auto' }}>
            <div style={{ padding: '9px 14px', borderRadius: 999, background: frozen ? 'var(--sunken)' : 'var(--ink)', color: frozen ? 'var(--ink-mute)' : '#fff', fontSize: 13, fontWeight: 700 }}>{frozen ? 'Armed' : 'Arm'}</div>
          </Press>
        </div>

        <div style={{ textAlign: 'center', ...mono, fontSize: 11, color: 'var(--ink-mute)', marginTop: 18 }}>longest streak together · 41 days</div>
      </Screen>
    </>
  );
}

window.PXV = { WidgetSetup, HomeScreen, Wrapped, Streak };
