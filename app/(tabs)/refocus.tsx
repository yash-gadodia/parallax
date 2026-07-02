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
} from '../../src/content/refocus';
import { useSession } from '../../src/features/auth/useSession';
import { useCouple } from '../../src/features/pairing/useCouple';
import { supabase } from '../../src/lib/supabase';
import { addLearning } from '../../src/features/lovemap/addLearning';
import { learningOrigin } from '../../src/domain/learningOrigin';
import { track, EVENTS } from '../../src/lib/analytics';
import { useIdentity } from '../../src/features/profile/useIdentity';

// Identity definitions
const YOU = { name: 'you', initial: 'Y' };

type Step = 'intro' | 'mode' | 'share' | 'waiting' | 'error' | 'result';

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
      // Cancel the analysis and return to the compose step (keeps their input).
      setStep('share');
    } else if (step === 'error') {
      setStep('share');
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
          onSubmit={() => setStep('waiting')}
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
            A rough moment gets easier once you untangle your side of it. Say
            what happened, just for you, and we&apos;ll help you see
            what&apos;s underneath and a kind way to raise it.
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
          Start, untangle my side
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

// ── WAITING STEP ─────────────────────────────────────────────────

interface WaitingStepProps {
  userText: string;
  onCancel: () => void;
  onDone: (result: RefocusResult) => void;
  onError: () => void;
}

function WaitingStep({ userText, onCancel, onDone, onError }: WaitingStepProps) {
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
      if (res) onDone(res);
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
          <Tok who={YOU} you size={28} />
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
            Your side is in
          </Text>
          <Icon d={ICONS.check} size={16} color={colors.matchDeep} sw={2.6} />
        </View>
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
          Refocus helps you talk it through, it isn&apos;t therapy. For the heavy
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

// ── AI analysis (real implementation: Supabase edge function) ────

async function analyze(
  userText: string,
  partnerName: string
): Promise<RefocusResult | null> {
  // Live Claude reflection via the `refocus` Supabase edge function (key is
  // server-side). A failure or malformed shape returns null so the screen can
  // show an honest error state — never a canned result.
  try {
    const { data, error } = await supabase.functions.invoke<RefocusResult>(
      'refocus',
      { body: { userText, partnerName } }
    );
    if (
      error ||
      !data ||
      !Array.isArray(data.happened) ||
      !Array.isArray(data.angles) ||
      !data.underneath ||
      !data.wayback ||
      !data.bridge
    ) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}
