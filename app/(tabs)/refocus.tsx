import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  Text,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { DawnBlobs } from '../../src/components/DawnBlobs';
import { Peek } from '../../src/components/Peek';
import Tok from '../../src/components/Tok';
import Press from '../../src/components/Press';
import { Icon, ICONS } from '../../src/components/Icon';
import Card from '../../src/components/Card';
import Btn from '../../src/components/Btn';
import { Kick, Serif } from '../../src/components/Text';
import TopBar from '../../src/components/TopBar';
import Toast from '../../src/components/Toast';
import { Float } from '../../src/components/Float';
import EscalationCard from '../../src/components/EscalationCard';
import {
  colors,
  gradients,
  radius,
  shadows,
  space,
} from '../../src/design/tokens';
import { fontFamily } from '../../src/design/typography';
import {
  PROMISES,
  MODES,
  RefocusResult,
  RefocusMode,
  RefocusMediation,
  RefocusSafety,
  RefocusAiResult,
  AI_DISCLOSURE,
  THERAPY_DISCLAIMER,
  SCREENING_UNAVAILABLE_NOTE,
} from '../../src/content/refocus';
import { useSession } from '../../src/features/auth/useSession';
import { useCouple } from '../../src/features/pairing/useCouple';
import { supabase } from '../../src/lib/supabase';
import { addLearning } from '../../src/features/lovemap/addLearning';
import { learningOrigin } from '../../src/domain/learningOrigin';
import { track, EVENTS } from '../../src/lib/analytics';
import { useIdentity } from '../../src/features/profile/useIdentity';
import { useRefocusSession } from '../../src/features/refocus/useRefocusSession';
import { useRefocusHistory } from '../../src/features/refocus/useRefocusHistory';
import {
  startRefocus,
  addRefocusSide,
  mediateSession,
  parseAiResult,
  persistSoloRefocus,
  markBridgeSent,
  REFOCUS_ALREADY_OPEN,
} from '../../src/features/refocus/refocusActions';
import { checkShouldShowEscalationCard } from '../../src/features/refocus/checkEscalation';
import type { RefocusSession } from '../../src/types/db';

// Identity definitions
const YOU = { name: 'you', initial: 'Y' };

type Step =
  // solo (unchanged flow, plus a safety routing outcome)
  | 'intro'
  | 'mode'
  | 'share'
  | 'waiting'
  | 'error'
  | 'result'
  | 'soloSafety'
  // two-sided session flow (4.6)
  | 'togetherTopic'
  | 'togetherWaiting'
  | 'togetherAdd'
  | 'togetherMediating'
  | 'togetherResult'
  | 'togetherSafety'
  | 'togetherError'
  | 'togetherExpired';

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
    } else if (step === 'mode') {
      setStep('intro');
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

  const handleStartTogether = () => {
    if (rfSession) {
      routedSessionRef.current = rfSession.id;
      routeToSession(rfSession);
    } else {
      setStep('togetherTopic');
    }
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
          onStartSolo={() => setStep('mode')}
          onBack={handleBack}
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
            track(EVENTS.REFOCUS_STARTED, { mode: 'solo' });
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
          onBack={() => setStep('intro')}
          onSubmit={async (topic, side) => {
            try {
              await startRefocus(couple.id, topic, side);
              track(EVENTS.REFOCUS_STARTED, { mode: 'together' });
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

// ── INTRO STEP ───────────────────────────────────────────────────

interface IntroStepProps {
  insets: ReturnType<typeof useSafeAreaInsets>;
  canTogether: boolean;
  openSession: RefocusSession | null;
  myId: string | null;
  onStartTogether: () => void;
  onStartSolo: () => void;
  onBack: () => void;
}

function IntroStep({
  insets,
  canTogether,
  openSession,
  myId,
  onStartTogether,
  onStartSolo,
  onBack,
}: IntroStepProps) {
  const { partner } = useIdentity();
  const invited =
    !!openSession &&
    openSession.state === 'waiting_partner' &&
    openSession.initiator !== myId;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <TopBar title="refocus" onBack={onBack} />
      <ScrollView
        scrollEnabled
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: space.gutter,
          paddingTop: 70,
          paddingBottom: canTogether ? 230 : 160,
        }}
      >
        {/* Hero: floating Peek */}
        <View
          style={{
            alignItems: 'center',
            marginBottom: 6,
          }}
        >
          <Float distance={7} duration={4000}>
            <Peek size={104} mood="focus" />
          </Float>
        </View>

        {/* Heading */}
        <View style={{ alignItems: 'center' }}>
          <Kick c={colors.p2Deep}>refocus</Kick>
          <Serif
            s={36}
            style={{
              marginTop: 10,
              marginBottom: 10,
              textAlign: 'center',
              lineHeight: 36 * 1.08,
            }}
          >
            Things feel a little{'\n'}out of focus?
          </Serif>
          <Text
            style={{
              fontSize: 15,
              lineHeight: 15 * 1.55,
              color: colors.inkSoft,
              textAlign: 'center',
              maxWidth: 300,
              fontFamily: fontFamily.ui,
            }}
          >
            A rough moment gets easier once you untangle it. Do it together,
            each of you adds your real side and we find the middle, or just
            untangle your side, privately.
          </Text>
        </View>

        {/* An open session: the way back in (or the partner's invite) */}
        {openSession && (
          <Press onPress={onStartTogether}>
            <Card
              style={{
                borderRadius: 22,
                paddingHorizontal: 18,
                paddingVertical: 16,
                marginTop: 22,
                backgroundColor: colors.usSoft,
                borderWidth: 1,
                borderColor: 'rgba(157,149,245,0.25)',
              }}
            >
              <Kick c={colors.p2Deep}>
                {invited ? 'your side is missing' : 'in progress'}
              </Kick>
              <Text
                style={{
                  fontSize: 14.5,
                  fontWeight: '700',
                  color: colors.ink,
                  marginTop: 6,
                  lineHeight: 14.5 * 1.4,
                  fontFamily: fontFamily.ui,
                }}
              >
                {invited
                  ? `${partner.name} wants to refocus: ${openSession.topic} — add your side`
                  : `"${openSession.topic}" — tap to check on it`}
              </Text>
            </Card>
          </Press>
        )}

        {/* Promises card */}
        <Card
          style={{
            borderRadius: 24,
            paddingHorizontal: 16,
            paddingVertical: 6,
            marginTop: 24,
          }}
        >
          {PROMISES.map((promise, i) => (
            <View
              key={i}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 13,
                paddingVertical: 14,
                borderTopWidth: i > 0 ? 1 : 0,
                borderTopColor: i > 0 ? colors.line : 'transparent',
              }}
            >
              {/* Icon badge */}
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 11,
                  backgroundColor: colors.usSoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon
                  d={ICONS[promise.iconId as keyof typeof ICONS]}
                  size={18}
                  color={colors.p2Deep}
                />
              </View>

              {/* Text */}
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 14.5,
                    fontWeight: '700',
                    color: colors.ink,
                    fontFamily: fontFamily.ui,
                  }}
                >
                  {promise.title}
                </Text>
                <Text
                  style={{
                    fontSize: 12.5,
                    color: colors.inkSoft,
                    marginTop: 2,
                    lineHeight: 12.5 * 1.4,
                    fontFamily: fontFamily.ui,
                  }}
                >
                  {promise.desc}
                </Text>
              </View>
            </View>
          ))}
        </Card>
      </ScrollView>

      {/* Sticky buttons */}
      <View
        style={{
          position: 'absolute',
          bottom: 22 + insets.bottom,
          left: space.gutter,
          right: space.gutter,
          zIndex: 40,
          gap: 10,
        }}
      >
        {canTogether && (
          <Btn
            kind="us"
            onPress={onStartTogether}
            sub="both real sides, one middle ground"
            testID="refocus-start-together"
          >
            Untangle it together
          </Btn>
        )}
        <Btn
          kind={canTogether ? 'soft' : 'us'}
          onPress={onStartSolo}
          sub="just your side, privately"
          testID="refocus-start"
        >
          Just my side
        </Btn>
      </View>
    </SafeAreaView>
  );
}

