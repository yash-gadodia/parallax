// Parallax (couples), Refocus: AI conflict mediation. Two private sides → one clearer picture.
const { useState, useEffect, useRef, YOU, PAR, I, G, Peek, Mark, anaglyph,
  mono, serif, Kick, Serif, Tok, Press, Btn, cardBase, Screen, TopBar } = window.PXC;

// Dani's side is scripted (fictional partner); the user's side is real input.
const DANI_SIDE = "You said you'd sort out Saturday and then went quiet the whole day. I felt like an afterthought, so yeah, I got short with you. I hate being left on read when it's about us.";
const SAMPLE_LOG = "Me: so are we still on for saturday?\nMe: helloo\nMe: ok i guess not\nDani: i was literally at work??\nDani: you always do this\nMe: do what\nDani: forget it. goodnight.";
const VOICE_TRANSCRIPT = "Okay so… I wasn't ignoring her. Work completely buried me and I figured I'd reply once I had an actual answer about Saturday. I didn't think going quiet for a few hours meant I didn't care. Then I got home and everything was already cold and I just shut down.";

// crafted fallback, also the quality bar for the live prompt
const EXEMPLAR = {
  agree: ["Saturday plans never actually got settled", "The texts turned short and cold", "You both went to bed upset"],
  angles: {
    you: "You were underwater at work and meant to reply once you had a real answer, the quiet wasn't about Dani.",
    dani: "Dani read the silence as “I’m not a priority,” and that genuinely stung.",
  },
  underneath: {
    you: "You need a little slack when you’re slammed, to be trusted, not chased.",
    dani: "Dani needs to feel chosen, especially when plans are up in the air.",
  },
  wayback: "Neither of you stopped caring, you collided on timing and what the silence meant. A tiny “slammed, will reply tonight” keeps quiet from ever meaning “forgotten.”",
  bridge: "hey, i went quiet yesterday because work buried me, not because you weren’t on my mind. you were never an afterthought. can we redo saturday? 🤍",
};

async function analyze(userText, daniText) {
  const prompt = `You are a warm, even-handed couples mediator. Two partners each privately shared their side of a small conflict. Never take sides or name a winner. Be compassionate, concrete, and brief.

PARTNER A ("you") said: "${userText}"
PARTNER B ("Dani") said: "${daniText}"

Return ONLY minified JSON, no prose, exact shape:
{"agree":["2-3 short shared facts"],"angles":{"you":"1 sentence: how it looked from A's side","dani":"1 sentence: from B's side"},"underneath":{"you":"1 short sentence: A's real need under the surface","dani":"1 short sentence: B's real need"},"wayback":"2 warm blame-free sentences on a path forward","bridge":"a short warm text A could send B, lowercase texting voice, under 40 words"}`;
  try {
    if (window.claude && window.claude.complete) {
      const raw = await window.claude.complete(prompt);
      const j = JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1));
      if (j && j.agree && j.angles && j.underneath && j.wayback && j.bridge) return j;
    }
  } catch (e) { /* fall through */ }
  return EXEMPLAR;
}

