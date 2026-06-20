// Parallax (couples), main tab screens. Exports window.PXS.
const { useState, useEffect, YOU, PAR, DROP, PACKS, ARCHIVE, P, I, G, Mark, Peek, Wordmark, anaglyph, LEARNINGS,
  mono, serif, Kick, Serif, Tok, Press, Btn, cardBase,
  Brand, Chip, Stat, Ring, reveal, Screen } = window.PXC;

// ── HOME / TODAY ──────────────────────────────────────────────
function Home({ state, go, openPlay, openProfile, openWidget, openStreak, openRefocus, openActivity }) {
  const done = state.done;
  return (
    <Screen>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, marginBottom: 16 }}>
        <Brand />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Press onClick={openStreak} scale={false} style={{ width: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 999,
              background: 'var(--surface)', border: '1px solid var(--line)', boxShadow: 'var(--shadow-soft)' }}>
              <G d={I.flame} size={16} c="var(--p1-deep)" fill="var(--p1)" sw={1.4} />
              <span style={{ ...mono, fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>{state.streak}</span>
            </div>
          </Press>
          <Press onClick={openActivity} scale={false} style={{ width: 'auto' }}>
            <div style={{ position: 'relative', width: 38, height: 38, borderRadius: 999, background: 'var(--surface)', border: '1px solid var(--line)',
              boxShadow: 'var(--shadow-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <G d={I.bell} size={18} c="var(--ink-soft)" />
              <div style={{ position: 'absolute', top: 7, right: 8, width: 8, height: 8, borderRadius: 999, background: 'var(--p1-deep)', border: '1.5px solid var(--surface)' }} />
            </div>
          </Press>
          <Press onClick={openProfile} scale={false} style={{ width: 'auto' }}><Tok who={YOU} you size={36} /></Press>
        </div>
      </div>

      {/* partner ping banner */}
      {!done && (
        <Press onClick={openPlay}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 14px', borderRadius: 18, marginBottom: 14,
            background: 'var(--us-soft)', border: '1px solid rgba(157,149,245,0.28)' }}>
            <div style={{ fontSize: 22 }}>💌</div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>Dani already played today</div>
              <Kick c="var(--p2-deep)" style={{ marginTop: 2 }}>your turn · no peeking at theirs</Kick>
            </div>
            <G d={I.chevR} size={18} c="var(--p2-deep)" />
          </div>
        </Press>
      )}

      {/* today's drop card */}
      <div style={{ ...cardBase, borderRadius: 30, overflow: 'hidden', position: 'relative' }}>
        <div style={{ height: 132, background: 'var(--us)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(80% 120% at 80% -10%,rgba(255,255,255,0.5),transparent 60%)' }} />
          <div style={{ position: 'absolute', top: 16, left: 18, ...mono, fontSize: 10, letterSpacing: '0.16em', color: 'rgba(255,255,255,0.9)' }}>{DROP.code} · {DROP.day.toUpperCase()}</div>
          <div style={{ position: 'absolute', right: 14, bottom: -6, fontSize: 74, animation: 'pxfloat 5s ease-in-out infinite' }}>💌</div>
          <div style={{ position: 'absolute', left: 18, bottom: 16 }}>
            <Serif s={40} italic c="#fff" style={{ whiteSpace: 'nowrap' }}>{DROP.title}</Serif>
          </div>
        </div>
        <div style={{ padding: '18px 20px 20px' }}>
          {!done ? (
            <>
              <div style={{ fontSize: 15, lineHeight: 1.5, color: 'var(--ink-soft)' }}>{DROP.blurb}</div>
              <div style={{ display: 'flex', gap: 7, margin: '16px 0 18px' }}>
                {P.map((p, i) => (
                  <div key={i} style={{ flex: 1, height: 52, borderRadius: 16, background: 'var(--sunken)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, opacity: 0.9 }}>{p.emoji}</div>
                ))}
              </div>
              <Btn kind="us" onClick={openPlay} sub="about 90 seconds">Play today’s three</Btn>
            </>
          ) : (
            <>
              <Kick c="var(--match-deep)">round complete · you both played</Kick>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, margin: '8px 0 4px' }}>
                <Serif s={52} style={{ background: 'var(--us)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', paddingRight: '0.06em' }}>{state.wave}%</Serif>
                <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-soft)' }}>on the same wavelength</span>
              </div>
              <div style={{ marginTop: 16 }}><Btn kind="ink" onClick={() => go('reveal')} sub="the good part">See the reveal →</Btn></div>
            </>
          )}
        </div>
      </div>

      {/* send a pack, packs folded into Today */}
      <Press onClick={() => go('packs')}>
      <div style={{ ...cardBase, borderRadius: 22, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 11, background: 'var(--sunken)',
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}><G d={I.cards} size={20} c="var(--ink-soft)" /></div>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>Send Dani a pack</div>
          <Kick style={{ marginTop: 3 }}>themed drops · deep, spicy, silly & more</Kick>
        </div>
        <G d={I.chevR} size={17} c="var(--ink-mute)" />
      </div>
      </Press>

    </Screen>
  );
}