// ── MODE STEP ────────────────────────────────────────────────────

interface ModeStepProps {
  insets: ReturnType<typeof useSafeAreaInsets>;
  onSelectMode: (mode: RefocusMode) => void;
  onBack: () => void;
}

function ModeStep({ insets, onSelectMode, onBack }: ModeStepProps) {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <TopBar title="how to share" onBack={onBack} />
      <ScrollView
        scrollEnabled
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: space.gutter,
          paddingTop: 70,
          paddingBottom: 40,
        }}
      >
        <Serif s={32} style={{ marginBottom: 6, lineHeight: 32 * 1.08 }}>
          How do you want to get it out?
        </Serif>
        <Text
          style={{
            fontSize: 14.5,
            color: colors.inkSoft,
            marginBottom: 22,
            fontFamily: fontFamily.ui,
          }}
        >
          However it comes easiest. Only the AI reads this.
        </Text>

        <View style={{ gap: 12 }}>
          {MODES.map((m) => (
            <Press key={m.id} onPress={() => onSelectMode(m.id)}>
              <Card
                style={{
                  borderRadius: 22,
                  paddingHorizontal: 18,
                  paddingVertical: 18,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 15,
                }}
              >
                <Text style={{ fontSize: 30 }}>{m.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 16.5,
                      fontWeight: '700',
                      color: colors.ink,
                      fontFamily: fontFamily.ui,
                    }}
                  >
                    {m.label}
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      color: colors.inkSoft,
                      marginTop: 2,
                      fontFamily: fontFamily.ui,
                    }}
                  >
                    {m.desc}
                  </Text>
                </View>
                <Icon
                  d={ICONS.chevR}
                  size={18}
                  color={colors.inkMute}
                />
              </Card>
            </Press>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── SHARE STEP ───────────────────────────────────────────────────

interface ShareStepProps {
  insets: ReturnType<typeof useSafeAreaInsets>;
  mode: RefocusMode;
  text: string;
  setText: (text: string) => void;
  onSubmit: () => void;
  onBack: () => void;
}

function ShareStep({
  insets,
  mode,
  text,
  setText,
  onSubmit,
  onBack,
}: ShareStepProps) {
  const { partner } = useIdentity();

  const title = mode === 'paste' ? 'paste the convo' : 'your side';
  const ready = text.trim().length > 3;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <TopBar title={title} onBack={onBack} />

      <View style={{ flex: 1, paddingTop: 100, paddingBottom: 96 }}>
        {/* Privacy notice */}
        <View
          style={{
            marginHorizontal: space.gutter,
            marginBottom: 10,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingHorizontal: 13,
            paddingVertical: 10,
            borderRadius: 14,
            backgroundColor: colors.usSoft,
            borderWidth: 1,
            borderColor: 'rgba(157,149,245,0.22)',
          }}
        >
          <Icon d={ICONS.lock} size={15} color={colors.p2Deep} />
          <Text
            style={{
              fontSize: 12.5,
              color: colors.p2Deep,
              fontWeight: '600',
              flex: 1,
              lineHeight: 12.5 * 1.35,
              fontFamily: fontFamily.ui,
            }}
          >
            {`Private to the AI. Nothing is sent to ${partner.name}.`}
          </Text>
        </View>

        {/* Text input view */}
        <View
          style={{
            flex: 1,
            paddingHorizontal: space.gutter,
          }}
        >
          <TextInput
            value={text}
            onChangeText={setText}
            autoFocus={mode === 'text'}
            placeholder={
              mode === 'paste'
                ? 'Paste the messages here…'
                : 'What happened, from your side? Say it how you actually feel, messy is fine.'
            }
            placeholderTextColor={colors.inkSoft}
            multiline
            style={{
              flex: 1,
              width: '100%',
              borderWidth: 1,
              borderColor: colors.line,
              borderRadius: 18,
              backgroundColor: colors.surface,
              paddingVertical: 15,
              paddingHorizontal: 16,
              fontSize: 15.5,
              lineHeight: 15.5 * 1.55,
              fontFamily:
                mode === 'paste' ? fontFamily.mono : fontFamily.ui,
              color: colors.ink,
              ...shadows.shadowSoft,
            }}
          />
        </View>
      </View>

      {/* Sticky button */}
      <View
        style={{
          position: 'absolute',
          bottom: 22,
          left: space.gutter,
          right: space.gutter,
          zIndex: 40,
        }}
      >
        <Btn
          kind="us"
          onPress={onSubmit}
          disabled={!ready}
          sub="private, just for you"
        >
          Untangle it
        </Btn>
      </View>
    </SafeAreaView>
  );
}

// ── WAITING STEP (solo) ──────────────────────────────────────────

