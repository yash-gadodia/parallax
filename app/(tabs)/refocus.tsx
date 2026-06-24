import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets  } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
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
import {
  colors,
  gradients,
  radius,
  shadows,
  space,
} from '../../src/design/tokens';
import { fontFamily } from '../../src/design/typography';
import {
  EXEMPLAR,
  DANI_SIDE,
  VOICE_TRANSCRIPT,
  SAMPLE_LOG,
  PROMISES,
  MODES,
  RefocusResult,
  RefocusMode,
} from '../../src/content/refocus';
import { useSession } from '../../src/features/auth/useSession';
import { useCouple } from '../../src/features/pairing/useCouple';
import { supabase } from '../../src/lib/supabase';
import { addLearning } from '../../src/features/lovemap/addLearning';
import { learningOrigin } from '../../src/domain/learningOrigin';

// Identity definitions
const YOU = { name: 'you', initial: 'Y' };
const PAR = { name: 'Dani', initial: 'D' };

type Step = 'intro' | 'mode' | 'share' | 'waiting' | 'result';

export default function RefocusScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>('intro');
  const [mode, setMode] = useState<RefocusMode>('text');
  const [text, setText] = useState('');
  const [result, setResult] = useState<RefocusResult | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

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
      // Can't go back from waiting
    } else if (step === 'result') {
      exitToTabs();
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handleNavigateToLoveMap = () => {
    router.push('/lovemap');
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
          onStart={() => setStep('mode')}
          onBack={handleBack}
        />
      )}

      {step === 'mode' && (
        <ModeStep
          insets={insets}
          onSelectMode={(m) => {
            setMode(m);
            setText(m === 'paste' ? SAMPLE_LOG : m === 'voice' ? '' : '');
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
          onSubmit={() => setStep('waiting')}
          onBack={() => setStep('mode')}
        />
      )}

      {step === 'waiting' && (
        <WaitingStep
          userText={text || VOICE_TRANSCRIPT}
          daniText={DANI_SIDE}
          onDone={(res) => {
            setResult(res);
            setStep('result');
          }}
        />
      )}

      {step === 'result' && (
        <ResultStep
          insets={insets}
          result={result || EXEMPLAR}
          onBack={handleBack}
          onShowToast={showToast}
          onOpenLoveMap={handleNavigateToLoveMap}
        />
      )}

      {toastMsg && <Toast msg={toastMsg} />}
    </LinearGradient>
  );
}

// ── INTRO STEP ───────────────────────────────────────────────────

interface IntroStepProps {
  insets: ReturnType<typeof useSafeAreaInsets>;
  onStart: () => void;
  onBack: () => void;
}

