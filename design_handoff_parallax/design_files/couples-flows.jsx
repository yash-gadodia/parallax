// Parallax (couples), onboarding + detail flows. Exports window.PXF.
const { useState, useEffect, useRef, YOU, PAR, TAGLINE, DROP, PACKS, PACK_SAMPLE, ARCHIVE, THREAD, P,
  I, G, Mark, Peek, Wordmark, anaglyph, mono, serif, Kick, Serif, Tok, Press, Btn, cardBase,
  Brand, Chip, reveal, Screen, TopBar, Sheet } = window.PXC;

// ── ONBOARDING ────────────────────────────────────────────────
const INTENTS = [
  ['know', '🔍', 'Know each other more deeply'],
  ['talk', '💬', 'Spark better conversations'],
  ['rough', '🌧️', 'Navigate the hard moments'],
  ['far', '✈️', 'Stay close, long-distance'],
  ['fun', '🎈', 'Just have more fun together'],
];
const MOMENTS = [
  ['morning', '☕', 'Morning coffee', '8:00 AM'],
  ['lunch', '🥪', 'Lunch break', '12:30 PM'],
  ['evening', '🌙', 'Evening wind-down', '8:00 PM'],
  ['bed', '😴', 'Before bed', '10:30 PM'],
];
function Onboarding({ finish }) {
  const [step, setStep] = useState(0);
  const [intent, setIntent] = useState(['know']);
  const [moment, setMoment] = useState('evening');
  const next = () => setStep(s => Math.min(5, s + 1));
  const toggleIntent = (id) => setIntent(a => a.includes(id) ? a.filter(x => x !== id) : [...a, id]);
  const code = 'YASH-4827';
  const Dots = ({ n, of }) => (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
      {Array.from({ length: of }).map((_, i) => (
        <div key={i} style={{ width: i === n ? 20 : 6, height: 6, borderRadius: 999,
          background: i === n ? 'var(--us)' : 'var(--sunken)', transition: 'width .3s ease' }} />
      ))}
    </div>
  );

  // 0 welcome · 1 how it works · 2 intent · 3 pair · 4 joined · 5 notify
  if (step === 0) {
    return (
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', padding: '0 30px',
        paddingTop: 48 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <div style={{ animation: 'pxfloat 4s ease-in-out infinite' }}><Peek size={132} mood="love" /></div>
          <div style={{ marginTop: 24 }}><Wordmark size={64} /></div>
          <Serif s={24} italic c="var(--ink-soft)" style={{ marginTop: 8, whiteSpace: 'nowrap' }}>{TAGLINE}</Serif>
          <div style={{ fontSize: 15.5, color: 'var(--ink-soft)', lineHeight: 1.55, marginTop: 20, maxWidth: 302 }}>
            A little daily ritual to know each other better, and <b style={{ fontWeight: 700, color: 'var(--p1-deep)' }}>Refocus</b> for the rough patches.
          </div>
        </div>
        <div style={{ paddingBottom: 30, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Btn kind="us" onClick={next} sub="takes a minute">Get started</Btn>
          <Press onClick={finish}><div style={{ textAlign: 'center', padding: 8, fontSize: 14, fontWeight: 600, color: 'var(--ink-mute)' }}>I already have an account</div></Press>
        </div>
      </div>
    );
  }

  if (step === 1) {
    const rows = [
      ['var(--p1)', YOU, true, 'Answer honestly', 'Pick what’s true for you, your real Friday night, your worst habit.'],
      ['var(--p2)', PAR, false, 'Call their answer', 'Then place a hunch on what your person will say. This is the game.'],
      ['us', null, false, 'Come into focus', 'When you’ve both played, see where your views line up, and where the cute little gaps are.'],
    ];
    return (
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', padding: '0 28px', paddingTop: 70 }}>
        <Kick>how it works</Kick>
        <Serif s={38} style={{ margin: '10px 0 28px' }}>Three taps, then the good part.</Serif>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 30, paddingBottom: 12 }}>
          {rows.map((r, i) => (
            <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ width: 50, height: 50, borderRadius: 999, flexShrink: 0, background: r[0] === 'us' ? 'transparent' : r[0],
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', ...serif, fontSize: 24,
                boxShadow: r[0] === 'us' ? 'none' : 'var(--shadow-soft)' }}>{r[0] === 'us' ? <Peek size={52} mood="focus" /> : r[1].initial}</div>
              <div style={{ paddingTop: 4 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>{r[3]}</div>
                <div style={{ fontSize: 14.5, color: 'var(--ink-soft)', lineHeight: 1.5, marginTop: 4 }}>{r[4]}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ paddingBottom: 30, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Dots n={0} of={4} />
          <Btn kind="ink" onClick={next}>Makes sense →</Btn>
        </div>
      </div>
    );
  }

  // step 2, intent (Headspace: capture why → personalize + intrinsic motivation)
  if (step === 2) {
    return (
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', padding: '0 28px', paddingTop: 70 }}>
        <Kick>what brings you here</Kick>
        <Serif s={38} style={{ margin: '10px 0 6px' }}>What do you two want?</Serif>
        <div style={{ fontSize: 14.5, color: 'var(--ink-soft)', lineHeight: 1.5, marginBottom: 22 }}>Pick what matters most. We’ll tune your drops to it, change it anytime.</div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 11 }}>
          {INTENTS.map(o => {
            const on = intent.includes(o[0]);
            return (
              <Press key={o[0]} onClick={() => toggleIntent(o[0])}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '15px 16px', borderRadius: 18,
                  background: on ? 'var(--us-soft)' : 'var(--surface)', border: `1.5px solid ${on ? 'var(--p2)' : 'var(--line)'}`,
                  boxShadow: on ? 'var(--shadow)' : 'var(--shadow-soft)', transition: 'all .16s ease' }}>
                  <span style={{ fontSize: 24 }}>{o[1]}</span>
                  <span style={{ flex: 1, textAlign: 'left', fontSize: 15.5, fontWeight: 600, color: 'var(--ink)' }}>{o[2]}</span>
                  <div style={{ width: 24, height: 24, borderRadius: 999, flexShrink: 0, border: `2px solid ${on ? 'var(--p2-deep)' : 'var(--ink-mute)'}`,
                    background: on ? 'var(--p2-deep)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {on && <G d={I.check} size={13} c="#fff" sw={2.6} />}
                  </div>
                </div>
              </Press>
            );
          })}
        </div>
        <div style={{ paddingBottom: 30, display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 14 }}>
          <Dots n={1} of={4} />
          <Btn kind="us" onClick={next} disabled={!intent.length} sub={intent.length ? `${intent.length} selected` : 'pick at least one'}>Continue</Btn>
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', padding: '0 28px', paddingTop: 70 }}>
        <Kick>pair up</Kick>
        <Serif s={38} style={{ margin: '10px 0 8px' }}>It takes two.</Serif>
        <div style={{ fontSize: 15, color: 'var(--ink-soft)', lineHeight: 1.5, marginBottom: 26 }}>Send Dani your invite link. Parallax only works once you’re both in.</div>

        <div style={{ ...cardBase, borderRadius: 26, padding: '26px 22px', textAlign: 'center', background: 'var(--us-soft)', border: '1px solid rgba(157,149,245,0.25)' }}>
          <Kick c="var(--p2-deep)">your invite code</Kick>
          <div style={{ ...mono, fontSize: 30, fontWeight: 700, letterSpacing: '0.14em', color: 'var(--ink)', margin: '12px 0 6px' }}>{code}</div>
          <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>they tap your link, you’re paired instantly</div>
        </div>

        <div style={{ flex: 1 }} />
        <div style={{ paddingBottom: 30, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Dots n={2} of={4} />
          <Btn kind="us" onClick={next} sub="opens messages"><span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><G d={I.send} size={18} c="#fff" />Send Dani the link</span></Btn>
          <Press onClick={next}><div style={{ textAlign: 'center', padding: 8, fontSize: 14, fontWeight: 600, color: 'var(--ink-mute)' }}>Enter a code instead</div></Press>
        </div>
      </div>
    );
  }

  // step 4, joined
  if (step === 4) {
    return (
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 30px', textAlign: 'center' }}>
        <div style={{ position: 'relative', width: 150, height: 110, marginBottom: 8 }}>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Tok who={YOU} you size={70} ring />
            <div style={{ marginLeft: -22 }}><Tok who={PAR} size={70} ring /></div>
          </div>
        </div>
        <div style={{ fontSize: 30, marginBottom: 4 }}>🎉</div>
        <Serif s={42} italic>Dani joined!</Serif>
        <div style={{ fontSize: 15.5, color: 'var(--ink-soft)', lineHeight: 1.55, marginTop: 18, maxWidth: 280 }}>
          You’re officially a pair. One last thing, then your first drop.
        </div>
        <div style={{ marginTop: 30, width: '100%' }}><Btn kind="us" onClick={next}>Almost there →</Btn></div>
      </div>
    );
  }

  // step 5, notification time-anchoring (the trigger → routine)
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', padding: '0 28px', paddingTop: 70 }}>
      <Kick>your daily moment</Kick>
      <Serif s={38} style={{ margin: '10px 0 6px' }}>When’s your moment?</Serif>
      <div style={{ fontSize: 14.5, color: 'var(--ink-soft)', lineHeight: 1.5, marginBottom: 22 }}>We’ll nudge you both once a day, when you’ve got a quiet minute. Couples who pick a time stick with it.</div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 11 }}>
        {MOMENTS.map(o => {
          const on = moment === o[0];
          return (
            <Press key={o[0]} onClick={() => setMoment(o[0])}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '15px 16px', borderRadius: 18,
                background: on ? 'var(--us-soft)' : 'var(--surface)', border: `1.5px solid ${on ? 'var(--p2)' : 'var(--line)'}`,
                boxShadow: on ? 'var(--shadow)' : 'var(--shadow-soft)', transition: 'all .16s ease' }}>
                <span style={{ fontSize: 24 }}>{o[1]}</span>
                <span style={{ flex: 1, textAlign: 'left', fontSize: 15.5, fontWeight: 600, color: 'var(--ink)' }}>{o[2]}</span>
                <span style={{ ...mono, fontSize: 12, fontWeight: 700, color: on ? 'var(--p2-deep)' : 'var(--ink-mute)' }}>{o[3]}</span>
              </div>
            </Press>
          );
        })}
      </div>
      <div style={{ paddingBottom: 30, display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 14 }}>
        <Dots n={3} of={4} />
        <Btn kind="us" onClick={finish} sub="drop 27 is live"><span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><G d={I.bell} size={17} c="#fff" />Turn on daily nudge</span></Btn>
        <Press onClick={finish}><div style={{ textAlign: 'center', padding: 8, fontSize: 14, fontWeight: 600, color: 'var(--ink-mute)' }}>Not now</div></Press>
      </div>
    </div>
  );
}