interface WaitingStepProps {
  userText: string;
  onCancel: () => void;
  onDone: (result: RefocusResult) => void;
  onSafety: (safety: RefocusSafety) => void;
  onError: () => void;
}

function WaitingStep({ userText, onCancel, onDone, onSafety, onError }: WaitingStepProps) {
  const { partner } = useIdentity();
  const [phase, setPhase] = useState(0); // 0 reading · 1 reflecting
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const t1 = setTimeout(() => setPhase(1), 1600);
    const min = new Promise((r) => setTimeout(r, 4200));

    // Live Claude reflection (edge fn) raced against a min display time.
    // A failure surfaces the honest error step — never a canned result.
    Promise.all([analyze(userText, partner.name), min]).then(([res]) => {
      // Guard: the user may navigate away during the ~4.2s wait.
      if (!mounted.current) return;
      if (res && 'safety' in res) onSafety(res.safety);
      else if (res) onDone(res.reflection);
      else onError();
    });

    return () => {
      mounted.current = false;
      clearTimeout(t1);
    };
  }, []);

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 34,
      }}
    >
      {/* Visible exit — the analysis wait must never trap the user. */}
      <TopBar title="finding focus" onBack={onCancel} />

      {/* Floating Peek with halo */}
      <View
        style={{
          width: 150,
          height: 120,
          marginBottom: 28,
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <Float distance={7} duration={3500}>
          <View
            style={{
              position: 'absolute',
              width: 120,
              height: 120,
              borderRadius: radius.pill,
              backgroundColor: colors.usSoft,
            }}
          />
        </Float>
        <Float distance={7} duration={4000}>
          <Peek size={128} mood={phase >= 1 ? 'focus' : 'search'} />
        </Float>
      </View>

      {/* Status text */}
      <Serif
        s={28}
        italic
        style={{
          textAlign: 'center',
          marginBottom: 24,
          maxWidth: 280,
          lineHeight: 28 * 1.09,
        }}
      >
        {phase < 1 ? 'reading your side…' : 'finding what’s underneath…'}
      </Serif>

      {/* Status item */}
      <View style={{ width: '100%', maxWidth: 280, gap: 12 }}>
        <SideInRow label="Your side is in" you />
      </View>

      {/* Loading dots */}
      <View style={{ marginTop: 22, flexDirection: 'row', gap: 6 }}>
        {[0, 1, 2].map((i) => (
          <PulseDot key={i} delay={i * 0.18} />
        ))}
      </View>
    </View>
  );
}

function SideInRow({ label, you = false, who }: { label: string; you?: boolean; who?: { name: string; initial: string } }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 11,
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 16,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.line,
        ...shadows.shadowSoft,
      }}
    >
      <Tok who={who ?? YOU} you={you} size={28} />
      <Text
        style={{
          flex: 1,
          fontSize: 14,
          fontWeight: '600',
          color: colors.ink,
          textAlign: 'left',
          fontFamily: fontFamily.ui,
        }}
      >
        {label}
      </Text>
      <Icon d={ICONS.check} size={16} color={colors.matchDeep} sw={2.6} />
    </View>
  );
}

function PulseDot({ delay }: { delay: number }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.2, {
        duration: 1000,
        easing: Easing.ease,
      }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          width: 8,
          height: 8,
          borderRadius: radius.pill,
          backgroundColor: colors.p2,
        },
        animatedStyle,
      ]}
    />
  );
}

// ── ERROR STEP ───────────────────────────────────────────────────

interface ErrorStepProps {
  onRetry: () => void;
  onBack: () => void;
}

function ErrorStep({ onRetry, onBack }: ErrorStepProps) {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <TopBar title="refocus" onBack={onBack} />
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 34,
        }}
      >
        <Float distance={7} duration={4000}>
          <Peek size={104} mood="search" />
        </Float>
        <Serif
          s={28}
          italic
          style={{
            textAlign: 'center',
            marginTop: 24,
            marginBottom: 12,
            maxWidth: 280,
            lineHeight: 28 * 1.09,
          }}
        >
          Still a little blurry.
        </Serif>
        <Text
          style={{
            fontSize: 14.5,
            lineHeight: 14.5 * 1.55,
            color: colors.inkSoft,
            textAlign: 'center',
            maxWidth: 290,
            fontFamily: fontFamily.ui,
            marginBottom: 28,
          }}
        >
          We couldn&apos;t reach the AI just now. Your words are safe right
          here, give it another go in a moment.
        </Text>
        <View style={{ width: '100%', maxWidth: 300, gap: 10 }}>
          <Btn kind="us" onPress={onRetry} testID="refocus-retry">
            Try again
          </Btn>
          <Btn kind="soft" onPress={onBack}>
            Back to my words
          </Btn>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ── SAFETY STEP (solo + together; renders server copy only) ──────

function SafetyStep({
  safety,
  onBack,
}: {
  safety: RefocusSafety;
  onBack: () => void;
}) {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <TopBar title="refocus" onBack={onBack} />
      <ScrollView
        scrollEnabled
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: space.gutter,
          paddingTop: 90,
          paddingBottom: 60,
        }}
      >
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <Float distance={7} duration={4000}>
            <Peek size={96} mood="focus" />
          </Float>
        </View>
        <Serif
          s={30}
          style={{
            textAlign: 'center',
            marginBottom: 14,
            lineHeight: 30 * 1.09,
          }}
        >
          {safety.title}
        </Serif>
        <Text
          style={{
            fontSize: 15,
            lineHeight: 15 * 1.55,
            color: colors.ink,
            textAlign: 'center',
            fontFamily: fontFamily.ui,
            marginBottom: 24,
          }}
        >
          {safety.message}
        </Text>

        <Card
          style={{
            borderRadius: 24,
            paddingHorizontal: 18,
            paddingVertical: 8,
          }}
        >
          {safety.helplines.map((h, i) => (
            <View
              key={i}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                paddingVertical: 13,
                borderTopWidth: i > 0 ? 1 : 0,
                borderTopColor: i > 0 ? colors.line : 'transparent',
              }}
            >
              <Text
                style={{
                  flex: 1,
                  fontSize: 13.5,
                  color: colors.ink,
                  fontWeight: '600',
                  lineHeight: 13.5 * 1.35,
                  fontFamily: fontFamily.ui,
                }}
              >
                {h.name}
              </Text>
              <Text
                style={{
                  fontSize: 14.5,
                  color: colors.p2Deep,
                  fontWeight: '700',
                  fontFamily: fontFamily.ui,
                }}
              >
                {h.contact}
              </Text>
            </View>
          ))}
        </Card>

        <Text
          style={{
            textAlign: 'center',
            fontSize: 11.5,
            color: colors.inkMute,
            marginTop: 24,
            lineHeight: 11.5 * 1.5,
            paddingHorizontal: 10,
            fontFamily: fontFamily.ui,
          }}
        >
          {AI_DISCLOSURE} {THERAPY_DISCLAIMER}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── TOGETHER: TOPIC + MY SIDE ────────────────────────────────────