function IntroStep({ insets, onStart, onBack }: IntroStepProps) {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <TopBar title="refocus" onBack={onBack} />
      <ScrollView
        scrollEnabled
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: space.gutter,
          paddingTop: 70,
          paddingBottom: 160,
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
            A rough moment is just the two of you seeing it from different
            angles. Share your side privately, Dani shares theirs, and we'll
            find where they meet.
          </Text>
        </View>

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

      {/* Sticky button */}
      <View
        style={{
          position: 'absolute',
          bottom: 22 + insets.bottom,
          left: space.gutter,
          right: space.gutter,
          zIndex: 40,
        }}
      >
        <Btn kind="us" onPress={onStart} sub="just your side, privately" testID="refocus-start">
          Start, share my side
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
  const [rec, setRec] = useState(false);
  const [secs, setSecs] = useState(0);

  useEffect(() => {
    if (!rec) return;
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [rec]);

  const stopRec = () => {
    setRec(false);
    setText(VOICE_TRANSCRIPT);
  };

  const title =
    mode === 'voice'
      ? 'your voice note'
      : mode === 'paste'
        ? 'paste the convo'
        : 'your side';
  const ready = (text && text.trim().length > 3) || mode === 'voice';

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
            Private to the AI. Dani only ever sees the resolution.
          </Text>
        </View>

        {mode === 'voice' && !text ? (
          /* Voice recorder view */
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 22,
              paddingHorizontal: 24,
            }}
          >
            {/* Timer */}
            <Text
              style={{
                fontSize: 30,
                fontWeight: '700',
                color: colors.ink,
                fontFamily: fontFamily.mono,
              }}
            >
              {String(Math.floor(secs / 60)).padStart(2, '0')}:
              {String(secs % 60).padStart(2, '0')}
            </Text>

            {/* Waveform */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                height: 50,
              }}
            >
              {Array.from({ length: 22 }).map((_, i) => (
                <WaveformBar
                  key={i}
                  index={i}
                  isRecording={rec}
                  secs={secs}
                />
              ))}
            </View>

            {/* Record button */}
            <Press
              onPress={() => (rec ? stopRec() : setRec(true))}
              scale={false}
              style={{ width: 'auto' }}
            >
              <View
                style={{
                  width: 76,
                  height: 76,
                  borderRadius: radius.pill,
                  backgroundColor: rec ? colors.p1Deep : colors.p2,
                  alignItems: 'center',
                  justifyContent: 'center',
                  ...shadows.shadow,
                }}
              >
                {rec ? (
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      backgroundColor: '#fff',
                    }}
                  />
                ) : (
                  <Icon
                    d="M10 3a3 3 0 013 3v4a3 3 0 01-6 0V6a3 3 0 013-3zM5 9.5a5 5 0 0110 0M10 14.5V17"
                    size={30}
                    color="#fff"
                    sw={1.6}
                  />
                )}
              </View>
            </Press>

            {/* Status text */}
            <Text
              style={{
                fontSize: 13.5,
                color: colors.inkSoft,
                fontFamily: fontFamily.ui,
              }}
            >
              {rec ? 'tap to stop' : 'tap to start talking'}
            </Text>
          </View>
        ) : (
          /* Text input view */
          <View
            style={{
              flex: 1,
              paddingHorizontal: space.gutter,
            }}
          >
            {mode === 'voice' && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 7,
                  marginBottom: 8,
                }}
              >
                <Icon d={ICONS.check} size={14} color={colors.matchDeep} sw={2.4} />
                <Text
                  style={{
                    fontFamily: fontFamily.mono,
                    fontSize: 11,
                    color: colors.matchDeep,
                    letterSpacing: 0.08 * 11,
                    textTransform: 'uppercase',
                  }}
                >
                  TRANSCRIBED · EDIT IF YOU LIKE
                </Text>
              </View>
            )}
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
        )}
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
          sub="then we wait for Dani"
        >
          Share my side
        </Btn>
      </View>
    </SafeAreaView>
  );
}

// ── Waveform bar animation helper ────────────────────────────────

function WaveformBar({
  index,
  isRecording,
  secs,
}: {
  index: number;
  isRecording: boolean;
  secs: number;
}) {
  const heightValue = useSharedValue(10);

  useEffect(() => {
    if (!isRecording) {
      heightValue.value = withTiming(10, { duration: 200 });
      return;
    }

    const baseHeight = 20 + Math.abs(Math.sin(index * 1.1 + secs)) * 30;
    heightValue.value = withTiming(baseHeight, { duration: 100 });
  }, [isRecording, secs, index]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: heightValue.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: 4,
          borderRadius: 3,
          backgroundColor: isRecording ? colors.p2 : colors.sunken,
        },
        animatedStyle,
      ]}
    />
  );
}

// ── WAITING STEP ─────────────────────────────────────────────────

interface WaitingStepProps {
  userText: string;
  daniText: string;
  onDone: (result: RefocusResult) => void;
}

