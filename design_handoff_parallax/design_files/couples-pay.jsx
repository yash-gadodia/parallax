// Parallax (couples), payments, edit profile, manage subscription. Exports window.PXP.
const { useState, YOU, PAR, I, G, Mark, mono, serif, Kick, Serif, Tok, Press, Btn, cardBase, Screen, TopBar } = window.PXC;

const PLANS = {
  year: { price: '$39.99', per: '/yr', mo: '$3.33/mo', tag: 'save 33%', badge: 'BEST VALUE' },
  month: { price: '$4.99', per: '/mo', mo: 'billed monthly', tag: '', badge: '' },
};
const PERKS = [
  ['🎁', 'Every themed pack', 'After dark, Chaos hour, Someday & more'],
  ['♾️', 'Unlimited drops', 'Send each other questions any time'],
  ['📈', 'Full wavelength history', 'Every reveal & couple type, kept forever'],
  ['🧊', 'Streak freezes', 'Forgiveness when life happens, for both of you'],
];

// ── CHECKOUT ──────────────────────────────────────────────────
function Checkout({ back, subscribe }) {
  const [plan, setPlan] = useState('year');
  const [method, setMethod] = useState('apple');
  const [proc, setProc] = useState(false);
  const pl = PLANS[plan];
  const pay = () => { setProc(true); setTimeout(() => subscribe(plan), 1500); };

  const PlanCard = ({ id }) => {
    const p = PLANS[id], on = plan === id;
    return (
      <Press onClick={() => setPlan(id)}>
        <div style={{ position: 'relative', borderRadius: 20, padding: '15px 16px', textAlign: 'left',
          background: on ? 'var(--us-soft)' : 'var(--surface)', border: `2px solid ${on ? 'var(--p2)' : 'var(--line)'}`,
          boxShadow: on ? 'var(--shadow)' : 'var(--shadow-soft)', transition: 'all .18s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <div style={{ width: 22, height: 22, borderRadius: 999, flexShrink: 0, border: `2px solid ${on ? 'var(--p2-deep)' : 'var(--ink-mute)'}`,
              background: on ? 'var(--p2-deep)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {on && <G d={I.check} size={12} c="#fff" sw={2.6} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15.5, fontWeight: 700, color: 'var(--ink)', textTransform: 'capitalize' }}>{id === 'year' ? 'Annual' : 'Monthly'}</div>
              <div style={{ ...mono, fontSize: 11, color: 'var(--ink-soft)', marginTop: 2 }}>{p.mo}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ ...serif, fontSize: 23, color: 'var(--ink)' }}>{p.price}</div>
              <div style={{ ...mono, fontSize: 10, color: 'var(--ink-mute)' }}>{p.per}</div>
            </div>
          </div>
          {p.badge && (
            <div style={{ position: 'absolute', top: -9, right: 14, ...mono, fontSize: 8.5, fontWeight: 700, letterSpacing: '0.1em',
              color: '#fff', background: 'var(--us)', padding: '3px 9px', borderRadius: 999 }}>{p.badge}</div>
          )}
        </div>
      </Press>
    );
  };

  return (
    <>
      <TopBar title="parallax plus" onBack={back} />
      <Screen pb={150}>
        <div style={{ height: 46 }} />
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div style={{ display: 'inline-flex', padding: 12, borderRadius: 20, background: 'var(--us-soft)', marginBottom: 12 }}><Mark size={36} /></div>
          <Serif s={34} style={{ lineHeight: 1.05 }}>Unlock everything,<br />for both of you.</Serif>
          <div style={{ fontSize: 14, color: 'var(--ink-soft)', marginTop: 8 }}>One subscription covers you <i>and</i> Dani.</div>
        </div>

        {/* perks */}
        <div style={{ ...cardBase, borderRadius: 22, padding: '6px 16px', marginBottom: 20 }}>
          {PERKS.map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0',
              borderTop: i ? '1px solid var(--line)' : 'none' }}>
              <span style={{ fontSize: 20 }}>{p[0]}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{p[1]}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 1 }}>{p[2]}</div>
              </div>
              <G d={I.check} size={16} c="var(--match-deep)" sw={2.4} />
            </div>
          ))}
        </div>

        <Kick style={{ marginBottom: 10, marginLeft: 4 }}>choose your plan</Kick>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginBottom: 22 }}>
          <PlanCard id="year" /><PlanCard id="month" />
        </div>

        <Kick style={{ marginBottom: 10, marginLeft: 4 }}>payment</Kick>
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          {[['apple', 'Apple Pay', I.apple], ['card', 'Card', I.card]].map(([id, label, ic]) => {
            const on = method === id;
            return (
              <Press key={id} onClick={() => setMethod(id)} style={{ flex: 1, width: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 8px', borderRadius: 16,
                  background: on ? 'var(--ink)' : 'var(--surface)', border: `1.5px solid ${on ? 'var(--ink)' : 'var(--line)'}`,
                  color: on ? '#fff' : 'var(--ink)', boxShadow: 'var(--shadow-soft)' }}>
                  <G d={ic} size={18} c={on ? '#fff' : 'var(--ink)'} fill={id === 'apple' ? (on ? '#fff' : 'var(--ink)') : 'none'} sw={id === 'apple' ? 0 : 1.6} />
                  <span style={{ fontSize: 14.5, fontWeight: 700 }}>{label}</span>
                </div>
              </Press>
            );
          })}
        </div>

        {method === 'card' && (
          <div style={{ ...cardBase, borderRadius: 18, padding: 14, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 6 }}>
            <CardField label="Card number" placeholder="1234  5678  9012  3456" icon={I.card} />
            <div style={{ display: 'flex', gap: 10 }}>
              <CardField label="Expiry" placeholder="MM / YY" flex />
              <CardField label="CVC" placeholder="123" flex />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <G d={I.lock} size={12} c="var(--ink-mute)" />
              <span style={{ fontSize: 11, color: 'var(--ink-mute)' }}>Encrypted & secure. Cancel anytime.</span>
            </div>
          </div>
        )}
        {method === 'apple' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: 2 }}>
            <G d={I.lock} size={12} c="var(--ink-mute)" />
            <span style={{ fontSize: 11.5, color: 'var(--ink-mute)' }}>Confirm with Face ID. Cancel anytime.</span>
          </div>
        )}
      </Screen>

      {/* sticky CTA */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '14px 20px 22px', zIndex: 40,
        background: 'linear-gradient(transparent, var(--bg-1) 36%)' }}>
        <Btn kind="us" onClick={pay} sub={`7 days free, then ${pl.price}${pl.per}`}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            {method === 'apple' ? <G d={I.apple} size={18} c="#fff" fill="#fff" sw={0} /> : null}
            Start free trial
          </span>
        </Btn>
      </div>

      {proc && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 90, background: 'rgba(40,28,50,0.45)', backdropFilter: 'blur(3px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
          <div style={{ width: 54, height: 54, borderRadius: 999, border: '4px solid rgba(255,255,255,0.4)', borderTopColor: '#fff',
            animation: 'pxspin 0.8s linear infinite' }} />
          <div style={{ color: '#fff', fontSize: 15, fontWeight: 600 }}>Confirming…</div>
        </div>
      )}
    </>
  );
}
function CardField({ label, placeholder, icon, flex }) {
  return (
    <div style={{ flex: flex ? '1 1 0' : 'none', minWidth: 0 }}>
      <div style={{ ...mono, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-mute)', marginBottom: 5 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 13px', borderRadius: 12, background: 'var(--sunken)', border: '1px solid var(--line)' }}>
        {icon && <G d={icon} size={16} c="var(--ink-mute)" />}
        <input placeholder={placeholder} style={{ flex: 1, border: 'none', background: 'none', outline: 'none', fontSize: 14.5,
          fontFamily: 'var(--font-ui)', color: 'var(--ink)', minWidth: 0 }} />
      </div>
    </div>
  );
}