function TogetherTopicStep({
  onBack,
  onSubmit,
}: {
  onBack: () => void;
  onSubmit: (topic: string, side: string) => Promise<void>;
}) {
  const { partner } = useIdentity();
  const [topic, setTopic] = useState('');
  const [side, setSide] = useState('');
  const [busy, setBusy] = useState(false);
  const ready = topic.trim().length > 1 && side.trim().length > 3 && !busy;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <TopBar title="untangle it together" onBack={onBack} />
      <View style={{ flex: 1, paddingTop: 100, paddingBottom: 96 }}>
        <View
          style={{
            marginHorizontal: space.gutter,
            marginBottom: 10,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingHorizontal: 13,
            paddingVertical: 10,
            borderRadius: 14,
            backgroundColor: colors.usSoft,
            borderWidth: 1,
            borderColor: 'rgba(157,149,245,0.22)',
          }}
        >
          <Icon d={ICONS.lock} size={15} color={colors.p2Deep} />
          <Text
            style={{
              fontSize: 12.5,
              color: colors.p2Deep,
              fontWeight: '600',
              flex: 1,
              lineHeight: 12.5 * 1.35,
              fontFamily: fontFamily.ui,
            }}
          >
            {`${partner.name} sees the topic and the middle ground, never your raw words.`}
          </Text>
        </View>

        <View style={{ flex: 1, paddingHorizontal: space.gutter, gap: 10 }}>
          <TextInput
            value={topic}
            onChangeText={setTopic}
            autoFocus
            placeholder="What's it about? (a few words)"
            placeholderTextColor={colors.inkSoft}
            maxLength={120}
            style={{
              width: '100%',
              borderWidth: 1,
              borderColor: colors.line,
              borderRadius: 18,
              backgroundColor: colors.surface,
              paddingVertical: 14,
              paddingHorizontal: 16,
              fontSize: 15.5,
              lineHeight: 15.5 * 1.4,
              fontFamily: fontFamily.ui,
              color: colors.ink,
              ...shadows.shadowSoft,
            }}
          />
          <TextInput
            value={side}
            onChangeText={setSide}
            placeholder="Your side of it, honestly. Messy is fine."
            placeholderTextColor={colors.inkSoft}
            multiline
            style={{
              flex: 1,
              width: '100%',
              borderWidth: 1,
              borderColor: colors.line,
              borderRadius: 18,
              backgroundColor: colors.surface,
              paddingVertical: 15,
              paddingHorizontal: 16,
              fontSize: 15.5,
              lineHeight: 15.5 * 1.55,
              fontFamily: fontFamily.ui,
              color: colors.ink,
              ...shadows.shadowSoft,
            }}
          />
        </View>
      </View>

      <View
        style={{
          position: 'absolute',
          bottom: 22,
          left: space.gutter,
          right: space.gutter,
          zIndex: 40,
        }}
      >
        <Btn
          kind="us"
          onPress={async () => {
            setBusy(true);
            try {
              await onSubmit(topic.trim(), side.trim());
            } finally {
              setBusy(false);
            }
          }}
          disabled={!ready}
          sub={`${partner.name} adds theirs, then we find the middle`}
          testID="refocus-together-submit"
        >
          Send it to the middle
        </Btn>
      </View>
    </SafeAreaView>
  );
}

// ── TOGETHER: WAITING FOR THE PARTNER ────────────────────────────

function TogetherWaitingStep({
  topic,
  onBack,
}: {
  topic: string;
  onBack: () => void;
}) {
  const { partner } = useIdentity();
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 34,
      }}
    >
      <TopBar title="untangling together" onBack={onBack} />

      <View
        style={{
          width: 150,
          height: 120,
          marginBottom: 28,
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <Float distance={7} duration={3500}>
          <View
            style={{
              position: 'absolute',
              width: 120,
              height: 120,
              borderRadius: radius.pill,
              backgroundColor: colors.usSoft,
            }}
          />
        </Float>
        <Float distance={7} duration={4000}>
          <Peek size={128} mood="search" />
        </Float>
      </View>

      <Serif
        s={28}
        italic
        style={{
          textAlign: 'center',
          marginBottom: 10,
          maxWidth: 290,
          lineHeight: 28 * 1.09,
        }}
      >
        {`waiting for ${partner.name}…`}
      </Serif>
      <Text
        style={{
          fontSize: 13.5,
          color: colors.inkSoft,
          textAlign: 'center',
          maxWidth: 290,
          lineHeight: 13.5 * 1.5,
          fontFamily: fontFamily.ui,
          marginBottom: 24,
        }}
      >
        {`We let them know about "${topic}". The moment their side is in, the middle ground appears here for both of you.`}
      </Text>

      <View style={{ width: '100%', maxWidth: 280, gap: 12 }}>
        <SideInRow label="Your side is in" you />
      </View>
    </View>
  );
}

// ── TOGETHER: THE PARTNER ADDS THEIR SIDE ────────────────────────