function WaitingStep({ userText, daniText, onDone }: WaitingStepProps) {
  const [phase, setPhase] = useState(0); // 0 you in · 1 dani in · 2 analyzing
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const t1 = setTimeout(() => setPhase(1), 1400);
    const t2 = setTimeout(() => setPhase(2), 2700);
    const min = new Promise((r) => setTimeout(r, 4200));

    // Live Claude mediation (edge fn) raced against a min display time.
    Promise.all([analyze(userText, daniText), min]).then(([res]) => {
      // Guard: the user may navigate away during the ~4.2s wait.
      if (mounted.current) onDone(res);
    });

    return () => {
      mounted.current = false;
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const lines = [
    { color: colors.p1, who: YOU, label: 'You shared your side', active: phase >= 0 },
    { color: colors.p2, who: PAR, label: 'Dani shared their side', active: phase >= 1 },
  ];

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 34,
      }}
    >
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
          <Peek size={128} mood={phase >= 2 ? 'focus' : 'search'} />
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
        {phase < 1
          ? 'sharing your side…'
          : phase < 2
            ? "Dani's in too…"
            : 'finding where you meet…'}
      </Serif>

      {/* Status items */}
      <View style={{ width: '100%', maxWidth: 280, gap: 12 }}>
        {lines.map((l, i) => (
          <View
            key={i}
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
              opacity: l.active ? 1 : 0.4,
              ...shadows.shadowSoft,
            }}
          >
            <Tok who={l.who} you={l.who === YOU} size={28} />
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
              {l.label}
            </Text>
            {l.active ? (
              <Icon d={ICONS.check} size={16} color={colors.matchDeep} sw={2.6} />
            ) : (
              <View
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: radius.pill,
                  borderWidth: 2,
                  borderColor: colors.sunken,
                }}
              />
            )}
          </View>
        ))}
      </View>

      {/* Loading dots */}
      {phase >= 2 && (
        <View style={{ marginTop: 22, flexDirection: 'row', gap: 6 }}>
          {[0, 1, 2].map((i) => (
            <PulseDot key={i} delay={i * 0.18} />
          ))}
        </View>
      )}
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

// ── RESULT STEP ──────────────────────────────────────────────────

interface ResultStepProps {
  insets: ReturnType<typeof useSafeAreaInsets>;
  result: RefocusResult;
  onBack: () => void;
  onShowToast: (msg: string) => void;
  onOpenLoveMap: () => void;
}