function Refocus({ back, toast, openLoveMap }) {
  const [step, setStep] = useState('intro');   // intro · mode · share · waiting · result
  const [mode, setMode] = useState('text');
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);

  // ── INTRO ───────────────────────────────────────────────────
  if (step === 'intro') {
    const promises = [
      [I.lock, 'Your words stay private', 'Dani sees the resolution, never your raw venting.'],
      [I.us, 'Both sides, no winner', 'The AI is a mediator, not a referee. Nobody’s “right.”'],
      [I.heart, 'A way back, together', 'It ends with something kind you can actually say.'],
    ];
    return (
      <>
        <TopBar title="refocus" onBack={back} />
        <Screen pb={130}>
          <div style={{ height: 44 }} />
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
            <div style={{ animation: 'pxfloat 4s ease-in-out infinite' }}><Peek size={104} mood="search" /></div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Kick c="var(--p2-deep)">refocus</Kick>
            <Serif s={36} style={{ margin: '10px 0 10px', lineHeight: 1.08 }}>Things feel a little<br />out of focus?</Serif>
            <div style={{ fontSize: 15, color: 'var(--ink-soft)', lineHeight: 1.55, maxWidth: 300, margin: '0 auto' }}>
              A rough moment is just the two of you seeing it from different angles. Share your side privately, Dani shares theirs, and we’ll find where they meet.
            </div>
          </div>
          <div style={{ ...cardBase, borderRadius: 24, padding: '6px 16px', marginTop: 24 }}>
            {promises.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '14px 0', borderTop: i ? '1px solid var(--line)' : 'none' }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, background: 'var(--us-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <G d={p[0]} size={18} c="var(--p2-deep)" />
                </div>
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--ink)' }}>{p[1]}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 2, lineHeight: 1.4 }}>{p[2]}</div>
                </div>
              </div>
            ))}
          </div>
        </Screen>
        <div style={{ position: 'absolute', left: 20, right: 20, bottom: 22, zIndex: 40 }}>
          <Btn kind="us" onClick={() => setStep('mode')} sub="just your side, privately">Start, share my side</Btn>
        </div>
      </>
    );
  }

  // ── MODE ────────────────────────────────────────────────────
  if (step === 'mode') {
    const modes = [
      ['text', '✍️', 'Type it out', 'Say what happened in your own words'],
      ['voice', '🎙️', 'Voice note', 'Just talk, we’ll transcribe it'],
      ['paste', '💬', 'Paste your texts', 'Drop the actual conversation in'],
    ];
    const pick = (m) => {
      setMode(m);
      setText(m === 'paste' ? SAMPLE_LOG : m === 'voice' ? '' : '');
      setStep('share');
    };
    return (
      <>
        <TopBar title="how to share" onBack={() => setStep('intro')} />
        <Screen pb={40}>
          <div style={{ height: 50 }} />
          <Serif s={32} style={{ marginBottom: 6 }}>How do you want to get it out?</Serif>
          <div style={{ fontSize: 14.5, color: 'var(--ink-soft)', marginBottom: 22 }}>However it comes easiest. Only the AI reads this.</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {modes.map(m => (
              <Press key={m[0]} onClick={() => pick(m[0])}>
                <div style={{ ...cardBase, borderRadius: 22, padding: '18px 18px', display: 'flex', alignItems: 'center', gap: 15, textAlign: 'left' }}>
                  <div style={{ fontSize: 30 }}>{m[1]}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16.5, fontWeight: 700, color: 'var(--ink)' }}>{m[2]}</div>
                    <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 2 }}>{m[3]}</div>
                  </div>
                  <G d={I.chevR} size={18} c="var(--ink-mute)" />
                </div>
              </Press>
            ))}
          </div>
        </Screen>
      </>
    );
  }

  // ── SHARE ───────────────────────────────────────────────────
  if (step === 'share') {
    return <ShareSide mode={mode} text={text} setText={setText}
      back={() => setStep('mode')} submit={() => setStep('waiting')} />;
  }

  // ── WAITING + ANALYZING ─────────────────────────────────────
  if (step === 'waiting') {
    return <Working userText={text || VOICE_TRANSCRIPT} daniText={DANI_SIDE}
      done={(res) => { setResult(res); setStep('result'); }} />;
  }

  // ── RESULT ──────────────────────────────────────────────────
  return <Resolution r={result || EXEMPLAR} back={back} toast={toast} openLoveMap={openLoveMap} />;
}