function TogetherAddStep({
  session,
  onBack,
  onSubmit,
}: {
  session: RefocusSession;
  onBack: () => void;
  onSubmit: (side: string) => Promise<void>;
}) {
  const { partner } = useIdentity();
  const [side, setSide] = useState('');
  const [busy, setBusy] = useState(false);
  const ready = side.trim().length > 3 && !busy;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <TopBar title="add your side" onBack={onBack} />
      <View style={{ flex: 1, paddingTop: 100, paddingBottom: 96 }}>
        <View
          style={{
            marginHorizontal: space.gutter,
            marginBottom: 10,
            paddingHorizontal: 13,
            paddingVertical: 12,
            borderRadius: 14,
            backgroundColor: colors.usSoft,
            borderWidth: 1,
            borderColor: 'rgba(157,149,245,0.22)',
          }}
        >
          <Text
            style={{
              fontSize: 13.5,
              color: colors.p2Deep,
              fontWeight: '700',
              lineHeight: 13.5 * 1.4,
              fontFamily: fontFamily.ui,
            }}
          >
            {`${partner.name} wants to refocus: ${session.topic}`}
          </Text>
          <Text
            style={{
              fontSize: 12.5,
              color: colors.p2Deep,
              marginTop: 3,
              lineHeight: 12.5 * 1.4,
              fontFamily: fontFamily.ui,
            }}
          >
            {`They can't read your raw words, only the middle ground you'll both see.`}
          </Text>
        </View>

        <View style={{ flex: 1, paddingHorizontal: space.gutter }}>
          <TextInput
            value={side}
            onChangeText={setSide}
            autoFocus
            placeholder="Your side of it, honestly. Messy is fine."
            placeholderTextColor={colors.inkSoft}
            multiline
            style={{
              flex: 1,
              width: '100%',
              borderWidth: 1,
              borderColor: colors.line,
              borderRadius: 18,
              backgroundColor: colors.surface,
              paddingVertical: 15,
              paddingHorizontal: 16,
              fontSize: 15.5,
              lineHeight: 15.5 * 1.55,
              fontFamily: fontFamily.ui,
              color: colors.ink,
              ...shadows.shadowSoft,
            }}
          />
        </View>
      </View>

      <View
        style={{
          position: 'absolute',
          bottom: 22,
          left: space.gutter,
          right: space.gutter,
          zIndex: 40,
        }}
      >
        <Btn
          kind="us"
          onPress={async () => {
            setBusy(true);
            try {
              await onSubmit(side.trim());
            } finally {
              setBusy(false);
            }
          }}
          disabled={!ready}
          sub="then we find the middle, together"
          testID="refocus-add-side"
        >
          Add my side
        </Btn>
      </View>
    </SafeAreaView>
  );
}

// ── TOGETHER: MEDIATING ──────────────────────────────────────────

function TogetherMediatingStep({
  sessionId,
  onCancel,
  onDone,
  onError,
}: {
  sessionId: string;
  onCancel: () => void;
  onDone: (result: RefocusAiResult) => void;
  onError: () => void;
}) {
  const { partner } = useIdentity();
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const min = new Promise((r) => setTimeout(r, 2500));

    // The server is idempotent: whichever partner calls first pays for the
    // mediation, everyone else gets the SAME stored result back.
    Promise.all([mediateSession(sessionId), min]).then(([res]) => {
      if (!mounted.current) return;
      if (res) onDone(res);
      else onError();
    });

    return () => {
      mounted.current = false;
    };
  }, [sessionId]);

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 34,
      }}
    >
      <TopBar title="finding the middle" onBack={onCancel} />

      <View
        style={{
          width: 150,
          height: 120,
          marginBottom: 28,
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <Float distance={7} duration={3500}>
          <View
            style={{
              position: 'absolute',
              width: 120,
              height: 120,
              borderRadius: radius.pill,
              backgroundColor: colors.usSoft,
            }}
          />
        </Float>
        <Float distance={7} duration={4000}>
          <Peek size={128} mood="focus" />
        </Float>
      </View>

      <Serif
        s={28}
        italic
        style={{
          textAlign: 'center',
          marginBottom: 24,
          maxWidth: 280,
          lineHeight: 28 * 1.09,
        }}
      >
        both sides are in…
      </Serif>

      <View style={{ width: '100%', maxWidth: 280, gap: 12 }}>
        <SideInRow label="Your side is in" you />
        <SideInRow
          label={`${partner.name}'s side is in`}
          who={{ name: partner.name, initial: partner.initial }}
        />
      </View>

      <View style={{ marginTop: 22, flexDirection: 'row', gap: 6 }}>
        {[0, 1, 2].map((i) => (
          <PulseDot key={i} delay={i * 0.18} />
        ))}
      </View>
    </View>
  );
}

// ── TOGETHER: EXPIRED ────────────────────────────────────────────

function TogetherExpiredStep({
  onStartFresh,
  onBack,
}: {
  onStartFresh: () => void;
  onBack: () => void;
}) {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <TopBar title="refocus" onBack={onBack} />
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 34,
        }}
      >
        <Float distance={7} duration={4000}>
          <Peek size={104} mood="search" />
        </Float>
        <Serif
          s={28}
          italic
          style={{
            textAlign: 'center',
            marginTop: 24,
            marginBottom: 12,
            maxWidth: 280,
            lineHeight: 28 * 1.09,
          }}
        >
          This one faded.
        </Serif>
        <Text
          style={{
            fontSize: 14.5,
            lineHeight: 14.5 * 1.55,
            color: colors.inkSoft,
            textAlign: 'center',
            maxWidth: 290,
            fontFamily: fontFamily.ui,
            marginBottom: 28,
          }}
        >
          The other side never came in, so this session quietly closed. If
          it still matters, start it fresh — or untangle your side solo.
        </Text>
        <View style={{ width: '100%', maxWidth: 300, gap: 10 }}>
          <Btn kind="us" onPress={onStartFresh} testID="refocus-start-fresh">
            Start it fresh
          </Btn>
          <Btn kind="soft" onPress={onBack}>
            Back
          </Btn>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ── TOGETHER: RESULT ─────────────────────────────────────────────