function ResultStep({
  insets,
  result,
  onBack,
  onShowToast,
  onOpenLoveMap,
}: ResultStepProps) {
  const [msg, setMsg] = useState(result.bridge);
  const [sent, setSent] = useState(false);
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
            You're closer than it felt.
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
            Dani saw this too, the resolution, not your raw words.
          </Text>
        </View>

        {/* Where you both agree */}
        <ResultSection icon="🤝" label="where you both agree">
          <View style={{ gap: 9 }}>
            {result.agree.map((a, i) => (
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

        {/* How it looked from each angle */}
        <ResultSection icon="👀" label="how it looked from each angle">
          <View style={{ gap: 12 }}>
            <AngleCard
              who={YOU}
              youSide
              label="your angle"
              text={result.angles.you}
            />
            <AngleCard
              who={PAR}
              label="Dani's angle"
              text={result.angles.dani}
            />
          </View>
        </ResultSection>

        {/* What's really underneath */}
        <ResultSection icon="💗" label="what's really underneath">
          <View style={{ gap: 10 }}>
            <NeedCard who={YOU} youSide text={result.underneath.you} />
            <NeedCard who={PAR} text={result.underneath.dani} />
          </View>
        </ResultSection>

        {/* A way back */}
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
          <Kick c={colors.p2Deep}>a way back</Kick>
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
              Say it to Dani?
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
              kind={sent ? 'soft' : 'us'}
              onPress={() => {
                if (!sent) {
                  setSent(true);
                  onShowToast('Sent to Dani 🤍');
                }
              }}
            >
              {sent ? 'Sent 🤍' : 'Send to Dani'}
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
            Parallax will gently weave these into your next few drops, so next
            time, it&apos;s something you both just{' '}
            <Text style={{ fontStyle: 'italic' }}>know</Text>.
          </Text>
          <View style={{ gap: 10, marginBottom: 14 }}>
            <NeedCard who={YOU} youSide text={result.underneath.you} />
            <NeedCard who={PAR} text={result.underneath.dani} />
          </View>
          <Btn
            kind="soft"
            onPress={async () => {
              if (session && couple) {
                try {
                  setSavingLearnings(true);
                  const partner = couple.member_a === session.user.id
                    ? couple.member_b
                    : couple.member_a;

                  // Stable origin derived from this resolution's content, so
                  // re-tapping "Open your Love Map" upserts the same two learnings
                  // instead of creating duplicates each time.
                  const origin = 'refocus-' + learningOrigin(result.agree, result.wayback);

                  // Add learning for "you" (about your needs)
                  if (result.underneath.you) {
                    await addLearning({
                      coupleId: couple.id,
                      aboutId: session.user.id,
                      emoji: '🤍',
                      need: result.underneath.you.split('\n')[0] || 'Underlying need',
                      detail: result.underneath.you,
                      source: 'refocus',
                      origin,
                    });
                  }

                  // Add learning for partner
                  if (result.underneath.dani && partner) {
                    await addLearning({
                      coupleId: couple.id,
                      aboutId: partner,
                      emoji: '💗',
                      need: result.underneath.dani.split('\n')[0] || 'Underlying need',
                      detail: result.underneath.dani,
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

        {/* Disclaimer */}
        <Text
          style={{
            textAlign: 'center',
            fontSize: 11.5,
            color: colors.inkMute,
            marginTop: 20,
            lineHeight: 11.5 * 1.5,
            paddingHorizontal: 10,
            fontFamily: fontFamily.ui,
          }}
        >
          Refocus helps you talk it through, it isn't therapy. For the heavy
          stuff, please reach for a real pro. 🤍
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

function AngleCard({
  who,
  youSide = false,
  label,
  text,
}: {
  who: typeof YOU | typeof PAR;
  youSide?: boolean;
  label: string;
  text: string;
}) {
  const bgColor = youSide ? 'rgba(255,142,122,0.08)' : 'rgba(157,149,245,0.09)';
  const borderColor = youSide ? colors.p1 : colors.p2;
  const textColor = youSide ? colors.p1Deep : colors.p2Deep;

  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 11,
        paddingHorizontal: 14,
        paddingVertical: 13,
        borderRadius: 16,
        backgroundColor: bgColor,
        borderLeftWidth: 3,
        borderLeftColor: borderColor,
      }}
    >
      <Tok who={who} you={youSide} size={26} />
      <View style={{ flex: 1 }}>
        <Kick c={textColor} style={{ marginBottom: 4 }}>
          {label}
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
    </View>
  );
}

function NeedCard({
  who,
  youSide = false,
  text,
}: {
  who: typeof YOU | typeof PAR;
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

// ── AI analysis (GATE: real implementation uses Supabase edge function) ────

async function analyze(
  userText: string,
  daniText: string
): Promise<RefocusResult> {
  // Live Claude mediation via the `refocus` Supabase edge function (key is
  // server-side). Falls back to the scripted EXEMPLAR if the function isn't
  // configured/reachable or returns an unexpected shape, so the flow never breaks.
  try {
    const { data, error } = await supabase.functions.invoke<RefocusResult>(
      'refocus',
      { body: { userText, daniText, partnerName: 'Dani' } }
    );
    if (
      error ||
      !data ||
      !Array.isArray(data.agree) ||
      !data.angles?.you ||
      !data.angles?.dani ||
      !data.underneath?.you ||
      !data.underneath?.dani ||
      !data.wayback ||
      !data.bridge
    ) {
      return EXEMPLAR;
    }
    return data;
  } catch {
    return EXEMPLAR;
  }
}