// ── PLAY ──────────────────────────────────────────────────────
function Play({ state, set, go }) {
  const { idx, phase } = state.play;
  const p = P[idx];
  const isPick = phase === 'pick';
  const color = isPick ? 'var(--p1)' : 'var(--p2)';
  const deep = isPick ? 'var(--p1-deep)' : 'var(--p2-deep)';
  const selected = isPick ? state.myPicks[idx] : state.myHunches[idx];

  const choose = (oi) => {
    if (isPick) {
      const mp = [...state.myPicks]; mp[idx] = oi;
      set(s => ({ ...s, myPicks: mp, play: { ...s.play, phase: 'wait' } }));
      setTimeout(() => set(s => ({ ...s, play: { ...s.play, phase: 'hunch' } })), 360);
    } else {
      const mh = [...state.myHunches]; mh[idx] = oi;
      const last = idx === P.length - 1;
      set(s => ({ ...s, myHunches: mh, play: last ? s.play : { idx: idx + 1, phase: 'pick' } }));
      if (last) setTimeout(() => go('waiting'), 220);
    }
  };

  const total = P.length * 2, step = idx * 2 + (isPick ? 1 : 2);

  return (
    <div style={{ position: 'absolute', inset: 0, paddingTop: 48 }}>
      <div style={{ padding: '6px 20px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Press onClick={() => idx === 0 && isPick ? go('home') : set(s => ({ ...s, play: isPick ? { idx: idx - 1, phase: 'hunch' } : { idx, phase: 'pick' } }))} scale={false} style={{ width: 'auto' }}>
          <G d={I.back} size={22} c="var(--ink-soft)" />
        </Press>
        <div style={{ flex: 1, height: 7, borderRadius: 999, background: 'var(--sunken)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${(step / total) * 100}%`, background: 'var(--us)', borderRadius: 999, transition: 'width .35s cubic-bezier(.3,.9,.3,1)' }} />
        </div>
        <Kick>{idx + 1}/{P.length}</Kick>
      </div>

      <div style={{ padding: '26px 24px', height: 'calc(100% - 36px)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 50, marginBottom: 8 }}>{p.emoji}</div>
        <Serif s={34} style={{ marginBottom: 24 }}>{p.q}</Serif>

        <div style={{ display: 'inline-flex', alignSelf: 'flex-start', alignItems: 'center', gap: 8, padding: '7px 13px',
          borderRadius: 999, background: isPick ? 'rgba(255,142,122,0.16)' : 'rgba(157,149,245,0.18)', marginBottom: 16,
          transition: 'background .3s ease' }}>
          <Tok who={isPick ? YOU : PAR} you={isPick} size={20} />
          <span style={{ fontSize: 13, fontWeight: 700, color: deep }}>{isPick ? 'Your honest pick' : 'Your hunch, what’ll Dani say?'}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 11, flex: 1 }}>
          {p.opts.map((o, oi) => {
            const on = selected === oi;
            return (
              <Press key={oi} onClick={() => choose(oi)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '17px 18px', borderRadius: 20,
                  background: on ? color : 'var(--surface)', border: `1.5px solid ${on ? color : 'var(--line)'}`,
                  boxShadow: on ? 'var(--shadow)' : 'var(--shadow-soft)', transition: 'all .2s ease' }}>
                  <div style={{ width: 22, height: 22, borderRadius: 999, flexShrink: 0,
                    border: `2px solid ${on ? '#fff' : 'var(--ink-mute)'}`, background: on ? '#fff' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {on && <div style={{ width: 9, height: 9, borderRadius: 999, background: deep }} />}
                  </div>
                  <span style={{ flex: 1, fontSize: 15.5, fontWeight: 600, lineHeight: 1.25, color: on ? '#fff' : 'var(--ink)' }}>{o}</span>
                </div>
              </Press>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── WAITING ───────────────────────────────────────────────────
function Waiting({ set, go }) {
  useEffect(() => {
    const t = setTimeout(() => { set(s => ({ ...s, done: true })); go('reveal'); }, 2600);
    return () => clearTimeout(t);
  }, []);
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: 36, textAlign: 'center' }}>
      <div style={{ position: 'relative', width: 150, height: 120, marginBottom: 26, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', width: 120, height: 120, borderRadius: 999, background: 'var(--us-soft)', animation: 'pxfloat 3.5s ease-in-out infinite' }} />
        <div style={{ position: 'relative', animation: 'pxfloat 4s ease-in-out infinite' }}><Peek size={128} mood="search" /></div>
      </div>
      <Kick c="var(--p2-deep)">you’re in ✓</Kick>
      <Serif s={34} italic style={{ margin: '12px 0 10px' }}>looking for Dani…</Serif>
      <div style={{ fontSize: 15, color: 'var(--ink-soft)', lineHeight: 1.5, maxWidth: 268 }}>
        Your two views are still apart. The moment Dani plays, they snap into focus, that’s the reveal.
      </div>
      <div style={{ marginTop: 26, display: 'flex', gap: 6 }}>
        {[0, 1, 2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--p2)',
          animation: `pxfloat 1.2s ease-in-out ${i * 0.18}s infinite` }} />)}
      </div>
    </div>
  );
}

// ── REVEAL ────────────────────────────────────────────────────
function Reveal({ state, go, share, openThread }) {
  const r = reveal(state);
  const [show, setShow] = useState(false);
  const [aligned, setAligned] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 80);
    const t2 = setTimeout(() => setAligned(true), 780);
    return () => { clearTimeout(t); clearTimeout(t2); };
  }, []);
  const verdict = r.wave >= 80 ? 'Crystal clear. You see in 3D.' : r.wave >= 55 ? 'Mostly in focus.' : 'A little blurry, that’s the fun part.';
  return (
    <>
    <Screen pb={120}>
      <div style={{ textAlign: 'center', marginTop: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
          <div style={{ animation: 'pxfloat 4s ease-in-out infinite' }}><Peek size={72} mood={r.wave >= 70 ? 'focus' : r.wave >= 45 ? 'happy' : 'search'} /></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}><Wordmark size={26} offset={!aligned} /></div>
        <Kick c="var(--ink-mute)">{aligned ? 'in focus' : 'the reveal'}</Kick>
        <div style={{ position: 'relative', width: 168, height: 168, margin: '18px auto 6px' }}>
          <Ring pct={show ? r.wave : 0} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Serif s={50} style={{ background: 'var(--us)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1, paddingRight: '0.06em' }}>{r.wave}%</Serif>
            <Kick style={{ marginTop: 4 }}>in sync</Kick>
          </div>
        </div>
        <Serif s={32} italic style={{ ...anaglyph(0.018, 0.45), margin: '6px 0 4px' }}>{verdict}</Serif>
        <div style={{ fontSize: 13.5, color: 'var(--ink-soft)', maxWidth: 290, margin: '8px auto 0', lineHeight: 1.5 }}>The out-of-focus bits aren’t fails, they’re tonight’s conversation.</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 16 }}>
          <Stat big={`${r.yourHits + r.remyHits}/${P.length * 2}`} label="hunches landed" />
          <div style={{ width: 1, background: 'var(--line)' }} />
          <Stat big={r.twins} label="twin moments" grad />
        </div>
      </div>

      <div style={{ marginTop: 26, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {P.map((p, i) => {
          const mine = state.myPicks[i], theirs = p.remy;
          const yourHunchOk = state.myHunches[i] === theirs;
          const twin = mine === theirs;
          const noteIdx = twin ? 0 : yourHunchOk ? 1 : 2;
          return (
            <div key={i} style={{ ...cardBase, borderRadius: 22, padding: '15px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
                <span style={{ fontSize: 19 }}>{p.emoji}</span>
                <span style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--ink)', flex: 1 }}>{p.q}</span>
                {twin && <span style={{ fontSize: 17 }}>👯</span>}
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'stretch' }}>
                {[[mine, 'you', 'var(--p1-deep)', 'rgba(255,142,122,0.14)'], [theirs, 'Dani', 'var(--p2-deep)', 'rgba(157,149,245,0.16)']].map((c, k) => (
                  <div key={k} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Kick c={c[2]} style={{ marginBottom: 6 }}>{c[1]}</Kick>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '11px 14px', borderRadius: 16, background: c[3], color: c[2], fontSize: 13.5, fontWeight: 600, lineHeight: 1.35 }}>{p.opts[c[0]]}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 11, borderTop: '1px solid var(--line)' }}>
                <span style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 999,
                  background: yourHunchOk ? 'rgba(84,194,160,0.16)' : 'rgba(157,149,245,0.16)',
                  color: yourHunchOk ? 'var(--match-deep)' : 'var(--p2-deep)', fontSize: 11.5, fontWeight: 700 }}>
                  {yourHunchOk ? '🎯 in focus' : '👀 parallax'}
                </span>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--ink-soft)' }}>{p.note[noteIdx]}</span>
                <Press onClick={() => openThread(p.id)} scale={false} style={{ width: 'auto' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 999,
                    background: 'var(--sunken)' }}>
                    <G d={I.chat} size={13} c="var(--ink-soft)" />
                    {i === 0 && <span style={{ ...mono, fontSize: 10, fontWeight: 700, color: 'var(--p2-deep)' }}>3</span>}
                  </div>
                </Press>
              </div>
              <div style={{ marginTop: 11, paddingTop: 10, borderTop: '1px dashed var(--line)', display: 'flex', gap: 8 }}>
                <span style={{ ...mono, fontSize: 8.5, letterSpacing: '0.14em', color: 'var(--ink-mute)', flexShrink: 0, marginTop: 2 }}>WHY</span>
                <span style={{ fontSize: 11.5, lineHeight: 1.45, color: 'var(--ink-soft)', fontStyle: 'italic' }}>{p.why}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 20 }}><Btn kind="us" onClick={share} sub="brag a little">Share your wavelength</Btn></div>
      <div style={{ marginTop: 11 }}><Btn kind="soft" onClick={() => go('home')} sub="next drop in 9h">Done for today</Btn></div>
    </Screen>
    <Press onClick={() => go('home')} scale={false} style={{ position: 'absolute', top: 54, right: 18, width: 'auto', zIndex: 30 }}>
      <div style={{ width: 36, height: 36, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(255,253,253,0.72)', backdropFilter: 'blur(14px) saturate(180%)', WebkitBackdropFilter: 'blur(14px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.6)', boxShadow: 'var(--shadow-soft)' }}>
        <G d={I.close} size={15} c="var(--ink)" sw={2} />
      </div>
    </Press>
    </>
  );
}

// ── PACKS (browse) ────────────────────────────────────────────
function Packs({ openPack, openPlus, plus }) {
  return (
    <Screen>
      <div style={{ marginTop: 6, marginBottom: 6 }}><Serif s={40}>Packs</Serif></div>
      <div style={{ fontSize: 15, color: 'var(--ink-soft)', marginBottom: 20 }}>{plus ? <span>You’re <span style={{ color: 'var(--p2-deep)', fontWeight: 700 }}>Plus</span>, every pack is unlocked. Send Dani any drop you like.</span> : <span>Send Dani a themed drop whenever you want, the daily one’s free, the rest are <span style={{ color: 'var(--p1-deep)', fontWeight: 700 }}>Plus</span>.</span>}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 13 }}>
        {PACKS.map((pk) => (
          <Press key={pk.id} onClick={() => openPack(pk.id)}>
            <div style={{ ...cardBase, borderRadius: 24, padding: '18px 16px', height: 156, position: 'relative', overflow: 'hidden',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ position: 'absolute', top: -30, right: -30, width: 110, height: 110, borderRadius: 999,
                background: pk.tint, opacity: 0.14, filter: 'blur(6px)' }} />
              <div style={{ fontSize: 34 }}>{pk.emoji}</div>
              <div>
                <Serif s={24}>{pk.title}</Serif>
                <Kick style={{ marginTop: 5 }}>{pk.tag}</Kick>
              </div>
              <div style={{ position: 'absolute', top: 16, right: 16 }}>
                {pk.locked && !plus ? <G d={I.lock} size={15} c="var(--ink-mute)" />
                  : <span style={{ ...mono, fontSize: 8.5, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--match-deep)',
                    background: 'rgba(84,194,160,0.16)', padding: '3px 7px', borderRadius: 999 }}>{pk.locked ? 'UNLOCKED' : 'FREE'}</span>}
              </div>
            </div>
          </Press>
        ))}
      </div>
      <div style={{ ...cardBase, borderRadius: 26, padding: 20, marginTop: 16, background: 'var(--us-soft)', border: '1px solid rgba(157,149,245,0.25)' }}>
        {plus ? (
          <>
            <Kick c="var(--match-deep)">● plus active</Kick>
            <Serif s={26} style={{ margin: '8px 0 6px' }}>You’re all unlocked.</Serif>
            <div style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.5, marginBottom: 16 }}>Every pack, unlimited drops, full history, shared with Dani. Manage anytime in settings.</div>
            <Btn kind="soft" onClick={openPlus} sub="annual · free trial">Manage Plus</Btn>
          </>
        ) : (
          <>
            <Kick c="var(--p2-deep)">parallax plus</Kick>
            <Serif s={26} style={{ margin: '8px 0 6px' }}>One sub, both of you.</Serif>
            <div style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.5, marginBottom: 16 }}>Every pack, unlimited drops, your full wavelength history. $4.99/mo, covers you and Dani.</div>
            <Btn kind="us" onClick={openPlus} sub="7 days free">Try Plus</Btn>
          </>
        )}
      </div>
    </Screen>
  );
}