function TogetherResultStep({
  insets,
  mediation,
  session,
  myId,
  onBack,
  onShowToast,
  onOpenLoveMap,
}: {
  insets: ReturnType<typeof useSafeAreaInsets>;
  mediation: RefocusMediation;
  session: RefocusSession;
  myId: string | null;
  onBack: () => void;
  onShowToast: (msg: string) => void;
  onOpenLoveMap: () => void;
}) {
  const { partner } = useIdentity();
  const iAmInitiator = session.initiator === myId;
  const myUnderneath = iAmInitiator
    ? mediation.initiator_underneath
    : mediation.partner_underneath;
  const theirUnderneath = iAmInitiator
    ? mediation.partner_underneath
    : mediation.initiator_underneath;
  const myBridge = iAmInitiator
    ? mediation.initiator_bridge
    : mediation.partner_bridge;

  const [msg, setMsg] = useState(myBridge);
  const [copied, setCopied] = useState(false);
  const { couple } = useCouple();
  const { sessions: refocusHistory } = useRefocusHistory(couple?.id ?? null);

  const showEscalationCard =
    refocusHistory.length > 0 &&
    checkShouldShowEscalationCard(refocusHistory);

  const PAR = { name: partner.name, initial: partner.initial };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <TopBar title="the middle ground" onBack={onBack} />
      <ScrollView
        scrollEnabled
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: space.gutter,
          paddingTop: 70,
          paddingBottom: 40,
        }}
      >
        {/* Hero */}
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <Float distance={7} duration={4000}>
            <Peek size={84} mood="focus" />
          </Float>
          <Kick c={colors.matchDeep} style={{ marginTop: 8 }}>
            refocused, together
          </Kick>
          <Serif
            s={32}
            italic
            style={{
              marginTop: 8,
              marginBottom: 14,
              textAlign: 'center',
              maxWidth: 300,
              lineHeight: 32 * 1.09,
            }}
          >
            {`"${session.topic}"`}
          </Serif>
          <Text
            style={{
              fontSize: 13.5,
              color: colors.inkSoft,
              textAlign: 'center',
              maxWidth: 290,
              lineHeight: 13.5 * 1.5,
              fontFamily: fontFamily.ui,
            }}
          >
            {`You're both looking at the same middle ground. Raw words stayed private, on both sides.`}
          </Text>
        </View>

        {/* Shared ground */}
        <Card
          style={{
            borderRadius: 24,
            paddingHorizontal: 18,
            paddingVertical: 20,
            backgroundColor: colors.usSoft,
            borderWidth: 1,
            borderColor: 'rgba(157,149,245,0.25)',
          }}
        >
          <Kick c={colors.p2Deep}>what you share underneath</Kick>
          <Text
            style={{
              fontSize: 15.5,
              color: colors.ink,
              lineHeight: 15.5 * 1.55,
              marginTop: 8,
              fontFamily: fontFamily.disp,
              fontStyle: 'italic',
            }}
          >
            {mediation.shared_ground}
          </Text>
        </Card>

        {/* Each side's underneath */}
        <ResultSection icon="💗" label="what's really underneath">
          <View style={{ gap: 12 }}>
            <NeedCard who={YOU} youSide text={myUnderneath} />
            <NeedCard who={PAR} text={theirUnderneath} />
          </View>
        </ResultSection>

        {/* My bridge */}
        <Card
          style={{
            borderRadius: 24,
            paddingHorizontal: 16,
            paddingVertical: 18,
            marginTop: 16,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              marginBottom: 12,
            }}
          >
            <Tok who={YOU} you size={22} />
            <Text
              style={{
                flex: 1,
                fontSize: 14,
                fontWeight: '700',
                color: colors.ink,
                fontFamily: fontFamily.ui,
              }}
            >
              your bridge, if you want it
            </Text>
            <Text
              style={{
                fontFamily: fontFamily.mono,
                fontSize: 9.5,
                letterSpacing: 0.1 * 9.5,
                color: colors.inkMute,
              }}
            >
              AI DRAFT · YOURS TO EDIT
            </Text>
          </View>
          <TextInput
            value={msg}
            onChangeText={setMsg}
            multiline
            numberOfLines={3}
            placeholderTextColor={colors.inkSoft}
            style={{
              width: '100%',
              borderWidth: 1,
              borderColor: colors.line,
              borderRadius: 16,
              backgroundColor: colors.sunken,
              paddingVertical: 13,
              paddingHorizontal: 14,
              fontSize: 14.5,
              lineHeight: 14.5 * 1.5,
              fontFamily: fontFamily.ui,
              color: colors.ink,
            }}
          />
          <View style={{ marginTop: 12 }}>
            <Btn
              kind={copied ? 'soft' : 'us'}
              onPress={async () => {
                await Clipboard.setStringAsync(msg);
                setCopied(true);
                onShowToast('Copied, share it when you’re ready 🤍');
              }}
              sub={`${partner.name} got their own bridge too`}
            >
              {copied ? 'Copied 🤍' : 'Copy to share'}
            </Btn>
          </View>
        </Card>

        {/* Love map capture — each of you saves your own underneath */}
        <Card
          style={{
            borderRadius: 24,
            paddingHorizontal: 18,
            paddingVertical: 18,
            marginTop: 16,
            backgroundColor: colors.usSoft,
            borderWidth: 1,
            borderColor: 'rgba(157,149,245,0.25)',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              marginBottom: 10,
            }}
          >
            <Text style={{ fontSize: 17, color: colors.ink }}>🗺️</Text>
            <Text
              style={{
                fontFamily: fontFamily.mono,
                fontSize: 10.5,
                letterSpacing: 0.14 * 10.5,
                textTransform: 'uppercase',
                color: colors.p2Deep,
              }}
            >
              add it to your love map
            </Text>
          </View>
          <Text
            style={{
              fontSize: 14,
              color: colors.ink,
              lineHeight: 14 * 1.5,
              marginBottom: 14,
              fontFamily: fontFamily.ui,
            }}
          >
            Parallax will gently weave this into your next few drops, so next
            time, it&apos;s something you both just{' '}
            <Text style={{ fontStyle: 'italic' }}>know</Text>.
          </Text>
          <View style={{ gap: 10, marginBottom: 14 }}>
            <NeedCard who={YOU} youSide text={myUnderneath} />
          </View>
          <Btn
            kind="soft"
            onPress={async () => {
              if (myId && couple) {
                try {
                  await addLearning({
                    coupleId: couple.id,
                    aboutId: myId,
                    emoji: '🤍',
                    need: myUnderneath.split('\n')[0] || 'Underlying need',
                    detail: myUnderneath,
                    source: 'refocus',
                    // Stable per session + member (add_learning upserts on
                    // couple/about/origin) so re-taps never duplicate, and
                    // BOTH partners get their own entry.
                    origin: `refocus-session-${session.id}`,
                  });
                  onShowToast('Added to Love Map 🗺️');
                } catch {
                  onShowToast('Failed to save learnings');
                }
              }
              onOpenLoveMap();
            }}
            sub="see what you're learning"
          >
            Open your Love Map
          </Btn>
        </Card>

        {/* Escalation card: consider extra support (3+ in 30 days) */}
        {showEscalationCard && (
          <EscalationCard sessionCount={refocusHistory.length} />
        )}

        {/* Disclosure + disclaimer (+ the honest fail-open note) */}
        {mediation.screening_unavailable && (
          <Text
            style={{
              textAlign: 'center',
              fontSize: 11.5,
              color: colors.inkSoft,
              marginTop: 20,
              lineHeight: 11.5 * 1.5,
              paddingHorizontal: 10,
              fontFamily: fontFamily.ui,
            }}
          >
            {SCREENING_UNAVAILABLE_NOTE}
          </Text>
        )}
        <Text
          style={{
            textAlign: 'center',
            fontSize: 11.5,
            color: colors.inkMute,
            marginTop: mediation.screening_unavailable ? 10 : 20,
            lineHeight: 11.5 * 1.5,
            paddingHorizontal: 10,
            fontFamily: fontFamily.ui,
          }}
        >
          {AI_DISCLOSURE} {THERAPY_DISCLAIMER}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── RESULT STEP (solo) ───────────────────────────────────────────