// ── PROFILE / SETTINGS ────────────────────────────────────────
function Profile({ state, back, toast, replayIntro, openPlus, openEditProfile, openSpice, openWidget, unpair }) {
  const Row = ({ icon, label, value, onClick, danger }) => (
    <Press onClick={onClick} scale={false}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '15px 16px' }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: danger ? 'rgba(239,106,83,0.12)' : 'var(--sunken)',
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <G d={icon} size={18} c={danger ? 'var(--p1-deep)' : 'var(--ink-soft)'} />
        </div>
        <span style={{ flex: 1, textAlign: 'left', fontSize: 15, fontWeight: 600, color: danger ? 'var(--p1-deep)' : 'var(--ink)' }}>{label}</span>
        {value && <span style={{ fontSize: 13.5, color: 'var(--ink-mute)', fontWeight: 600 }}>{value}</span>}
        <G d={I.chevR} size={16} c="var(--ink-mute)" />
      </div>
    </Press>
  );
  const Group = ({ children }) => (
    <div style={{ ...cardBase, borderRadius: 22, overflow: 'hidden', marginBottom: 14 }}>
      {React.Children.toArray(children).map((c, i) => (
        <div key={i} style={{ borderTop: i ? '1px solid var(--line)' : 'none' }}>{c}</div>
      ))}
    </div>
  );
  return (
    <>
      <TopBar title="you & settings" onBack={back} />
      <Screen pb={40}>
        <div style={{ height: 58 }} />
        {/* identity */}
        <Press onClick={openEditProfile} scale={false}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <div style={{ position: 'relative' }}>
            <Tok who={{ initial: (state.name || 'Y')[0].toUpperCase() }} you size={64} ring />
            <div style={{ position: 'absolute', bottom: -2, right: -2, width: 24, height: 24, borderRadius: 999,
              background: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--surface)' }}>
              <G d={I.pencil} size={12} c="#fff" />
            </div>
          </div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <Serif s={28}>{state.name || 'Yash'}</Serif>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <span style={{ ...mono, fontSize: 11, color: 'var(--ink-soft)' }}>paired with</span>
              <Tok who={PAR} size={18} /><span style={{ fontSize: 13, fontWeight: 700, color: 'var(--p2-deep)' }}>Dani</span>
            </div>
          </div>
          <G d={I.chevR} size={18} c="var(--ink-mute)" />
        </div>
        </Press>

        {/* nudge */}
        <div style={{ ...cardBase, borderRadius: 22, padding: 16, marginBottom: 14, background: 'var(--us-soft)', border: '1px solid rgba(157,149,245,0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 24 }}>👋</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--ink)' }}>Give Dani a nudge</div>
              <Kick c="var(--p2-deep)" style={{ marginTop: 2 }}>they haven’t opened today’s reveal</Kick>
            </div>
          </div>
          <div style={{ marginTop: 12 }}><Btn kind="us" onClick={() => toast('Nudge sent to Dani 👋')} style={{ minHeight: 48 }}><span style={{ fontSize: 14.5 }}>Send a nudge</span></Btn></div>
        </div>

        {/* plus banner when active */}
        {state.plus && (
          <div style={{ ...cardBase, borderRadius: 22, padding: '14px 16px', marginBottom: 14, background: 'var(--us)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <Mark size={24} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: '#fff' }}>Parallax Plus is active</div>
              <div style={{ ...mono, fontSize: 10, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>SHARED WITH DANI</div>
            </div>
            <Press onClick={openPlus} scale={false} style={{ width: 'auto' }}>
              <div style={{ padding: '8px 13px', borderRadius: 999, background: 'rgba(255,255,255,0.9)', fontSize: 12.5, fontWeight: 700, color: 'var(--ink)' }}>Manage</div>
            </Press>
          </div>
        )}

        <Kick style={{ margin: '4px 0 8px 4px' }}>preferences</Kick>
        <Group>
          <Row icon={I.bell} label="Notifications" value="Daily 8pm" onClick={() => toast('Notification settings')} />
          <Row icon={I.flame} label="Spice level" value={state.spice || 'Flirty'} onClick={openSpice} />
          <Row icon={I.grid} label="Home screen widget" onClick={openWidget} />
          <Row icon={I.spark} label="Replay intro" onClick={replayIntro} />
        </Group>

        <Kick style={{ margin: '4px 0 8px 4px' }}>account</Kick>
        <Group>
          <Row icon={I.heart} label="Parallax Plus" value={state.plus ? 'Active' : 'Upgrade'} onClick={openPlus} />
          <Row icon={I.link} label="Manage pairing" onClick={() => toast('Pairing settings')} />
          <Row icon={I.logout} label="Unpair from Dani" danger onClick={unpair} />
        </Group>
        <div style={{ textAlign: 'center', ...mono, fontSize: 10, color: 'var(--ink-mute)', marginTop: 18 }}>parallax · v1.0 · made for two</div>
      </Screen>
    </>
  );
}

// ── PACK DETAIL / SEND ────────────────────────────────────────
function PackDetail({ packId, back, toast, openPlus, plus, go }) {
  const pk = PACKS.find(p => p.id === packId);
  const samples = PACK_SAMPLE[packId] || [];
  const locked = pk.locked && !plus;
  return (
    <>
      <TopBar title="pack" onBack={back} />
      <Screen pb={120}>
        <div style={{ height: 44 }} />
        <div style={{ ...cardBase, borderRadius: 28, overflow: 'hidden', position: 'relative' }}>
          <div style={{ height: 150, background: pk.tint, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(80% 120% at 80% -10%,rgba(255,255,255,0.55),transparent 60%)' }} />
            <div style={{ position: 'absolute', right: 16, bottom: -8, fontSize: 86 }}>{pk.emoji}</div>
            <div style={{ position: 'absolute', left: 20, bottom: 16 }}>
              <Kick c="rgba(255,255,255,0.9)">{pk.tag}</Kick>
              <Serif s={40} c="#fff" style={{ marginTop: 4 }}>{pk.title}</Serif>
            </div>
            {locked && (
              <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 11px', borderRadius: 999, background: 'rgba(0,0,0,0.22)', backdropFilter: 'blur(6px)' }}>
                <G d={I.lock} size={13} c="#fff" /><span style={{ ...mono, fontSize: 10, fontWeight: 700, color: '#fff' }}>PLUS</span>
              </div>
            )}
            {!pk.locked || plus ? (
              <div style={{ position: 'absolute', top: 14, right: 14, ...mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: '#fff', background: 'rgba(84,194,160,0.9)', padding: '5px 10px', borderRadius: 999 }}>{pk.locked ? 'UNLOCKED' : 'FREE'}</div>
            ) : null}
          </div>
          <div style={{ padding: '18px 20px 20px' }}>
            <div style={{ fontSize: 15, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
              {locked ? 'A themed drop for when you want to go there. Unlock Plus to send it, you’ll both answer + place hunches, same as the daily.'
                : 'Send it to Dani and you’ll both answer + place hunches, same as the daily drop.'}
            </div>
          </div>
        </div>

        <div style={{ margin: '22px 0 12px' }}><Kick>what’s inside</Kick></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {samples.map((q, i) => (
            <div key={i} style={{ ...cardBase, borderRadius: 18, padding: '15px 16px', display: 'flex', alignItems: 'center', gap: 12,
              filter: locked && i > 0 ? 'blur(4px)' : 'none', opacity: locked && i > 0 ? 0.7 : 1 }}>
              <span style={{ ...serif, fontSize: 20, color: pk.tint, width: 22 }}>{i + 1}</span>
              <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', flex: 1 }}>{q}</span>
            </div>
          ))}
        </div>
      </Screen>

      <div style={{ position: 'absolute', left: 20, right: 20, bottom: 22, zIndex: 40 }}>
        {locked
          ? <Btn kind="us" onClick={openPlus} sub="7 days free"><span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><G d={I.lock} size={17} c="#fff" />Unlock with Plus</span></Btn>
          : <Btn kind="us" onClick={() => { toast('Sent to Dani 💌'); setTimeout(() => go('home'), 700); }} sub="they’ll get a ping"><span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><G d={I.send} size={17} c="#fff" />Send drop to Dani</span></Btn>}
      </div>
    </>
  );
}

// ── DROP DETAIL (archive) ─────────────────────────────────────
function DropDetail({ code, back }) {
  const d = ARCHIVE.find(x => x.code === code) || ARCHIVE[0];
  return (
    <>
      <TopBar title={d.code} onBack={back} />
      <Screen pb={40}>
        <div style={{ height: 50 }} />
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 40 }}>{d.emoji}</div>
          <Serif s={36} italic style={{ marginTop: 4 }}>{d.title}</Serif>
          <Kick style={{ marginTop: 8 }}>{d.day}</Kick>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 10, marginTop: 14 }}>
            <Serif s={54} style={{ background: 'var(--us)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', paddingRight: '0.06em' }}>{d.wave}%</Serif>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-soft)' }}>in sync · {d.twins} twin{d.twins === 1 ? '' : 's'}</span>
          </div>
        </div>
        <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {d.rows.map((r, i) => {
            const twin = r[3];
            return (
              <div key={i} style={{ ...cardBase, borderRadius: 20, padding: '15px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--ink)', flex: 1 }}>{r[0]}</span>
                  {twin && <span style={{ fontSize: 16 }}>👯</span>}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1 }}><Kick c="var(--p1-deep)" style={{ marginBottom: 6 }}>you</Kick><Chip you soft>{r[1]}</Chip></div>
                  <div style={{ flex: 1 }}><Kick c="var(--p2-deep)" style={{ marginBottom: 6 }}>Dani</Kick><Chip soft>{r[2]}</Chip></div>
                </div>
              </div>
            );
          })}
        </div>
      </Screen>
    </>
  );
}

// ── THREAD (talk about an answer) ─────────────────────────────
function Thread({ back, toast }) {
  const [msgs, setMsgs] = useState(THREAD.msgs);
  const [text, setText] = useState('');
  const scroller = useRef(null);
  useEffect(() => { if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight; }, [msgs]);
  const send = (t) => {
    const v = (t || text).trim(); if (!v) return;
    setMsgs(m => [...m, { who: 'you', text: v }]); setText('');
  };
  return (
    <div style={{ position: 'absolute', inset: 0, paddingTop: 48, display: 'flex', flexDirection: 'column' }}>
      <TopBar title="talk about it" onBack={back} />
      {/* pinned prompt */}
      <div style={{ margin: '52px 18px 0', padding: '13px 15px', borderRadius: 18, background: 'var(--surface)',
        border: '1px solid var(--line)', boxShadow: 'var(--shadow-soft)', display: 'flex', alignItems: 'center', gap: 11 }}>
        <span style={{ fontSize: 22 }}>{THREAD.emoji}</span>
        <div>
          <Kick>{DROP.code} · the answer you’re on</Kick>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--ink)', marginTop: 2 }}>{THREAD.q}</div>
        </div>
      </div>

      <div ref={scroller} style={{ flex: 1, overflowY: 'auto', padding: '16px 18px 8px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {msgs.map((m, i) => {
          const you = m.who === 'you';
          return (
            <div key={i} style={{ display: 'flex', gap: 8, alignSelf: you ? 'flex-end' : 'flex-start', maxWidth: '82%', alignItems: 'flex-end' }}>
              {!you && <Tok who={PAR} size={26} />}
              <div style={{ padding: '11px 15px', borderRadius: 20, fontSize: 14.5, lineHeight: 1.4,
                borderBottomRightRadius: you ? 5 : 20, borderBottomLeftRadius: you ? 20 : 5,
                background: you ? 'var(--p1)' : 'var(--surface)', color: you ? '#fff' : 'var(--ink)',
                border: you ? 'none' : '1px solid var(--line)', boxShadow: 'var(--shadow-soft)' }}>{m.text}</div>
            </div>
          );
        })}
      </div>

      {/* reactions + input */}
      <div style={{ padding: '8px 16px 6px', display: 'flex', gap: 8 }}>
        {THREAD.reactions.map(e => (
          <Press key={e} onClick={() => send(e)} scale={false} style={{ width: 'auto' }}>
            <div style={{ width: 40, height: 40, borderRadius: 999, background: 'var(--surface)', border: '1px solid var(--line)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, boxShadow: 'var(--shadow-soft)' }}>{e}</div>
          </Press>
        ))}
      </div>
      <div style={{ padding: '6px 16px 22px', display: 'flex', gap: 10, alignItems: 'center' }}>
        <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="say something…" style={{ flex: 1, border: '1px solid var(--line)', background: 'var(--surface)',
            borderRadius: 999, padding: '13px 18px', fontSize: 15, fontFamily: 'var(--font-ui)', color: 'var(--ink)', outline: 'none' }} />
        <Press onClick={() => send()} scale={false} style={{ width: 'auto' }}>
          <div style={{ width: 46, height: 46, borderRadius: 999, background: 'var(--us)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-soft)' }}>
            <G d={I.send} size={20} c="#fff" />
          </div>
        </Press>
      </div>
    </div>
  );
}

// ── SHARE SHEET ───────────────────────────────────────────────
function ShareCard({ state, onClose, toast }) {
  const r = reveal(state);
  const grid = P.map((p, i) => {
    const twin = state.myPicks[i] === p.remy;
    const ok = state.myHunches[i] === p.remy;
    return p.emoji + (twin ? '👯' : ok ? '💞' : '🤍');
  }).join('  ');
  return (
    <Sheet onClose={onClose} title="share via">
      <div style={{ borderRadius: 24, overflow: 'hidden', boxShadow: 'var(--shadow)', marginBottom: 18 }}>
        <div style={{ background: 'var(--us)', padding: '22px 22px 24px', position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(70% 100% at 85% 0%,rgba(255,255,255,0.45),transparent 60%)' }} />
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Wordmark size={20} light />
            </div>
            <Serif s={56} c="#fff" style={{ marginTop: 16, lineHeight: 0.96 }}>{r.wave}%</Serif>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.95)', marginTop: 2 }}>on the same wavelength</div>
            <div style={{ ...mono, fontSize: 19, letterSpacing: '0.06em', marginTop: 16 }}>{grid}</div>
            <div style={{ ...mono, fontSize: 10, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.85)', marginTop: 14 }}>YASH & DANI · {DROP.code}</div>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        {[['Messages', '#34C759'], ['Instagram', '#C13584'], ['Copy', 'var(--ink)']].map(([l, bg]) => (
          <Press key={l} onClick={() => { onClose(); toast(l === 'Copy' ? 'Copied to clipboard' : `Shared to ${l}`); }} style={{ flex: 1, width: 'auto' }}>
            <div style={{ background: l === 'Copy' ? 'var(--surface)' : bg, border: l === 'Copy' ? '1px solid var(--line)' : 'none',
              color: l === 'Copy' ? 'var(--ink)' : '#fff', borderRadius: 16, padding: '14px 8px', textAlign: 'center',
              fontSize: 14, fontWeight: 700, boxShadow: 'var(--shadow-soft)' }}>{l}</div>
          </Press>
        ))}
      </div>
    </Sheet>
  );
}