// ── PLUS SUCCESS ──────────────────────────────────────────────
function PlusSuccess({ go }) {
  const hearts = Array.from({ length: 10 }, (_, i) => ({ id: i, x: 6 + Math.random() * 88, d: Math.random() * 0.7, e: ['💞', '💗', '🫶', '✨', '🎉'][i % 5] }));
  return (
    <div style={{ position: 'absolute', inset: 0, paddingTop: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 32px 0', textAlign: 'center', overflow: 'hidden' }}>
      {hearts.map(h => (
        <div key={h.id} style={{ position: 'absolute', bottom: 120, left: `${h.x}%`, fontSize: 24,
          animation: `pxheart 1.8s ease-out ${h.d}s forwards`, pointerEvents: 'none' }}>{h.e}</div>
      ))}
      <div style={{ position: 'relative', width: 110, height: 110, marginBottom: 8 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 999, background: 'var(--us)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 16px 40px rgba(112,100,230,0.3)' }}>
          <G d={I.check} size={52} c="#fff" sw={2.4} />
        </div>
      </div>
      <Kick c="var(--p2-deep)" style={{ marginTop: 16 }}>welcome to plus</Kick>
      <Serif s={42} italic style={{ margin: '8px 0 14px' }}>You’re both in 💞</Serif>
      <div style={{ fontSize: 15.5, color: 'var(--ink-soft)', lineHeight: 1.55, maxWidth: 290 }}>
        Every pack is unlocked, drops are unlimited, and your full history is saved, for you and Dani.
      </div>
      <div style={{ marginTop: 30, width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Btn kind="us" onClick={() => go('packs')} sub="all 4 packs unlocked">Explore the packs</Btn>
        <Press onClick={() => go('home')}><div style={{ textAlign: 'center', padding: 10, fontSize: 14, fontWeight: 600, color: 'var(--ink-mute)' }}>Back to today</div></Press>
      </div>
    </div>
  );
}

// ── MANAGE SUBSCRIPTION ───────────────────────────────────────
function ManageSub({ back, toast, cancelPlus }) {
  return (
    <>
      <TopBar title="manage plus" onBack={back} />
      <Screen pb={40}>
        <div style={{ height: 50 }} />
        <div style={{ ...cardBase, borderRadius: 24, padding: 20, background: 'var(--us-soft)', border: '1px solid rgba(157,149,245,0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Mark size={24} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>Parallax Plus</div>
              <Kick c="var(--match-deep)" style={{ marginTop: 3 }}>● active · free trial</Kick>
            </div>
            <span style={{ ...mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: '#fff', background: 'var(--us)', padding: '4px 9px', borderRadius: 999 }}>ANNUAL</span>
          </div>
        </div>

        <div style={{ ...cardBase, borderRadius: 20, overflow: 'hidden', marginTop: 14 }}>
          {[['Plan', 'Annual · $39.99/yr'], ['Free trial ends', 'in 7 days'], ['Renews', 'Jun 15, 2026'], ['Shared with', 'Dani']].map((r, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px', borderTop: i ? '1px solid var(--line)' : 'none' }}>
              <span style={{ fontSize: 14.5, color: 'var(--ink-soft)', fontWeight: 600 }}>{r[0]}</span>
              <span style={{ fontSize: 14.5, color: 'var(--ink)', fontWeight: 700 }}>{r[1]}</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Btn kind="soft" onClick={() => toast('Plan switched to monthly')}>Switch to monthly</Btn>
          <Press onClick={() => { cancelPlus(); }}>
            <div style={{ textAlign: 'center', padding: 14, fontSize: 14.5, fontWeight: 700, color: 'var(--p1-deep)' }}>Cancel subscription</div>
          </Press>
        </div>
      </Screen>
    </>
  );
}

// ── EDIT PROFILE ──────────────────────────────────────────────
function EditProfile({ state, back, save, toast }) {
  const [name, setName] = useState(state.name || 'Yash');
  const [since, setSince] = useState('February 2024');
  const Field = ({ label, value, onChange, readOnly, hint }) => (
    <div>
      <div style={{ ...mono, fontSize: 9.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-mute)', marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 15px', borderRadius: 14,
        background: readOnly ? 'var(--sunken)' : 'var(--surface)', border: '1px solid var(--line)', boxShadow: readOnly ? 'none' : 'var(--shadow-soft)' }}>
        <input value={value} onChange={e => onChange && onChange(e.target.value)} readOnly={readOnly}
          style={{ flex: 1, border: 'none', background: 'none', outline: 'none', fontSize: 15.5, fontWeight: 600,
            fontFamily: 'var(--font-ui)', color: readOnly ? 'var(--ink-soft)' : 'var(--ink)', minWidth: 0 }} />
        {hint && <span style={{ fontSize: 12, color: 'var(--ink-mute)' }}>{hint}</span>}
      </div>
    </div>
  );
  return (
    <>
      <TopBar title="edit profile" onBack={back} />
      <Screen pb={120}>
        <div style={{ height: 50 }} />
        {/* avatar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ position: 'relative' }}>
            <Tok who={{ initial: (name[0] || 'Y').toUpperCase() }} you size={88} ring />
            <Press onClick={() => toast('Camera roll, pick a photo')} scale={false} style={{ position: 'absolute', bottom: -2, right: -2, width: 'auto' }}>
              <div style={{ width: 32, height: 32, borderRadius: 999, background: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid var(--surface)' }}>
                <G d="M5 7h2l1-1.5h4L13 7h2a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1V8a1 1 0 011-1zM10 13a2.3 2.3 0 100-4.6 2.3 2.3 0 000 4.6z" size={15} c="#fff" sw={1.5} />
              </div>
            </Press>
          </div>
          <Press onClick={() => toast('Camera roll, pick a photo')} scale={false} style={{ width: 'auto', marginTop: 10 }}>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--p2-deep)' }}>Change photo</span>
          </Press>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="Your name" value={name} onChange={setName} />
          <Field label="Together since" value={since} onChange={setSince} hint="📅" />
          <div>
            <div style={{ ...mono, fontSize: 9.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-mute)', marginBottom: 6 }}>paired with</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 15px', borderRadius: 14, background: 'var(--sunken)', border: '1px solid var(--line)' }}>
              <Tok who={PAR} size={32} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>Dani</div>
                <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>paired · Feb 2024</div>
              </div>
              <span style={{ ...mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--match-deep)', background: 'rgba(84,194,160,0.16)', padding: '4px 8px', borderRadius: 999 }}>LINKED</span>
            </div>
          </div>
        </div>
      </Screen>

      <div style={{ position: 'absolute', left: 20, right: 20, bottom: 22, zIndex: 40 }}>
        <Btn kind="us" onClick={() => { save(name); }}>Save changes</Btn>
      </div>
    </>
  );
}

window.PXP = { Checkout, PlusSuccess, ManageSub, EditProfile };