interface ResultStepProps {
  insets: ReturnType<typeof useSafeAreaInsets>;
  result: RefocusResult;
  soloSessionId: string | null;
  onBack: () => void;
  onShowToast: (msg: string) => void;
  onOpenLoveMap: () => void;
}

function ResultStep({
  insets,
  result,
  soloSessionId,
  onBack,
  onShowToast,
  onOpenLoveMap,
}: ResultStepProps) {
  const { partner } = useIdentity();
  const [msg, setMsg] = useState(result.bridge);
  const [copied, setCopied] = useState(false);
  const [savingLearnings, setSavingLearnings] = useState(false);
  const { session } = useSession();
  const { couple } = useCouple();

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <TopBar title="back in focus" onBack={onBack} />
      <ScrollView
        scrollEnabled
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: space.gutter,
          paddingTop: 70,
          paddingBottom: 40,
        }}
      >
        {/* Hero */}
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <Float distance={7} duration={4000}>
            <Peek size={84} mood="focus" />
          </Float>
          <Kick c={colors.matchDeep} style={{ marginTop: 8 }}>
            refocused
          </Kick>
          <Serif
            s={32}
            italic
            style={{
              marginTop: 8,
              marginBottom: 14,
              textAlign: 'center',
              maxWidth: 300,
              lineHeight: 32 * 1.09,
            }}
          >
            Your side, in focus.
          </Serif>
          <Text
            style={{
              fontSize: 13.5,
              color: colors.inkSoft,
              textAlign: 'center',
              maxWidth: 290,
              lineHeight: 13.5 * 1.5,
              fontFamily: fontFamily.ui,
            }}
          >
            {`Nothing here was sent to ${partner.name}. What you share, and when, is up to you.`}
          </Text>
        </View>

        {/* What happened */}
        <ResultSection icon="🧭" label="what happened">
          <View style={{ gap: 9 }}>
            {result.happened.map((a, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: radius.pill,
                    backgroundColor: 'rgba(84,194,160,0.18)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon d={ICONS.check} size={11} color={colors.matchDeep} sw={2.6} />
                </View>
                <Text
                  style={{
                    fontSize: 14.5,
                    color: colors.ink,
                    fontWeight: '600',
                    lineHeight: 14.5 * 1.4,
                    flex: 1,
                    fontFamily: fontFamily.ui,
                  }}
                >
                  {a}
                </Text>
              </View>
            ))}
          </View>
        </ResultSection>

        {/* Other angles it might look from */}
        <ResultSection icon="👀" label="other angles it might look from">
          <Text
            style={{
              fontSize: 12.5,
              color: colors.inkSoft,
              marginBottom: 12,
              lineHeight: 12.5 * 1.4,
              fontFamily: fontFamily.ui,
            }}
          >
            {`Possibilities to sit with, not ${partner.name}'s actual words.`}
          </Text>
          <View style={{ gap: 12 }}>
            {result.angles.map((a, i) => (
              <PossibilityCard key={i} text={a} />
            ))}
          </View>
        </ResultSection>

        {/* What's really underneath */}
        <ResultSection icon="💗" label="what's really underneath">
          <NeedCard who={YOU} youSide text={result.underneath} />
        </ResultSection>

        {/* A way to raise it */}
        <Card
          style={{
            borderRadius: 24,
            paddingHorizontal: 18,
            paddingVertical: 20,
            marginTop: 16,
            backgroundColor: colors.usSoft,
            borderWidth: 1,
            borderColor: 'rgba(157,149,245,0.25)',
          }}
        >
          <Kick c={colors.p2Deep}>a way to raise it</Kick>
          <Text
            style={{
              fontSize: 15.5,
              color: colors.ink,
              lineHeight: 15.5 * 1.55,
              marginTop: 8,
              fontFamily: fontFamily.disp,
              fontStyle: 'italic',
            }}
          >
            {result.wayback}
          </Text>
        </Card>

        {/* Bridge message */}
        <Card
          style={{
            borderRadius: 24,
            paddingHorizontal: 16,
            paddingVertical: 18,
            marginTop: 16,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              marginBottom: 12,
            }}
          >
            <Tok who={YOU} you size={22} />
            <Text
              style={{
                flex: 1,
                fontSize: 14,
                fontWeight: '700',
                color: colors.ink,
                fontFamily: fontFamily.ui,
              }}
            >
              {`Want to say it to ${partner.name}?`}
            </Text>
            <Text
              style={{
                fontFamily: fontFamily.mono,
                fontSize: 9.5,
                letterSpacing: 0.1 * 9.5,
                color: colors.inkMute,
              }}
            >
              AI DRAFT · YOURS TO EDIT
            </Text>
          </View>
          <TextInput
            value={msg}
            onChangeText={setMsg}
            multiline
            numberOfLines={3}
            placeholderTextColor={colors.inkSoft}
            style={{
              width: '100%',
              borderWidth: 1,
              borderColor: colors.line,
              borderRadius: 16,
              backgroundColor: colors.sunken,
              paddingVertical: 13,
              paddingHorizontal: 14,
              fontSize: 14.5,
              lineHeight: 14.5 * 1.5,
              fontFamily: fontFamily.ui,
              color: colors.ink,
            }}
          />
          <View style={{ marginTop: 12 }}>
            <Btn
              kind={copied ? 'soft' : 'us'}
              onPress={async () => {
                await Clipboard.setStringAsync(msg);
                setCopied(true);
                onShowToast('Copied, share it when you’re ready 🤍');
                // V2 F2: the bridge is on its way — the repair check-in
                // becomes due 24h from now (fire-and-forget, idempotent).
                if (soloSessionId) markBridgeSent(soloSessionId);
              }}
              sub="paste it anywhere you two talk"
            >
              {copied ? 'Copied 🤍' : 'Copy to share'}
            </Btn>
          </View>
        </Card>

        {/* Love map capture */}
        <Card
          style={{
            borderRadius: 24,
            paddingHorizontal: 18,
            paddingVertical: 18,
            marginTop: 16,
            backgroundColor: colors.usSoft,
            borderWidth: 1,
            borderColor: 'rgba(157,149,245,0.25)',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              marginBottom: 10,
            }}
          >
            <Text style={{ fontSize: 17, color: colors.ink }}>🗺️</Text>
            <Text
              style={{
                fontFamily: fontFamily.mono,
                fontSize: 10.5,
                letterSpacing: 0.14 * 10.5,
                textTransform: 'uppercase',
                color: colors.p2Deep,
              }}
            >
              added to your love map
            </Text>
          </View>
          <Text
            style={{
              fontSize: 14,
              color: colors.ink,
              lineHeight: 14 * 1.5,
              marginBottom: 14,
              fontFamily: fontFamily.ui,
            }}
          >
            Parallax will gently weave this into your next few drops, so next
            time, it&apos;s something you both just{' '}
            <Text style={{ fontStyle: 'italic' }}>know</Text>.
          </Text>
          <View style={{ gap: 10, marginBottom: 14 }}>
            <NeedCard who={YOU} youSide text={result.underneath} />
          </View>
          <Btn
            kind="soft"
            onPress={async () => {
              if (session && couple) {
                try {
                  setSavingLearnings(true);

                  // Stable origin derived from this reflection's content, so
                  // re-tapping "Open your Love Map" upserts the same learning
                  // instead of creating duplicates each time.
                  const origin = 'refocus-' + learningOrigin(result.happened, result.wayback);

                  if (result.underneath) {
                    await addLearning({
                      coupleId: couple.id,
                      aboutId: session.user.id,
                      emoji: '🤍',
                      need: result.underneath.split('\n')[0] || 'Underlying need',
                      detail: result.underneath,
                      source: 'refocus',
                      origin,
                    });
                  }

                  onShowToast('Added to Love Map 🗺️');
                  setSavingLearnings(false);
                } catch (err) {
                  onShowToast('Failed to save learnings');
                  setSavingLearnings(false);
                }
              }
              onOpenLoveMap();
            }}
            sub="see what you're learning"
          >
            Open your Love Map
          </Btn>
        </Card>

        {/* Disclosure + disclaimer (+ the honest fail-open note) */}
        {result.screening_unavailable && (
          <Text
            style={{
              textAlign: 'center',
              fontSize: 11.5,
              color: colors.inkSoft,
              marginTop: 20,
              lineHeight: 11.5 * 1.5,
              paddingHorizontal: 10,
              fontFamily: fontFamily.ui,
            }}
          >
            {SCREENING_UNAVAILABLE_NOTE}
          </Text>
        )}
        <Text
          style={{
            textAlign: 'center',
            fontSize: 11.5,
            color: colors.inkMute,
            marginTop: result.screening_unavailable ? 10 : 20,
            lineHeight: 11.5 * 1.5,
            paddingHorizontal: 10,
            fontFamily: fontFamily.ui,
          }}
        >
          {AI_DISCLOSURE} {THERAPY_DISCLAIMER}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Result section components ────────────────────────────────────

