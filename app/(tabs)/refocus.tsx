import React, { useState, useEffect, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { DawnBlobs } from '../../src/components/DawnBlobs';
import Toast from '../../src/components/Toast';
import { colors, gradients } from '../../src/design/tokens';
import {
  RefocusResult,
  RefocusMode,
  RefocusMediation,
  RefocusSafety,
  RefocusAiResult,
  HeatLevel,
} from '../../src/content/refocus';
import { track, EVENTS } from '../../src/lib/analytics';
import { useSession } from '../../src/features/auth/useSession';
import { useCouple } from '../../src/features/pairing/useCouple';
import { useRefocusSession } from '../../src/features/refocus/useRefocusSession';
import {
  startRefocus,
  addRefocusSide,
  parseAiResult,
  persistSoloRefocus,
  REFOCUS_ALREADY_OPEN,
} from '../../src/features/refocus/refocusActions';
import type { RefocusSession } from '../../src/types/db';
import type { Step } from '../../src/features/refocus/machine';
import { IntroStep } from '../../src/features/refocus/steps/IntroStep';
import { ModeStep } from '../../src/features/refocus/steps/ModeStep';
import { ShareStep } from '../../src/features/refocus/steps/ShareStep';
import { WaitingStep } from '../../src/features/refocus/steps/WaitingStep';
import { ErrorStep } from '../../src/features/refocus/steps/ErrorStep';
import { SafetyStep } from '../../src/features/refocus/steps/SafetyStep';
import { TogetherTopicStep } from '../../src/features/refocus/steps/TogetherTopicStep';
import { TogetherWaitingStep } from '../../src/features/refocus/steps/TogetherWaitingStep';
import { TogetherAddStep } from '../../src/features/refocus/steps/TogetherAddStep';
import { TogetherMediatingStep } from '../../src/features/refocus/steps/TogetherMediatingStep';
import { TogetherExpiredStep } from '../../src/features/refocus/steps/TogetherExpiredStep';
import { TogetherResultStep } from '../../src/features/refocus/steps/TogetherResultStep';
import { ResultStep } from '../../src/features/refocus/steps/ResultStep';
import { HeatCheckStep } from '../../src/features/refocus/steps/HeatCheckStep';
import { CoolDownStep } from '../../src/features/refocus/steps/CoolDownStep';

export default function RefocusScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>('intro');
  const [mode, setMode] = useState<RefocusMode>('text');
  const [text, setText] = useState('');
  const [result, setResult] = useState<RefocusResult | null>(null);
  const [safety, setSafety] = useState<RefocusSafety | null>(null);
  const [mediation, setMediation] = useState<RefocusMediation | null>(null);
  const [pendingTopic, setPendingTopic] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  // V2 F1/F2: the persisted solo session's id — lets "copy to share" mark the
  // bridge as sent so the repair check-in becomes due 24h later.
  const [soloSessionId, setSoloSessionId] = useState<string | null>(null);
  const [pendingPath, setPendingPath] = useState<'solo' | 'together'>('solo');
  const [heat, setHeat] = useState<HeatLevel | null>(null);
  const [heatTopic, setHeatTopic] = useState<string | null>(null);

  const { session: authSession } = useSession();
  const { couple } = useCouple();
  const myId = authSession?.user.id ?? null;
  const {
    session: rfSession,
    refresh: refreshSession,
  } = useRefocusSession(couple?.id ?? null);

  // Auto-route into an open session ONCE per session id (so the invited
  // partner's tab lands on "add your side" and a returning initiator lands on
  // waiting) — after that, back always reaches the intro without being
  // re-hijacked. While INSIDE the together flow, keep following realtime state
  // flips (waiting -> ready -> revealed / expired).
  const routedSessionRef = useRef<string | null>(null);

  const routeToSession = (s: RefocusSession) => {
    if (s.state === 'waiting_partner') {
      setStep(s.initiator === myId ? 'togetherWaiting' : 'togetherAdd');
    } else if (s.state === 'ready') {
      setStep('togetherMediating');
    } else if (s.state === 'revealed') {
      const parsed = parseAiResult(s.ai_result);
      if (parsed && parsed.type === 'mediation') {
        setMediation(parsed);
        setStep('togetherResult');
      } else if (parsed) {
        setSafety(parsed);
        setStep('togetherSafety');
      } else {
        // Revealed but the row's ai_result didn't parse — the edge fn returns
        // the stored result idempotently.
        setStep('togetherMediating');
      }
    } else {
      setStep('togetherExpired');
    }
  };

  useEffect(() => {
    if (!rfSession || !myId) return;
    const following =
      step === 'togetherWaiting' || step === 'togetherAdd';
    const firstSight = step === 'intro' && routedSessionRef.current !== rfSession.id;
    if (!following && !firstSight) return;
    routedSessionRef.current = rfSession.id;
    routeToSession(rfSession);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rfSession, myId]);

  const exitToTabs = () => {
    if (router.canGoBack()) router.back();
    else router.navigate('/(tabs)/today');
  };

  const handleBack = () => {
    if (step === 'intro') {
      exitToTabs();
    } else if (step === 'heatCheck') {
      setStep('intro');
    } else if (step === 'coolDown') {
      setStep('heatCheck');
    } else if (step === 'mode') {
      setStep('heatCheck');
    } else if (step === 'share') {
      setStep('mode');
    } else if (step === 'waiting') {
      // Cancel the analysis and return to the compose step (keeps their input).
      setStep('share');
    } else if (step === 'error') {
      setStep('share');
    } else if (step === 'result' || step === 'soloSafety') {
      exitToTabs();
    } else {
      // every together step backs out to the intro (the session persists
      // server-side; the intro card is the way back in)
      setStep('intro');
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handleNavigateToLoveMap = () => {
    router.push('/lovemap');
  };

  // Rejoining a session someone already opened skips the heat check — the
  // capture moment already happened, on their phone.
  const handleStartTogether = () => {
    if (rfSession) {
      routedSessionRef.current = rfSession.id;
      routeToSession(rfSession);
    } else {
      setPendingPath('together');
      setStep('heatCheck');
    }
  };

  const continueAfterHeat = () => {
    setStep(pendingPath === 'together' ? 'togetherTopic' : 'mode');
  };

  const handleHeat = (level: HeatLevel, topic: string | null) => {
    setHeat(level);
    track(EVENTS.REFOCUS_HEAT, { heat: level, topic: topic ?? 'none' });
    setHeatTopic(topic);
    // Mediating a fight that is still burning doesn't calm it, it gives it a
    // transcript. Pause first; the path they chose is remembered.
    if (level === 'boiling') setStep('coolDown');
    else continueAfterHeat();
  };

  const handleMediationDone = (res: RefocusAiResult) => {
    track(EVENTS.REFOCUS_COMPLETED);
    if (res.type === 'mediation') {
      setMediation(res);
      setStep('togetherResult');
    } else {
      setSafety(res);
      setStep('togetherSafety');
    }
  };

  // ── RENDER ───────────────────────────────────────────────────────

  return (
    <LinearGradient
      colors={gradients.dawn.colors}
      locations={gradients.dawn.locations}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1, backgroundColor: colors.bg0 }}
    >
      <DawnBlobs />

      {step === 'intro' && (
        <IntroStep
          insets={insets}
          canTogether={!!couple && !!myId}
          openSession={rfSession}
          myId={myId}
          onStartTogether={handleStartTogether}
          onStartSolo={() => {
            setPendingPath('solo');
            setStep('heatCheck');
          }}
          onBack={handleBack}
        />
      )}

      {step === 'heatCheck' && (
        <HeatCheckStep
          insets={insets}
          onSelect={handleHeat}
          onBack={() => setStep('intro')}
        />
      )}

      {step === 'coolDown' && (
        <CoolDownStep
          insets={insets}
          onReady={continueAfterHeat}
          onLater={exitToTabs}
          onBack={() => setStep('heatCheck')}
        />
      )}

      {step === 'mode' && (
        <ModeStep
          insets={insets}
          onSelectMode={(m) => {
            setMode(m);
            setText('');
            setStep('share');
          }}
          onBack={() => setStep('intro')}
        />
      )}

      {step === 'share' && (
        <ShareStep
          insets={insets}
          mode={mode}
          text={text}
          setText={setText}
          onSubmit={() => {
            track(EVENTS.REFOCUS_STARTED, { mode: 'solo', heat: heat ?? 'unknown' });
            setStep('waiting');
          }}
          onBack={() => setStep('mode')}
        />
      )}

      {step === 'waiting' && (
        <WaitingStep
          userText={text}
          onCancel={handleBack}
          onDone={(res) => {
            track(EVENTS.REFOCUS_COMPLETED);
            setResult(res);
            setStep('result');
            // V2 F1: the reflection survives exit — one atomic DEFINER call,
            // author-only under RLS (0043). The on-screen result stands
            // either way; a failure gets one quiet, honest toast.
            setSoloSessionId(null);
            if (couple && authSession) {
              persistSoloRefocus(couple.id, text, res).then((id) => {
                if (id) {
                  setSoloSessionId(id);
                  track(EVENTS.REFOCUS_PERSISTED, { mode: 'solo' });
                } else {
                  showToast("couldn't save this one — it stays here for now");
                }
              });
            }
          }}
          onSafety={(s) => {
            setSafety(s);
            setStep('soloSafety');
          }}
          onError={() => setStep('error')}
        />
      )}

      {step === 'error' && (
        <ErrorStep
          onRetry={() => setStep('waiting')}
          onBack={() => setStep('share')}
        />
      )}

      {step === 'result' && result && (
        <ResultStep
          insets={insets}
          result={result}
          soloSessionId={soloSessionId}
          onBack={handleBack}
          onShowToast={showToast}
          onOpenLoveMap={handleNavigateToLoveMap}
        />
      )}

      {(step === 'soloSafety' || step === 'togetherSafety') && safety && (
        <SafetyStep safety={safety} onBack={handleBack} />
      )}

      {step === 'togetherTopic' && couple && (
        <TogetherTopicStep
          initialTopic={heatTopic ?? ''}
          onBack={() => setStep('intro')}
          onSubmit={async (topic, side) => {
            try {
              await startRefocus(couple.id, topic, side);
              track(EVENTS.REFOCUS_STARTED, { mode: 'together', heat: heat ?? 'unknown' });
              setPendingTopic(topic);
              setStep('togetherWaiting');
              await refreshSession();
            } catch (err) {
              const msg = err instanceof Error ? err.message : String(err);
              if (msg.includes(REFOCUS_ALREADY_OPEN)) {
                showToast('you two already have one open 💛');
                await refreshSession();
                setStep('intro');
              } else {
                showToast('Couldn\'t start it just now, try again in a moment.');
              }
            }
          }}
        />
      )}

      {step === 'togetherWaiting' && (
        <TogetherWaitingStep
          topic={rfSession?.topic ?? pendingTopic}
          onBack={handleBack}
        />
      )}

      {step === 'togetherAdd' && rfSession && (
        <TogetherAddStep
          session={rfSession}
          onBack={handleBack}
          onSubmit={async (side) => {
            try {
              await addRefocusSide(rfSession.id, side);
              setStep('togetherMediating');
            } catch {
              showToast('Couldn\'t add your side just now, try again in a moment.');
            }
          }}
        />
      )}

      {step === 'togetherMediating' && rfSession && (
        <TogetherMediatingStep
          sessionId={rfSession.id}
          onCancel={handleBack}
          onDone={handleMediationDone}
          onError={() => setStep('togetherError')}
        />
      )}

      {step === 'togetherError' && (
        <ErrorStep
          onRetry={() => setStep('togetherMediating')}
          onBack={() => setStep('intro')}
        />
      )}

      {step === 'togetherResult' && mediation && rfSession && (
        <TogetherResultStep
          insets={insets}
          mediation={mediation}
          session={rfSession}
          myId={myId}
          onBack={handleBack}
          onShowToast={showToast}
          onOpenLoveMap={handleNavigateToLoveMap}
        />
      )}

      {step === 'togetherExpired' && (
        <TogetherExpiredStep
          onStartFresh={() => setStep('togetherTopic')}
          onBack={() => setStep('intro')}
        />
      )}

      {toastMsg && <Toast msg={toastMsg} />}
    </LinearGradient>
  );
}
