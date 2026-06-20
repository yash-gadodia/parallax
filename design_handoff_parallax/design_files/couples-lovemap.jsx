// Parallax (couples), Love Map: what you're learning about each other.
// The loop made visible: fights (refocus) + daily drops both become learnings,
// learnings become future questions, mastery grows over time.
const { YOU, PAR, I, G, Peek, mono, serif, Kick, Serif, Tok, Press, Btn, cardBase,
  Screen, TopBar, LEARNINGS, MASTERY } = window.PXC;

function Mastery({ level }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ display: 'flex', gap: 4 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{ width: 22, height: 5, borderRadius: 3,
            background: i <= level ? 'var(--us)' : 'var(--sunken)' }} />
        ))}
      </div>
      <span style={{ ...mono, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase',
        color: level >= 2 ? 'var(--match-deep)' : 'var(--ink-mute)', fontWeight: 700 }}>{MASTERY[level]}</span>
    </div>
  );
}

function WhoChip({ who }) {
  const you = who === 'you';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px 4px 4px', borderRadius: 999,
      background: you ? 'rgba(255,142,122,0.14)' : 'rgba(157,149,245,0.16)' }}>
      <Tok who={you ? YOU : PAR} you={you} size={18} />
      <span style={{ fontSize: 12, fontWeight: 700, color: you ? 'var(--p1-deep)' : 'var(--p2-deep)' }}>{you ? 'You' : 'Dani'}</span>
    </span>
  );
}

function LearnCard({ l }) {
  const you = l.who === 'you';
  const fromFight = l.from === 'refocus';
  return (
    <div style={{ ...cardBase, borderRadius: 22, padding: '16px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 11 }}>
        <span style={{ fontSize: 22 }}>{l.emoji}</span>
        <WhoChip who={l.who} />
        <div style={{ flex: 1 }} />
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, ...mono, fontSize: 8.5, fontWeight: 700,
          letterSpacing: '0.06em', color: fromFight ? 'var(--p2-deep)' : 'var(--ink-soft)',
          background: fromFight ? 'rgba(157,149,245,0.16)' : 'var(--sunken)', padding: '4px 8px', borderRadius: 999 }}>
          {fromFight ? '💢 FROM A FIGHT' : '💬 FROM A DROP'}
        </span>
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.3 }}>{l.need}</div>
      <div style={{ fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.45, marginTop: 4 }}>{l.detail}</div>
      <div style={{ marginTop: 13, paddingTop: 13, borderTop: '1px solid var(--line)' }}>
        <Mastery level={l.mastery} />
      </div>
      {l.becameQ && (
        <div style={{ marginTop: 12, padding: '12px 13px', borderRadius: 14, background: 'var(--us-soft)', border: '1px solid rgba(157,149,245,0.22)' }}>
          <div style={{ ...mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--p2-deep)', marginBottom: 5 }}>🎯 now a question in your drops</div>
          <div style={{ fontSize: 13.5, color: 'var(--ink)', fontStyle: 'italic', fontFamily: 'var(--font-disp)', lineHeight: 1.4 }}>“{l.becameQ}”</div>
        </div>
      )}
    </div>
  );
}

function LoveMap({ back, openRefocus, toast }) {
  const fightCount = LEARNINGS.filter(l => l.from === 'refocus').length;
  return (
    <>
      <TopBar title="love map" onBack={back} />
      <Screen pb={120}>
        <div style={{ height: 46 }} />
        {/* hero */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
            <div style={{ animation: 'pxfloat 4s ease-in-out infinite' }}><Peek size={76} mood="focus" /></div>
          </div>
          <Serif s={36} style={{ lineHeight: 1.06 }}>What you’re learning<br />about each other</Serif>
          <div style={{ fontSize: 14.5, color: 'var(--ink-soft)', lineHeight: 1.55, maxWidth: 300, margin: '10px auto 0' }}>
            Every drop and every fight teaches Parallax a little more about how you each see the world. The more it knows, the better its questions get.
          </div>
        </div>

        {/* the loop, made visible */}
        <div style={{ borderRadius: 24, overflow: 'hidden', marginTop: 22, boxShadow: 'var(--shadow)' }}>
          <div style={{ background: 'var(--us)', padding: '18px 18px 20px', position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(70% 100% at 85% 0%,rgba(255,255,255,0.4),transparent 60%)' }} />
            <div style={{ position: 'relative' }}>
              <div style={{ ...mono, fontSize: 9.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.9)' }}>the parallax loop</div>
              <Serif s={24} c="#fff" style={{ marginTop: 4 }}>A fight becomes a lesson.</Serif>
              <div style={{ display: 'flex', alignItems: 'stretch', gap: 9, marginTop: 14 }}>
                {[['💢', 'you fought', 'the Saturday silence'], ['🤍', 'you refocused', 'found each other’s side'], ['🎯', 'it became a Q', 'now in your drops']].map((s, i) => (
                  <React.Fragment key={i}>
                    <div style={{ flex: 1, background: 'rgba(255,255,255,0.16)', borderRadius: 14, padding: '11px 8px', textAlign: 'center' }}>
                      <div style={{ fontSize: 20 }}>{s[0]}</div>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: '#fff', marginTop: 5, lineHeight: 1.2 }}>{s[1]}</div>
                      <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.85)', marginTop: 2, lineHeight: 1.25 }}>{s[2]}</div>
                    </div>
                    {i < 2 && <div style={{ display: 'flex', alignItems: 'center', color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>→</div>}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* learnings */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '24px 2px 12px' }}>
          <Kick>the map · {LEARNINGS.length} learnings</Kick>
          <span style={{ ...mono, fontSize: 10, color: 'var(--ink-mute)' }}>{fightCount} from fights</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {LEARNINGS.map(l => <LearnCard key={l.id} l={l} />)}
        </div>

        <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--ink-mute)', marginTop: 20, lineHeight: 1.5, padding: '0 14px' }}>
          The more honestly you play, the sharper your map. Nothing here is ever shown to anyone outside the two of you.
        </div>
      </Screen>

      <div style={{ position: 'absolute', left: 20, right: 20, bottom: 22, zIndex: 40 }}>
        <Btn kind="soft" onClick={openRefocus} sub="turn a rough moment into a lesson">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><G d={I.heart} size={17} c="var(--p2-deep)" />Refocus something</span>
        </Btn>
      </div>
    </>
  );
}

window.PXM = { LoveMap };