function ResultSection({
  icon,
  label,
  children,
}: {
  icon: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Card
      style={{
        borderRadius: 24,
        paddingHorizontal: 18,
        paddingVertical: 18,
        marginTop: 16,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          marginBottom: 14,
        }}
      >
        <Text style={{ fontSize: 17, color: colors.ink }}>{icon}</Text>
        <Text
          style={{
            fontFamily: fontFamily.mono,
            fontSize: 10.5,
            letterSpacing: 0.14 * 10.5,
            textTransform: 'uppercase',
            color: colors.inkSoft,
          }}
        >
          {label}
        </Text>
      </View>
      {children}
    </Card>
  );
}

function PossibilityCard({ text }: { text: string }) {
  return (
    <View
      style={{
        paddingHorizontal: 14,
        paddingVertical: 13,
        borderRadius: 16,
        backgroundColor: 'rgba(157,149,245,0.09)',
        borderLeftWidth: 3,
        borderLeftColor: colors.p2,
      }}
    >
      <Kick c={colors.p2Deep} style={{ marginBottom: 4 }}>
        one possibility
      </Kick>
      <Text
        style={{
          fontSize: 14,
          color: colors.ink,
          lineHeight: 14 * 1.45,
          fontFamily: fontFamily.ui,
        }}
      >
        {text}
      </Text>
    </View>
  );
}

function NeedCard({
  who,
  youSide = false,
  text,
}: {
  who: { name: string; initial: string };
  youSide?: boolean;
  text: string;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
      <Tok who={who} you={youSide} size={26} />
      <Text
        style={{
          flex: 1,
          fontSize: 14,
          color: colors.ink,
          lineHeight: 14 * 1.4,
          fontFamily: fontFamily.ui,
        }}
      >
        {text}
      </Text>
    </View>
  );
}

// ── AI analysis (solo; real implementation: Supabase edge function) ────

type SoloOutcome =
  | { reflection: RefocusResult }
  | { safety: RefocusSafety };

async function analyze(
  userText: string,
  partnerName: string
): Promise<SoloOutcome | null> {
  // Live Claude reflection via the `refocus` Supabase edge function (key is
  // server-side). A failure or malformed shape returns null so the screen can
  // show an honest error state — never a canned result. A safety verdict
  // (crisis/abuse) routes to the helplines screen instead of a reflection.
  try {
    const { data, error } = await supabase.functions.invoke<
      RefocusResult & { safety?: RefocusSafety }
    >('refocus', { body: { userText, partnerName } });
    if (error || !data) return null;
    if (
      data.safety &&
      (data.safety.type === 'crisis' || data.safety.type === 'abuse') &&
      typeof data.safety.title === 'string' &&
      typeof data.safety.message === 'string' &&
      Array.isArray(data.safety.helplines)
    ) {
      return { safety: data.safety };
    }
    if (
      !Array.isArray(data.happened) ||
      !Array.isArray(data.angles) ||
      !data.underneath ||
      !data.wayback ||
      !data.bridge
    ) {
      return null;
    }
    return { reflection: data };
  } catch {
    return null;
  }
}