// ── PLUS PAYWALL SHEET ────────────────────────────────────────
function PlusSheet({ onClose, onStart }) {
  const perks = [['🎁', 'Every themed pack', 'Deep end, After dark, Chaos hour & more'],
    ['♾️', 'Unlimited drops', 'Send each other questions any time'],
    ['📈', 'Full wavelength history', 'Every reveal, kept forever']];
  return (
    <Sheet onClose={onClose} title="parallax plus">
      <div style={{ textAlign: 'center', marginBottom: 18 }}>
        <Serif s={34} italic>One sub, both of you.</Serif>
        <div style={{ fontSize: 14, color: 'var(--ink-soft)', marginTop: 4 }}>$4.99/mo · covers you and Dani</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
        {perks.map((p, i) => (
          <div key={i} style={{ display: 'flex', gap: 13, alignItems: 'center' }}>
            <div style={{ width: 42, height: 42, borderRadius: 13, background: 'var(--us-soft)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{p[0]}</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>{p[1]}</div>
              <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 1 }}>{p[2]}</div>
            </div>
          </div>
        ))}
      </div>
      <Btn kind="us" onClick={onStart} sub="then $4.99/mo">Start 7 days free</Btn>
      <Press onClick={onClose}><div style={{ textAlign: 'center', padding: 10, fontSize: 13.5, fontWeight: 600, color: 'var(--ink-mute)', marginTop: 4 }}>Maybe later</div></Press>
    </Sheet>
  );
}

