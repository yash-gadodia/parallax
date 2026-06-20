// Parallax (couples), router. Wires core + screens + flows.
const { Phone, Nav, Toast, reveal } = window.PXC;
const { Home, Play, Waiting, Reveal, Packs, Us } = window.PXS;
const { Onboarding, Profile, PackDetail, DropDetail, Thread, ShareCard, PlusSheet, SpiceSheet } = window.PXF;
const { WidgetSetup, HomeScreen, Wrapped, Streak } = window.PXV;
const { Checkout, PlusSuccess, ManageSub, EditProfile } = window.PXP;
const { Refocus } = window.PXR;
const { LoveMap } = window.PXM;
const { Activity, Milestone } = window.PXA;
const { useState } = React;

function App() {
  const [state, setState] = useState({
    screen: 'onboarding', streak: 23, done: false, wave: 83, plus: false, name: 'Yash', spice: 'Flirty',
    myPicks: [null, null, null], myHunches: [null, null, null],
    play: { idx: 0, phase: 'pick' },
    pack: null, drop: null,
  });
  const [sheet, setSheet] = useState(null);   // 'share' | 'plus'
  const [toast, setToast] = useState(null);

  const set = (fn) => setState(typeof fn === 'function' ? fn : (s => ({ ...s, ...fn })));
  const go = (screen) => setState(s => ({ ...s, screen, wave: screen === 'reveal' ? reveal(s).wave : s.wave }));
  const fireToast = (m) => { setToast(m); setTimeout(() => setToast(null), 1900); };

  const openPlay = () => setState(s => ({ ...s, screen: 'play',
    myPicks: [null, null, null], myHunches: [null, null, null], play: { idx: 0, phase: 'pick' } }));
  const openPack = (id) => setState(s => ({ ...s, screen: 'packDetail', pack: id }));
  const openDrop = (code) => setState(s => ({ ...s, screen: 'dropDetail', drop: code }));
  const openThread = () => setState(s => ({ ...s, screen: 'thread' }));
  const openWidget = () => go('widgetSetup');
  const openWrapped = () => go('wrapped');
  const openStreak = () => go('streak');
  const openPlus = () => setState(s => s.plus ? { ...s, screen: 'manageSub' } : { ...s, screen: 'checkout' });
  const subscribe = () => { setState(s => ({ ...s, plus: true, screen: 'plusSuccess' })); };
  const cancelPlus = () => { setState(s => ({ ...s, plus: false, screen: 'profile' })); fireToast('Plus cancelled · you’ll keep it till Jun 15'); };
  const openEditProfile = () => go('editProfile');
  const openLoveMap = () => go('lovemap');
  const openActivity = () => go('activity');
  const openMilestone = (days = 30) => setState(s => ({ ...s, screen: 'milestone', milestoneDays: days }));
  const openSpice = () => setSheet('spice');
  const saveProfile = (name) => { setState(s => ({ ...s, name, screen: 'profile' })); fireToast('Profile saved ✓'); };

  const sc = state.screen;
  const showNav = ['home', 'packs', 'us'].includes(sc);

  return (
    <>
      <div className="hint">parallax · the final couples app — starts at onboarding, tap through</div>
      <Phone>
        {sc === 'onboarding' && <Onboarding finish={() => go('home')} />}
        {sc === 'home' && <Home state={state} go={go} openPlay={openPlay} openProfile={() => go('profile')} openWidget={openWidget} openStreak={openStreak} openRefocus={() => go('refocus')} openActivity={openActivity} />}
        {sc === 'play' && <Play state={state} set={set} go={go} />}
        {sc === 'waiting' && <Waiting set={set} go={go} />}
        {sc === 'reveal' && <Reveal state={state} go={go} share={() => setSheet('share')} openThread={openThread} />}
        {sc === 'packs' && <Packs openPack={openPack} openPlus={openPlus} plus={state.plus} />}
        {sc === 'us' && <Us state={state} openDrop={openDrop} openProfile={() => go('profile')} openWrapped={openWrapped} openStreak={openStreak} openLoveMap={openLoveMap} />}
        {sc === 'profile' && <Profile state={state} back={() => go('home')} toast={fireToast}
          replayIntro={() => go('onboarding')} openPlus={openPlus} openEditProfile={openEditProfile}
          openSpice={openSpice} openWidget={openWidget}
          unpair={() => { fireToast('Unpaired (just kidding 💔)'); }} />}
        {sc === 'packDetail' && <PackDetail packId={state.pack} back={() => go('packs')} toast={fireToast}
          openPlus={openPlus} plus={state.plus} go={go} />}
        {sc === 'dropDetail' && <DropDetail code={state.drop} back={() => go('us')} />}
        {sc === 'thread' && <Thread back={() => go('reveal')} toast={fireToast} />}
        {sc === 'widgetSetup' && <WidgetSetup go={go} />}
        {sc === 'homeScreen' && <HomeScreen go={go} openPlay={openPlay} toast={fireToast} />}
        {sc === 'wrapped' && <Wrapped back={() => go('us')} share={() => setSheet('share')} />}
        {sc === 'streak' && <Streak state={state} back={() => go('home')} toast={fireToast} openMilestone={openMilestone} />}        {sc === 'checkout' && <Checkout back={() => go(state.pack ? 'packDetail' : 'packs')} subscribe={subscribe} />}
        {sc === 'plusSuccess' && <PlusSuccess go={go} />}
        {sc === 'manageSub' && <ManageSub back={() => go('profile')} toast={fireToast} cancelPlus={cancelPlus} />}
        {sc === 'editProfile' && <EditProfile state={state} back={() => go('profile')} save={saveProfile} toast={fireToast} />}
        {sc === 'refocus' && <Refocus back={() => go('home')} toast={fireToast} openLoveMap={openLoveMap} />}
        {sc === 'lovemap' && <LoveMap back={() => go('us')} openRefocus={() => go('refocus')} toast={fireToast} />}
        {sc === 'activity' && <Activity back={() => go('home')} go={go} openPlay={openPlay} openStreak={openStreak} toast={fireToast} />}
        {sc === 'milestone' && <Milestone days={state.milestoneDays || 30} back={() => go('streak')} share={() => setSheet('share')} />}

        {showNav && <Nav active={sc === 'packs' ? 'home' : sc} go={go} />}
        {sheet === 'share' && <ShareCard state={state} onClose={() => setSheet(null)} toast={fireToast} />}
        {sheet === 'plus' && <PlusSheet onClose={() => setSheet(null)} onStart={() => { setSheet(null); go('checkout'); }} />}
        {sheet === 'spice' && <SpiceSheet current={state.spice} onClose={() => setSheet(null)}
          onPick={(v) => { setState(s => ({ ...s, spice: v })); setSheet(null); fireToast('Spice set to ' + v); }} />}
        {toast && <Toast msg={toast} />}
      </Phone>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