// ── share input ───────────────────────────────────────────────
function ShareSide({ mode, text, setText, back, submit }) {
  const [rec, setRec] = useState(false);
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    if (!rec) return;
    const t = setInterval(() => setSecs(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [rec]);
  const stopRec = () => { setRec(false); setText(VOICE_TRANSCRIPT); };

  const title = mode === 'voice' ? 'your voice note' : mode === 'paste' ? 'paste the convo' : 'your side';
  const ready = (text && text.trim().length > 3) || mode === 'voice';

  return (
    <>
      <TopBar title={title} onBack={back} />
      <div style={{ position: 'absolute', inset: 0, paddingTop: 100, paddingBottom: 96, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '0 20px 10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 13px', borderRadius: 14, background: 'var(--us-soft)', border: '1px solid rgba(157,149,245,0.22)' }}>
            <G d={I.lock} size={15} c="var(--p2-deep)" />
            <span style={{ fontSize: 12.5, color: 'var(--p2-deep)', fontWeight: 600, lineHeight: 1.35 }}>Private to the AI. Dani only ever sees the resolution.</span>
          </div>
        </div>

        {mode === 'voice' && !text ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22, padding: 24 }}>
            <div style={{ ...mono, fontSize: 30, fontWeight: 700, color: 'var(--ink)' }}>{String(Math.floor(secs / 60)).padStart(2, '0')}:{String(secs % 60).padStart(2, '0')}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, height: 50 }}>
              {Array.from({ length: 22 }).map((_, i) => (
                <div key={i} style={{ width: 4, borderRadius: 3, background: rec ? 'var(--p2)' : 'var(--sunken)',
                  height: rec ? `${20 + Math.abs(Math.sin(i * 1.1 + secs)) * 30}px` : '10px',
                  animation: rec ? `pxpulse ${0.6 + (i % 5) * 0.12}s ease-in-out infinite` : 'none', transition: 'height .2s' }} />
              ))}
            </div>
            <Press onClick={() => rec ? stopRec() : setRec(true)} scale={false} style={{ width: 'auto' }}>
              <div style={{ width: 76, height: 76, borderRadius: 999, background: rec ? 'var(--p1-deep)' : 'var(--us)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow)' }}>
                {rec ? <div style={{ width: 24, height: 24, borderRadius: 6, background: '#fff' }} />
                  : <G d="M10 3a3 3 0 013 3v4a3 3 0 01-6 0V6a3 3 0 013-3zM5 9.5a5 5 0 0010 0M10 14.5V17" size={30} c="#fff" sw={1.6} />}
              </div>
            </Press>
            <div style={{ fontSize: 13.5, color: 'var(--ink-soft)' }}>{rec ? 'tap to stop' : 'tap to start talking'}</div>
          </div>
        ) : (
          <div style={{ flex: 1, padding: '12px 20px 0', display: 'flex', flexDirection: 'column' }}>
            {mode === 'voice' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                <G d={I.check} size={14} c="var(--match-deep)" sw={2.4} />
                <span style={{ ...mono, fontSize: 11, color: 'var(--match-deep)', letterSpacing: '0.08em' }}>TRANSCRIBED · EDIT IF YOU LIKE</span>
              </div>
            )}
            <textarea value={text} onChange={e => setText(e.target.value)} autoFocus={mode === 'text'}
              placeholder={mode === 'paste' ? 'Paste the messages here…' : 'What happened, from your side? Say it how you actually feel, messy is fine.'}
              style={{ flex: 1, width: '100%', boxSizing: 'border-box', border: '1px solid var(--line)', borderRadius: 18,
                background: 'var(--surface)', padding: '15px 16px', fontSize: 15.5, lineHeight: 1.55, fontFamily: mode === 'paste' ? 'var(--font-mono)' : 'var(--font-ui)',
                color: 'var(--ink)', outline: 'none', resize: 'none', boxShadow: 'var(--shadow-soft)',
                whiteSpace: 'pre-wrap' }} />
          </div>
        )}
      </div>
      <div style={{ position: 'absolute', left: 20, right: 20, bottom: 22, zIndex: 40 }}>
        <Btn kind="us" onClick={submit} disabled={!ready} sub="then we wait for Dani">Share my side</Btn>
      </div>
    </>
  );
}

