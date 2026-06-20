// Parallax (couples) — Activity inbox (two-player pulse) + milestone celebration. Exports window.PXA.
const { useState, useEffect, YOU, PAR, I, G, Peek, Mark, mono, serif, Kick, Serif, Tok, Press, Btn, cardBase,
  Screen, TopBar, ACTIVITY } = window.PXC;

// ── ACTIVITY INBOX ────────────────────────────────────────────
function Activity({ back, go, openPlay, openStreak, toast }) {
  const [items, setItems] = useState(ACTIVITY);
  useEffect(() => {
    // mark read on open (clears the red dot)
    const t = setTimeout(() => setItems(a => a.map(x => ({ ...x, unread: false }))), 900);
    return () => clearTimeout(t);
  }, []);
  const act = (cta) => {
    if (cta === 'play') openPlay();
    else if (cta === 'streak') openStreak();
    else if (cta) go(cta);
  };
  return (
    <>
      <TopBar title="activity" onBack={back} right={
        <Press onClick={() => { setItems(a => a.map(x => ({ ...x, unread: false }))); toast('All caught up'); }} scale={false} style={{ width: 'auto' }}>
          <G d={I.check} size={19} c="var(--ink-soft)" sw={2} />
        </Press>
      } />
      <Screen pb={40}>
        <div style={{ height: 50 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map(a => {
            const tappable = !!a.cta;
            return (
              <Press key={a.id} onClick={() => tappable && act(a.cta)} scale={tappable}>
                <div style={{ ...cardBase, borderRadius: 20, padding: '14px 15px', display: 'flex', alignItems: 'center', gap: 13,
                  background: a.unread ? 'var(--us-soft)' : 'var(--surface)', border: `1px solid ${a.unread ? 'rgba(157,149,245,0.28)' : 'var(--line)'}` }}>
                  <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 13, background: 'var(--sunken)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 21 }}>{a.emoji}</div>
                    {a.who !== 'us' && <div style={{ position: 'absolute', bottom: -3, right: -3 }}><Tok who={a.who === 'you' ? YOU : PAR} you={a.who === 'you'} size={20} /></div>}
                  </div>
                  <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.3 }}>{a.title}</div>
                    <div style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.4, marginTop: 2 }}>{a.body}</div>
                    <Kick style={{ marginTop: 5 }}>{a.when}</Kick>
                  </div>
                  {a.unread && <div style={{ width: 9, height: 9, borderRadius: 999, background: 'var(--p1-deep)', flexShrink: 0 }} />}
                  {!a.unread && tappable && <G d={I.chevR} size={16} c="var(--ink-mute)" />}
                </div>
              </Press>
            );
          })}
        </div>
        <div style={{ textAlign: 'center', ...mono, fontSize: 10.5, color: 'var(--ink-mute)', marginTop: 22 }}>that’s everything · just you two</div>
      </Screen>
    </>
  );
}

// ── MILESTONE CELEBRATION ─────────────────────────────────────
// Shareable peak-delight moment when a shared streak crosses a milestone.
function Milestone({ days = 30, back, share }) {
  const line = days >= 365 ? 'A year of choosing\neach other.' : days >= 100 ? 'Triple digits.\nThe real deal.' : days >= 30 ? 'You’re officially\na streak couple.' : 'One week strong.';
  const sub = days >= 365 ? '365 tiny moments of showing up. That’s a love story.'
    : days >= 100 ? 'A hundred days in a row. Most couples never get close.'
    : days >= 30 ? 'A whole month of showing up for each other. That’s rarer than you think.'
    : 'Seven days in a row. This is how rituals are born.';
  const hearts = Array.from({ length: 12 }, (_, i) => ({ id: i, x: 4 + Math.random() * 92, d: Math.random() * 0.9, e: ['🔥', '✨', '💞', '🎉', '💗'][i % 5] }));
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'var(--us)', overflow: 'hidden',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 32px', textAlign: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(70% 50% at 50% 12%,rgba(255,255,255,0.4),transparent 60%)' }} />
      {hearts.map(h => (
        <div key={h.id} style={{ position: 'absolute', bottom: 90, left: `${h.x}%`, fontSize: 24,
          animation: `pxheart 2s ease-out ${h.d}s forwards`, pointerEvents: 'none' }}>{h.e}</div>
      ))}
      <Press onClick={back} scale={false} style={{ position: 'absolute', top: 52, right: 16, width: 'auto', zIndex: 30 }}>
        <div style={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><G d={I.close} size={17} c="#fff" sw={2} /></div>
      </Press>

      <div style={{ position: 'relative', zIndex: 10 }}>
        <div style={{ position: 'relative', width: 140, height: 140, margin: '0 auto' }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: 999, background: 'rgba(255,255,255,0.18)', animation: 'pxfloat 3.5s ease-in-out infinite' }} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 72 }}>🔥</div>
        </div>
        <div style={{ ...serif, fontSize: 92, color: '#fff', lineHeight: 1, marginTop: 8 }}>{days}</div>
        <Kick c="rgba(255,255,255,0.9)" style={{ marginTop: 2 }}>days in a row, together</Kick>
        <Serif s={40} italic c="#fff" style={{ marginTop: 16, lineHeight: 1.08, whiteSpace: 'pre-line' }}>{line}</Serif>
        <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.92)', lineHeight: 1.5, marginTop: 12, maxWidth: 290, marginLeft: 'auto', marginRight: 'auto' }}>
          {sub}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 18 }}>
          <Tok who={YOU} you size={40} ring /><div style={{ marginLeft: -12 }}><Tok who={PAR} size={40} ring /></div>
        </div>
      </div>

      <div style={{ position: 'absolute', left: 28, right: 28, bottom: 30, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Btn kind="soft" onClick={share} sub="show it off">Share our milestone</Btn>
        <Press onClick={back}><div style={{ textAlign: 'center', padding: 10, fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.92)' }}>Keep it going</div></Press>
      </div>
    </div>
  );
}

window.PXA = { Activity, Milestone };