function SpiceSheet({ current, onPick, onClose }) {
  const opts = [
    ['Sweet', '🍰', 'Wholesome, no spice. Cozy and kind.'],
    ['Flirty', '😏', 'A little suggestive. Tasteful heat.'],
    ['Spicy', '🌶️', 'Bolder, after-dark prompts. 18+'],
  ];
  return (
    <Sheet onClose={onClose} title="spice level">
      <div style={{ fontSize: 14, color: 'var(--ink-soft)', textAlign: 'center', marginBottom: 16, lineHeight: 1.5 }}>How bold should your daily questions get? You both see the same level, and you can change it anytime.</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {opts.map(o => {
          const on = (current || 'Flirty') === o[0];
          return (
            <Press key={o[0]} onClick={() => onPick(o[0])}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '15px 16px', borderRadius: 18,
                background: on ? 'var(--us-soft)' : 'var(--surface)', border: `1.5px solid ${on ? 'var(--p2)' : 'var(--line)'}`, boxShadow: 'var(--shadow-soft)' }}>
                <span style={{ fontSize: 26 }}>{o[1]}</span>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontSize: 15.5, fontWeight: 700, color: 'var(--ink)' }}>{o[0]}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 2, lineHeight: 1.4 }}>{o[2]}</div>
                </div>
                <div style={{ width: 22, height: 22, borderRadius: 999, border: `2px solid ${on ? 'var(--p2-deep)' : 'var(--ink-mute)'}`,
                  background: on ? 'var(--p2-deep)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {on && <G d={I.check} size={12} c="#fff" sw={2.6} />}
                </div>
              </div>
            </Press>
          );
        })}
      </div>
    </Sheet>
  );
}

window.PXF = { Onboarding, Profile, PackDetail, DropDetail, Thread, ShareCard, PlusSheet, SpiceSheet };
