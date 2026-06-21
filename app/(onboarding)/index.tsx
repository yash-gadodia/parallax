import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Share,
  StyleSheet,
  SafeAreaView,
  Pressable,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView as SafeAreaViewContext } from 'react-native-safe-area-context';
import { colors, gradients, radius, shadows, space } from '../../src/design/tokens';
import { fontFamily } from '../../src/design/typography';
import { Peek } from '../../src/components/Peek';
import { Wordmark } from '../../src/components/Wordmark';
import { Serif, Kick } from '../../src/components/Text';
import Btn from '../../src/components/Btn';
import Press from '../../src/components/Press';
import Tok from '../../src/components/Tok';
import { DawnBlobs } from '../../src/components/DawnBlobs';
import { Float } from '../../src/components/Float';
import { Icon, ICONS } from '../../src/components/Icon';
import { INTENTS, MOMENTS } from '../../src/features/onboarding/constants';
import { useUiStore } from '../../src/store/ui';
import { useSession } from '../../src/features/auth/useSession';
import { useCouple } from '../../src/features/pairing/useCouple';
import { createCouple, joinCouple } from '../../src/features/pairing/pairingActions';
import { supabase } from '../../src/lib/supabase';

const TAGLINE = 'mind the parallax error';

interface User {
  initial: string;
}

const YOU: User = { initial: 'Y' };
const PAR: User = { initial: 'D' };

// Progress dots component
function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <View style={styles.dotsContainer}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            {
              width: i === current ? 20 : 6,
              backgroundColor: i === current ? colors.p2Deep : colors.sunken,
            },
          ]}
        />
      ))}
    </View>
  );
}

// Step 0: Welcome
function Step0Welcome({ onNext }: { onNext: () => void }) {
  const router = useRouter();

  const handleExistingAccount = () => {
    router.push('/login');
  };

  return (
    <SafeAreaViewContext style={styles.screenContainer}>
      <View style={styles.screenContent}>
        <View style={styles.welcomeCenter}>
          <Float style={styles.peekContainer}>
            <Peek size={132} mood="love" />
          </Float>
          <View style={{ marginTop: 24 }}>
            <Wordmark size={64} />
          </View>
          <Serif
            s={24}
            italic
            c={colors.inkSoft}
            style={{ marginTop: 8, letterSpacing: 0 }}
          >
            {TAGLINE}
          </Serif>
          <Text
            allowFontScaling={false}
            style={{
              fontSize: 15.5,
              color: colors.inkSoft,
              lineHeight: 24,
              marginTop: 20,
              maxWidth: 302,
              textAlign: 'center',
              fontFamily: fontFamily.ui,
            }}
          >
            A little daily ritual to know each other better, and{' '}
            <Text style={{ fontWeight: '700', color: colors.p1Deep }}>
              Refocus
            </Text>{' '}
            for the rough patches.
          </Text>
        </View>
        <View style={styles.buttonGroup}>
          <Btn kind="us" onPress={onNext} sub="takes a minute">
            Get started
          </Btn>
          <Press scale={false} onPress={handleExistingAccount}>
            <Text
              allowFontScaling={false}
              style={{
                textAlign: 'center',
                padding: 8,
                fontSize: 14,
                fontWeight: '600',
                color: colors.inkMute,
                fontFamily: fontFamily.ui,
              }}
            >
              I already have an account
            </Text>
          </Press>
        </View>
      </View>
    </SafeAreaViewContext>
  );
}