// ── working: waiting for partner + AI analysis ────────────────
function Working({ userText, daniText, done }) {
  const [phase, setPhase] = useState(0); // 0 you in · 1 dani in · 2 analyzing
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 1400);
    const t2 = setTimeout(() => setPhase(2), 2700);
    const min = new Promise(r => setTimeout(r, 4200));
    Promise.all([analyze(userText, daniText), min]).then(([res]) => done(res));
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const lines = [
    ['var(--p1)', YOU, true, 'You shared your side', phase >= 0],
    ['var(--p2)', PAR, false, 'Dani shared their side', phase >= 1],
  ];
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 34, textAlign: 'center' }}>
      <div style={{ position: 'relative', width: 150, height: 120, marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', width: 120, height: 120, borderRadius: 999, background: 'var(--us-soft)', animation: 'pxfloat 3.5s ease-in-out infinite' }} />
        <div style={{ position: 'relative', animation: 'pxfloat 4s ease-in-out infinite' }}>
          <Peek size={128} mood={phase >= 2 ? 'focus' : 'search'} />
        </div>
      </div>
      <Serif s={28} italic style={{ margin: '0 auto 24px', maxWidth: 280 }}>
        {phase < 1 ? 'sharing your side…' : phase < 2 ? 'Dani’s in too…' : 'finding where you meet…'}
      </Serif>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 280 }}>
        {lines.map((l, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 15px', borderRadius: 16,
            background: 'var(--surface)', border: '1px solid var(--line)', opacity: l[4] ? 1 : 0.4, transition: 'opacity .4s ease', boxShadow: l[4] ? 'var(--shadow-soft)' : 'none' }}>
            <Tok who={l[1]} you={l[2]} size={28} />
            <span style={{ flex: 1, textAlign: 'left', fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{l[3]}</span>
            {l[4] ? <G d={I.check} size={16} c="var(--match-deep)" sw={2.6} />
              : <div style={{ width: 16, height: 16, borderRadius: 999, border: '2px solid var(--sunken)' }} />}
          </div>
        ))}
      </div>
      {phase >= 2 && (
        <div style={{ marginTop: 22, display: 'flex', gap: 6 }}>
          {[0, 1, 2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--p2)', animation: `pxpulse 1s ease-in-out ${i * 0.18}s infinite` }} />)}
        </div>
      )}
    </div>
  );
}