// ── US ────────────────────────────────────────────────────────
function Us({ state, openDrop, openProfile, openWrapped, openStreak, openLoveMap }) {
  const hist = [62, 71, 58, 80, 74, 88, state.done ? state.wave : 83];
  return (
    <Screen>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 2 }}>
        <Press onClick={openProfile} scale={false} style={{ width: 'auto' }}>
          <div style={{ width: 38, height: 38, borderRadius: 999, background: 'var(--surface)', border: '1px solid var(--line)',
            boxShadow: 'var(--shadow-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <G d={I.gear} size={19} c="var(--ink-soft)" />
          </div>
        </Press>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 2, marginBottom: 8 }}>
        <div style={{ display: 'flex', marginBottom: 14 }}>
          <Tok who={YOU} you size={62} ring />
          <div style={{ marginLeft: -18 }}><Tok who={PAR} size={62} ring /></div>
        </div>
        <Serif s={34} italic>Yash & Dani</Serif>
        <Press onClick={openStreak} scale={false} style={{ width: 'auto' }}><Kick style={{ marginTop: 8 }}>together since feb · {state.streak} day streak 🔥</Kick></Press>
      </div>

      {/* wrapped hero */}
      <Press onClick={openWrapped}>
        <div style={{ borderRadius: 26, overflow: 'hidden', position: 'relative', marginTop: 18, boxShadow: 'var(--shadow)' }}>
          <div style={{ background: 'var(--us)', padding: '18px 18px', display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(70% 100% at 85% 0%,rgba(255,255,255,0.4),transparent 60%)' }} />
            <div style={{ fontSize: 38, position: 'relative' }}>🎁</div>
            <div style={{ flex: 1, textAlign: 'left', position: 'relative' }}>
              <Kick c="rgba(255,255,255,0.85)">new · june recap</Kick>
              <Serif s={28} c="#fff" style={{ marginTop: 2 }}>Your month, wrapped</Serif>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.92)', marginTop: 3 }}>find out your couple type →</div>
            </div>
          </div>
        </div>
      </Press>

      {/* love map, what you're learning about each other */}
      <Press onClick={openLoveMap}>
        <div style={{ ...cardBase, borderRadius: 26, padding: '18px 18px', marginTop: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ fontSize: 24 }}>🗺️</div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>Your Love Map</div>
              <Kick style={{ marginTop: 2 }}>{LEARNINGS.length} things you’re learning</Kick>
            </div>
            <G d={I.chevR} size={18} c="var(--ink-mute)" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {LEARNINGS.slice(0, 2).map(l => {
              const you = l.who === 'you';
              return (
                <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', borderRadius: 14,
                  background: you ? 'rgba(255,142,122,0.08)' : 'rgba(157,149,245,0.09)', borderLeft: `3px solid ${you ? 'var(--p1)' : 'var(--p2)'}` }}>
                  <span style={{ fontSize: 17 }}>{l.emoji}</span>
                  <span style={{ flex: 1, textAlign: 'left', fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.35 }}>{l.need}</span>
                  {l.from === 'refocus' && <span style={{ ...mono, fontSize: 8, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--p2-deep)', background: 'rgba(157,149,245,0.16)', padding: '3px 6px', borderRadius: 999, whiteSpace: 'nowrap' }}>FROM A FIGHT</span>}
                </div>
              );
            })}
          </div>
        </div>
      </Press>

      <div style={{ ...cardBase, borderRadius: 26, padding: '20px 18px', marginTop: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
          <div>
            <Kick c="var(--ink-mute)">wavelength · this month</Kick>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
              <Serif s={40} style={{ background: 'var(--us)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', paddingRight: '0.06em' }}>76%</Serif>
              <span style={{ ...mono, fontSize: 12, color: 'var(--match-deep)', fontWeight: 700 }}>▲ 9%</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 7, height: 90 }}>
          {hist.map((h, i) => (
            <div key={i} style={{ flex: 1, height: `${h}%`, borderRadius: 8, background: i === hist.length - 1 ? 'var(--us)' : 'var(--sunken)', transition: 'height .5s ease' }} />
          ))}
        </div>
        <div style={{ ...mono, fontSize: 9, letterSpacing: '0.1em', color: 'var(--ink-mute)', textAlign: 'right', marginTop: 8 }}>LAST 7 DROPS</div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
        {[['142', 'answered'], ['38', 'twin moments'], ['12', 'packs played']].map(([b, l], i) => (
          <div key={i} style={{ ...cardBase, borderRadius: 20, padding: '16px 8px', flex: 1, textAlign: 'center' }}>
            <Serif s={26}>{b}</Serif>
            <Kick style={{ marginTop: 5 }}>{l}</Kick>
          </div>
        ))}
      </div>

      {/* history list */}
      <div style={{ marginTop: 24, marginBottom: 10 }}><Kick>your drop history</Kick></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {ARCHIVE.map((d) => (
          <Press key={d.code} onClick={() => openDrop(d.code)}>
            <div style={{ ...cardBase, borderRadius: 20, padding: '13px 15px', display: 'flex', alignItems: 'center', gap: 13 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: 'var(--sunken)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{d.emoji}</div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-disp)' }}>{d.title}</div>
                <Kick style={{ marginTop: 3 }}>{d.code} · {d.day}</Kick>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ ...serif, fontSize: 22, background: 'var(--us)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{d.wave}%</div>
                <Kick style={{ marginTop: 2 }}>{d.twins} 👯</Kick>
              </div>
              <G d={I.chevR} size={17} c="var(--ink-mute)" />
            </div>
          </Press>
        ))}
      </div>
    </Screen>
  );
}

window.PXS = { Home, Play, Waiting, Reveal, Packs, Us };