// Step 1: How it works
function Step1HowItWorks({ onNext }: { onNext: () => void }) {
  const rows = [
    {
      color: colors.p1,
      who: YOU,
      showPeek: false,
      title: 'Answer honestly',
      subtitle:
        "Pick what's true for you, your real Friday night, your worst habit.",
    },
    {
      color: colors.p2,
      who: PAR,
      showPeek: false,
      title: 'Call their answer',
      subtitle:
        'Then place a hunch on what your person will say. This is the game.',
    },
    {
      color: colors.p2,
      who: null,
      showPeek: true,
      title: 'Come into focus',
      subtitle:
        "When you've both played, see where your views line up, and where the cute little gaps are.",
    },
  ];

  return (
    <SafeAreaViewContext style={styles.screenContainer}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Kick>how it works</Kick>
        <Serif s={38} style={{ marginTop: 10, marginBottom: 28 }}>
          Three taps, then the good part.
        </Serif>

        <View style={styles.stepsContainer}>
          {rows.map((row, i) => (
            <View key={i} style={styles.stepRow}>
              <View
                style={[
                  styles.stepAvatar,
                  {
                    backgroundColor: row.showPeek ? 'transparent' : row.color,
                  },
                ]}
              >
                {row.showPeek ? (
                  <Peek size={52} mood="focus" />
                ) : (
                  <Text
                    allowFontScaling={false}
                    style={{
                      fontSize: 24,
                      fontFamily: fontFamily.disp,
                      color: '#fff',
                      fontWeight: '400',
                    }}
                  >
                    {row.who?.initial}
                  </Text>
                )}
              </View>
              <View style={{ paddingTop: 4 }}>
                <Text
                  allowFontScaling={false}
                  style={{
                    fontSize: 18,
                    fontWeight: '700',
                    color: colors.ink,
                    fontFamily: fontFamily.ui,
                  }}
                >
                  {row.title}
                </Text>
                <Text
                  allowFontScaling={false}
                  style={{
                    fontSize: 14.5,
                    color: colors.inkSoft,
                    lineHeight: 22,
                    marginTop: 4,
                    fontFamily: fontFamily.ui,
                  }}
                >
                  {row.subtitle}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ flex: 1 }} />
      </ScrollView>

      <View style={styles.buttonArea}>
        <ProgressDots current={0} total={4} />
        <Btn kind="ink" onPress={onNext}>
          Makes sense →
        </Btn>
      </View>
    </SafeAreaViewContext>
  );
}

// Step 2: Intent capture
function Step2Intent({
  onNext,
  fireToast,
}: {
  onNext: () => void;
  fireToast: (msg: string) => void;
}) {
  const [selected, setSelected] = useState<string[]>(['know']);
  const [loading, setLoading] = useState(false);

  const toggleIntent = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleContinue = async () => {
    if (!selected.length) return;

    setLoading(true);
    // Persist intents best-effort — never block advancing the flow on auth/network.
    try {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id;
      if (uid) {
        // @ts-expect-error supabase-js typed update arg resolves to never for this table
        await supabase.from('profiles').update({ intents: selected }).eq('id', uid);
      }
    } catch {
      // ignore — intents are saved if/when signed in
    } finally {
      setLoading(false);
      onNext();
    }
  };

  return (
    <SafeAreaViewContext style={styles.screenContainer}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Kick>what brings you here</Kick>
        <Serif s={38} style={{ marginTop: 10, marginBottom: 6 }}>
          What do you two want?
        </Serif>
        <Text
          allowFontScaling={false}
          style={{
            fontSize: 14.5,
            color: colors.inkSoft,
            lineHeight: 22,
            marginBottom: 22,
            fontFamily: fontFamily.ui,
          }}
        >
          Pick what matters most. We'll tune your drops to it, change it anytime.
        </Text>

        <View style={styles.chipsContainer}>
          {INTENTS.map(([id, emoji, label]) => {
            const isSelected = selected.includes(id);
            return (
              <Press key={id} onPress={() => toggleIntent(id)}>
                <View
                  style={[
                    styles.chipBase,
                    {
                      backgroundColor: isSelected ? 'rgba(255,142,122,0.16)' : colors.surface,
                      borderColor: isSelected ? colors.p2 : colors.line,
                    },
                    isSelected && shadows.shadow,
                  ]}
                >
                  <Text
                    allowFontScaling={false}
                    style={{ fontSize: 24 }}
                  >
                    {emoji}
                  </Text>
                  <Text
                    allowFontScaling={false}
                    style={{
                      flex: 1,
                      textAlign: 'left',
                      fontSize: 15.5,
                      fontWeight: '600',
                      color: colors.ink,
                      fontFamily: fontFamily.ui,
                    }}
                  >
                    {label}
                  </Text>
                  <View
                    style={[
                      styles.checkbox,
                      {
                        borderColor: isSelected ? colors.p2Deep : colors.inkMute,
                        backgroundColor: isSelected
                          ? colors.p2Deep
                          : 'transparent',
                      },
                    ]}
                  >
                    {isSelected && (
                      <Text
                        allowFontScaling={false}
                        style={{ fontSize: 12, color: '#fff' }}
                      >
                        ✓
                      </Text>
                    )}
                  </View>
                </View>
              </Press>
            );
          })}
        </View>

        <View style={{ flex: 1 }} />
      </ScrollView>

      <View style={styles.buttonArea}>
        <ProgressDots current={1} total={4} />
        <Btn
          kind="us"
          onPress={handleContinue}
          disabled={!selected.length || loading}
          sub={
            selected.length
              ? `${selected.length} selected`
              : 'pick at least one'
          }
        >
          Continue
        </Btn>
      </View>
    </SafeAreaViewContext>
  );
}

// Step 3: Pair up (create couple & show invite code)
function Step3PairUp({
  onNext,
  fireToast,
}: {
  onNext: () => void;
  fireToast: (msg: string) => void;
}) {
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [creatingCouple, setCreatingCouple] = useState(true);

  useEffect(() => {
    const init = async () => {
      setCreatingCouple(true);
      try {
        const couple = await createCouple();
        setInviteCode(couple.invite_code || 'YASH-4827');
      } catch {
        // not signed in yet (or offline) — show a demo code so the flow is smooth
        setInviteCode('YASH-4827');
      } finally {
        setCreatingCouple(false);
      }
    };
    init();
  }, [fireToast]);

  const handleShare = async () => {
    if (!inviteCode) return;
    try {
      await Share.share({
        message: `Join me on Parallax! Here's your invite code: ${inviteCode}`,
      });
      onNext();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Share failed';
      fireToast(msg);
    }
  };

  const handleJoinCouple = async () => {
    if (!joinCode.trim()) {
      fireToast('Enter a code');
      return;
    }
    setLoading(true);
    try {
      await joinCouple(joinCode);
      onNext();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Invalid code';
      fireToast(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaViewContext style={styles.screenContainer}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Kick>pair up</Kick>
        <Serif s={38} style={{ marginTop: 10, marginBottom: 8 }}>
          It takes two.
        </Serif>
        <Text
          allowFontScaling={false}
          style={{
            fontSize: 15,
            color: colors.inkSoft,
            lineHeight: 22,
            marginBottom: 26,
            fontFamily: fontFamily.ui,
          }}
        >
          Send Dani your invite link. Parallax only works once you're both in.
        </Text>

        {!showJoinInput ? (
          <>
            <View
              style={[
                styles.inviteCard,
                {
                  backgroundColor: 'rgba(157,149,245,0.16)',
                  borderColor: 'rgba(157,149,245,0.25)',
                },
              ]}
            >
              <Kick c={colors.p2Deep}>your invite code</Kick>
              <Text
                allowFontScaling={false}
                style={{
                  fontFamily: fontFamily.mono,
                  fontSize: 30,
                  fontWeight: '700',
                  letterSpacing: 2.1,
                  color: colors.ink,
                  marginTop: 12,
                  marginBottom: 6,
                }}
              >
                {creatingCouple ? 'Loading...' : inviteCode || 'ERROR'}
              </Text>
              <Text
                allowFontScaling={false}
                style={{
                  fontSize: 13,
                  color: colors.inkSoft,
                  fontFamily: fontFamily.ui,
                }}
              >
                they tap your link, you're paired instantly
              </Text>
            </View>

            <View style={{ flex: 1 }} />
          </>
        ) : (
          <>
            <TextInput
              style={styles.textInput}
              placeholder="Enter invite code"
              placeholderTextColor={colors.inkMute}
              value={joinCode}
              onChangeText={setJoinCode}
              autoCapitalize="characters"
              editable={!loading}
            />
            <View style={{ flex: 1 }} />
          </>
        )}
      </ScrollView>

      <View style={styles.buttonArea}>
        <ProgressDots current={2} total={4} />
        {!showJoinInput ? (
          <>
            <Btn
              kind="us"
              onPress={handleShare}
              disabled={!inviteCode || creatingCouple}
              sub="opens messages"
            >
              Send Dani the link
            </Btn>
            <Press onPress={() => setShowJoinInput(true)} scale={false}>
              <Text
                allowFontScaling={false}
                style={{
                  textAlign: 'center',
                  padding: 8,
                  fontSize: 14,
                  fontWeight: '600',
                  color: colors.inkMute,
                  fontFamily: fontFamily.ui,
                }}
              >
                Enter a code instead
              </Text>
            </Press>
          </>
        ) : (
          <>
            <Btn
              kind="us"
              onPress={handleJoinCouple}
              disabled={!joinCode.trim() || loading}
            >
              {loading ? 'Joining...' : 'Join'}
            </Btn>
            <Press onPress={() => setShowJoinInput(false)} scale={false}>
              <Text
                allowFontScaling={false}
                style={{
                  textAlign: 'center',
                  padding: 8,
                  fontSize: 14,
                  fontWeight: '600',
                  color: colors.inkMute,
                  fontFamily: fontFamily.ui,
                }}
              >
                Share code instead
              </Text>
            </Press>
          </>
        )}
      </View>
    </SafeAreaViewContext>
  );
}

// Step 4: Joined celebration
function Step4Joined({ onNext }: { onNext: () => void }) {
  return (
    <SafeAreaViewContext style={styles.screenContainer}>
      <View style={[styles.screenContent, styles.centeredContent]}>
        <View style={styles.avatarOverlap}>
          <Tok who={YOU} you size={70} ring />
          <View style={{ marginLeft: -22 }}>
            <Tok who={PAR} size={70} ring />
          </View>
        </View>

        <Text allowFontScaling={false} style={{ fontSize: 30, marginBottom: 4 }}>
          🎉
        </Text>
        <Serif s={42} italic>
          Dani joined!
        </Serif>
        <Text
          allowFontScaling={false}
          style={{
            fontSize: 15.5,
            color: colors.inkSoft,
            lineHeight: 24,
            marginTop: 18,
            maxWidth: 280,
            textAlign: 'center',
            fontFamily: fontFamily.ui,
          }}
        >
          You're officially a pair. One last thing, then your first drop.
        </Text>

        <View style={{ marginTop: 30, width: '100%' }}>
          <Btn kind="us" onPress={onNext}>
            Almost there →
          </Btn>
        </View>
      </View>
    </SafeAreaViewContext>
  );
}

// Step 5: Notification time
function Step5NotifyTime({
  onFinish,
  fireToast,
}: {
  onFinish: () => void;
  fireToast: (msg: string) => void;
}) {
  const [selected, setSelected] = useState<string>('evening');
  const [loading, setLoading] = useState(false);

  const handleFinish = async () => {
    setLoading(true);
    // Persist best-effort — never block finishing onboarding on auth/network.
    try {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id;
      if (uid) {
        const moment = MOMENTS.find((m) => m[0] === selected);
        const time = moment?.[3]; // 'HH:MM'
        // @ts-expect-error supabase-js typed update arg resolves to never for this table
        await supabase.from('profiles').update({ notify_time: time }).eq('id', uid);
      }
    } catch {
      // ignore — saved if/when signed in
    } finally {
      setLoading(false);
      onFinish();
    }
  };

  return (
    <SafeAreaViewContext style={styles.screenContainer}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Kick>your daily moment</Kick>
        <Serif s={38} style={{ marginTop: 10, marginBottom: 6 }}>
          When's your moment?
        </Serif>
        <Text
          allowFontScaling={false}
          style={{
            fontSize: 14.5,
            color: colors.inkSoft,
            lineHeight: 22,
            marginBottom: 22,
            fontFamily: fontFamily.ui,
          }}
        >
          We'll nudge you both once a day, when you've got a quiet minute.
          Couples who pick a time stick with it.
        </Text>

        <View style={styles.chipsContainer}>
          {MOMENTS.map(([id, emoji, label, time]) => {
            const isSelected = selected === id;
            return (
              <Press key={id} onPress={() => setSelected(id)}>
                <View
                  style={[
                    styles.chipBase,
                    {
                      backgroundColor: isSelected ? 'rgba(255,142,122,0.16)' : colors.surface,
                      borderColor: isSelected ? colors.p2 : colors.line,
                    },
                    isSelected && shadows.shadow,
                  ]}
                >
                  <Text
                    allowFontScaling={false}
                    style={{ fontSize: 24 }}
                  >
                    {emoji}
                  </Text>
                  <Text
                    allowFontScaling={false}
                    style={{
                      flex: 1,
                      textAlign: 'left',
                      fontSize: 15.5,
                      fontWeight: '600',
                      color: colors.ink,
                      fontFamily: fontFamily.ui,
                    }}
                  >
                    {label}
                  </Text>
                  <Text
                    allowFontScaling={false}
                    style={{
                      fontFamily: fontFamily.mono,
                      fontSize: 12,
                      fontWeight: '700',
                      color: isSelected ? colors.p2Deep : colors.inkMute,
                    }}
                  >
                    {time}
                  </Text>
                </View>
              </Press>
            );
          })}
        </View>

        <View style={{ flex: 1 }} />
      </ScrollView>

      <View style={styles.buttonArea}>
        <ProgressDots current={3} total={4} />
        <Btn
          kind="us"
          onPress={handleFinish}
          disabled={loading}
          sub="drop 27 is live"
        >
          Turn on daily nudge
        </Btn>
        <Press onPress={onFinish} scale={false}>
          <Text
            allowFontScaling={false}
            style={{
              textAlign: 'center',
              padding: 8,
              fontSize: 14,
              fontWeight: '600',
              color: colors.inkMute,
              fontFamily: fontFamily.ui,
            }}
          >
            Not now
          </Text>
        </Press>
      </View>
    </SafeAreaViewContext>
  );
}

// Main component
export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const router = useRouter();
  const { fireToast } = useUiStore();

  const handleFinish = () => {
    router.replace('/(tabs)/today');
  };

  const step0 = step === 0;
  const step1 = step === 1;
  const step2 = step === 2;
  const step3 = step === 3;
  const step4 = step === 4;
  const step5 = step === 5;

  return (
    <LinearGradient
      colors={gradients.dawn.colors}
      locations={gradients.dawn.locations}
      style={styles.bg}
    >
      <DawnBlobs />
      {step > 0 && (
        <Pressable
          onPress={() => setStep((s) => Math.max(0, s - 1))}
          hitSlop={12}
          style={styles.backBtn}
        >
          <Icon d={ICONS.back} size={22} color={colors.ink} />
        </Pressable>
      )}
      {step0 && (
        <Step0Welcome onNext={() => setStep(1)} />
      )}
      {step1 && (
        <Step1HowItWorks onNext={() => setStep(2)} />
      )}
      {step2 && (
        <Step2Intent onNext={() => setStep(3)} fireToast={fireToast} />
      )}
      {step3 && (
        <Step3PairUp onNext={() => setStep(4)} fireToast={fireToast} />
      )}
      {step4 && (
        <Step4Joined onNext={() => setStep(5)} />
      )}
      {step5 && (
        <Step5NotifyTime onFinish={handleFinish} fireToast={fireToast} />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
  },
  backBtn: {
    position: 'absolute',
    top: 56,
    left: 18,
    zIndex: 50,
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenContainer: {
    flex: 1,
    paddingHorizontal: 28,
  },
  screenContent: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: 70,
    paddingBottom: 30,
    paddingHorizontal: 0,
  },
  scrollContent: {
    paddingTop: 70,
    paddingHorizontal: 0,
    paddingBottom: 200,
  },
  centeredContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  welcomeCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  peekContainer: {
    marginBottom: 0,
  },
  buttonGroup: {
    gap: 10,
  },
  stepsContainer: {
    flex: 1,
    gap: 30,
    justifyContent: 'center',
    paddingBottom: 12,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
  },
  stepAvatar: {
    width: 50,
    height: 50,
    borderRadius: radius.pill,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.shadowSoft,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    marginBottom: 16,
  },
  dot: {
    height: 6,
    borderRadius: radius.pill,
  },
  chipsContainer: {
    gap: 11,
    flex: 1,
  },
  chipBase: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 15,
    borderRadius: 18,
    borderWidth: 1.5,
    ...shadows.shadowSoft,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    borderWidth: 2,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteCard: {
    borderRadius: 26,
    padding: 26,
    paddingHorizontal: 22,
    alignItems: 'center',
    borderWidth: 1,
  },
  textInput: {
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.line,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 16,
    color: colors.ink,
    fontFamily: fontFamily.ui,
    marginBottom: 16,
  },
  avatarOverlap: {
    position: 'relative',
    width: 150,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    flexDirection: 'row',
  },
  buttonArea: {
    paddingBottom: 30,
    gap: 16,
  },
});