// ── resolution ────────────────────────────────────────────────
function Resolution({ r, back, toast, openLoveMap }) {
  const [msg, setMsg] = useState(r.bridge);
  const [sent, setSent] = useState(false);
  return (
    <>
      <TopBar title="back in focus" onBack={back} />
      <Screen pb={40}>
        <div style={{ height: 46 }} />
        {/* hero */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
            <div style={{ animation: 'pxfloat 4s ease-in-out infinite' }}><Peek size={84} mood="focus" /></div>
          </div>
          <Kick c="var(--match-deep)">refocused</Kick>
          <Serif s={32} italic style={{ margin: '8px auto 14px', maxWidth: 300 }}>You’re closer than it felt.</Serif>
          <div style={{ fontSize: 13.5, color: 'var(--ink-soft)', maxWidth: 290, margin: '0 auto', lineHeight: 1.5 }}>Dani saw this too, the resolution, not your raw words.</div>
        </div>

        {/* agree / overlap */}
        <Section icon="🤝" label="where you both agree" tint="var(--match)">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {r.agree.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 18, height: 18, borderRadius: 999, background: 'rgba(84,194,160,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <G d={I.check} size={11} c="var(--match-deep)" sw={2.6} />
                </div>
                <span style={{ fontSize: 14.5, color: 'var(--ink)', fontWeight: 600, lineHeight: 1.4 }}>{a}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* the parallax, two angles */}
        <Section icon="👀" label="how it looked from each angle" tint="var(--p2)">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Angle who={YOU} you label="your angle" text={r.angles.you} />
            <Angle who={PAR} label="Dani’s angle" text={r.angles.dani} />
          </div>
        </Section>

        {/* underneath */}
        <Section icon="💗" label="what’s really underneath" tint="var(--p1)">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Need who={YOU} you text={r.underneath.you} />
            <Need who={PAR} text={r.underneath.dani} />
          </div>
        </Section>

        {/* way back */}
        <div style={{ ...cardBase, borderRadius: 24, padding: '20px 18px', marginTop: 16, background: 'var(--us-soft)', border: '1px solid rgba(157,149,245,0.25)' }}>
          <Kick c="var(--p2-deep)">a way back</Kick>
          <div style={{ fontSize: 15.5, color: 'var(--ink)', lineHeight: 1.55, marginTop: 8, fontFamily: 'var(--font-disp)', fontStyle: 'italic' }}>{r.wayback}</div>
        </div>

        {/* bridge message */}
        <div style={{ ...cardBase, borderRadius: 24, padding: '18px 16px', marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Tok who={YOU} you size={22} />
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', flex: 1 }}>Say it to Dani?</span>
            <span style={{ ...mono, fontSize: 9.5, letterSpacing: '0.1em', color: 'var(--ink-mute)' }}>AI DRAFT · YOURS TO EDIT</span>
          </div>
          <textarea value={msg} onChange={e => setMsg(e.target.value)} rows={3}
            style={{ width: '100%', boxSizing: 'border-box', border: '1px solid var(--line)', borderRadius: 16, background: 'var(--sunken)',
              padding: '13px 14px', fontSize: 14.5, lineHeight: 1.5, fontFamily: 'var(--font-ui)', color: 'var(--ink)', outline: 'none', resize: 'none' }} />
          <div style={{ marginTop: 12 }}>
            <Btn kind={sent ? 'soft' : 'us'} onClick={() => { if (!sent) { setSent(true); toast('Sent to Dani 🤍'); } }}>
              {sent ? 'Sent 🤍' : 'Send to Dani'}
            </Btn>
          </div>
        </div>

        {/* captured into the love map, closes the loop */}
        <div style={{ ...cardBase, borderRadius: 24, padding: '18px 18px', marginTop: 16, background: 'var(--us-soft)', border: '1px solid rgba(157,149,245,0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 17 }}>🗺️</span>
            <span style={{ ...mono, fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--p2-deep)' }}>added to your love map</span>
          </div>
          <div style={{ fontSize: 14, color: 'var(--ink)', lineHeight: 1.5, marginBottom: 14 }}>Parallax will gently weave these into your next few drops, so next time, it’s something you both just <i>know</i>.</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
            <Need who={YOU} you text={r.underneath.you} />
            <Need who={PAR} text={r.underneath.dani} />
          </div>
          <Btn kind="soft" onClick={openLoveMap} sub="see what you’re learning">Open your Love Map</Btn>
        </div>

        <div style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--ink-mute)', marginTop: 20, lineHeight: 1.5, padding: '0 10px' }}>
          Refocus helps you talk it through, it isn’t therapy. For the heavy stuff, please reach for a real pro. 🤍
        </div>
      </Screen>
    </>
  );
}

function Section({ icon, label, tint, children }) {
  return (
    <div style={{ ...cardBase, borderRadius: 24, padding: '18px 18px', marginTop: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 17 }}>{icon}</span>
        <span style={{ ...mono, fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-soft)' }}>{label}</span>
      </div>
      {children}
    </div>
  );
}
function Angle({ who, you, label, text }) {
  const c = you ? 'var(--p1)' : 'var(--p2)', deep = you ? 'var(--p1-deep)' : 'var(--p2-deep)';
  return (
    <div style={{ display: 'flex', gap: 11, padding: '13px 14px', borderRadius: 16, background: you ? 'rgba(255,142,122,0.08)' : 'rgba(157,149,245,0.09)', borderLeft: `3px solid ${c}` }}>
      <Tok who={who} you={you} size={26} />
      <div>
        <Kick c={deep} style={{ marginBottom: 4 }}>{label}</Kick>
        <div style={{ fontSize: 14, color: 'var(--ink)', lineHeight: 1.45 }}>{text}</div>
      </div>
    </div>
  );
}
function Need({ who, you, text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
      <Tok who={who} you={you} size={26} />
      <div style={{ fontSize: 14, color: 'var(--ink)', lineHeight: 1.4, flex: 1 }}>{text}</div>
    </div>
  );
}

window.PXR = { Refocus };
