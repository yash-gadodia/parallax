import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Share,
  StyleSheet,
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
import { useOnboardingStore } from '../../src/store/onboarding';
import { useSession } from '../../src/features/auth/useSession';
import { useCouple } from '../../src/features/pairing/useCouple';
import { useIdentity } from '../../src/features/profile/useIdentity';
import { createCouple, joinCouple, unpairCouple } from '../../src/features/pairing/pairingActions';
import { supabase } from '../../src/lib/supabase';
import { requestPermissions, scheduleDailyNudge, registerPushToken } from '../../src/features/notifications';
import { track, EVENTS } from '../../src/lib/analytics';

const TAGLINE = 'mind the parallax error';

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
  const { me, partner } = useIdentity();
  const rows = [
    {
      color: colors.p1,
      who: { initial: me.initial },
      showPeek: false,
      title: 'Answer honestly',
      subtitle:
        "Pick what's true for you, your real Friday night, your worst habit.",
    },
    {
      color: colors.p2,
      who: { initial: partner.initial },
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
  const { setPendingIntents } = useOnboardingStore();

  const toggleIntent = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleContinue = async () => {
    if (!selected.length) return;

    setLoading(true);
    // Always stash in store so they survive the sign-up redirect.
    setPendingIntents(selected);
    // Flush to DB immediately if already signed in; otherwise the root guard will
    // flush them once a session is available (idempotent).
    try {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id;
      if (uid) {
        // @ts-expect-error supabase-js typed update arg resolves to never for this table
        await supabase.from('profiles').update({ intents: selected }).eq('id', uid);
      }
    } catch {
      // ignore - intents are flushed via the root guard once session exists
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
  const [createdCoupleId, setCreatedCoupleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [creatingCouple, setCreatingCouple] = useState(true);

  const { pendingInviteCode, setPendingInviteCode } = useOnboardingStore();

  // If the user arrived via a deep link (parallax://join?code=...), open the
  // join input immediately with the code prefilled.
  const [showJoinInput, setShowJoinInput] = useState(!!pendingInviteCode);
  const [joinCode, setJoinCode] = useState(pendingInviteCode ?? '');

  // Clear the pending code once consumed so a back-navigation doesn't re-apply it.
  useEffect(() => {
    if (pendingInviteCode) {
      setPendingInviteCode(null);
    }
  }, []);

  const createInvite = useCallback(async () => {
    setCreatingCouple(true);
    try {
      const couple = await createCouple();
      setInviteCode(couple.invite_code ?? null);
      setCreatedCoupleId(couple.id ?? null);
    } catch {
      setInviteCode(null);
      fireToast('Could not create your invite code. Check your connection and try again.');
    } finally {
      setCreatingCouple(false);
    }
  }, [fireToast]);

  // An invitee (arrived via join link/code) must NOT auto-create a couple —
  // that orphan pending couple would outlive their join. Only the invite path
  // creates one, lazily when it's actually shown.
  useEffect(() => {
    if (!showJoinInput && !inviteCode) {
      createInvite();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createInvite, showJoinInput]);

  const handleShare = async () => {
    if (!inviteCode) return;
    try {
      // Deep-link: tapping this opens the app straight into join-by-code with
      // the code prefilled (parallax:// custom scheme, works in dev + standalone).
      // TODO (Yash): replace the https URL with your real domain once you host
      // the Apple App Site Association file + configure associatedDomains in app.json.
      const deepLink = `parallax://join?code=${inviteCode}`;
      const result = await Share.share({
        message: `Join me on Parallax! Tap to join: ${deepLink}\n\nOr enter my code manually: ${inviteCode}`,
      });
      // Cancelling the sheet is not a share — stay on this step.
      if (result.action === Share.dismissedAction) return;
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
      // If this user created their own invite couple before deciding to join
      // their partner's instead, remove the orphan so it can't shadow the
      // real couple.
      if (createdCoupleId) {
        try {
          await unpairCouple(createdCoupleId);
        } catch {
          // Best-effort cleanup; joining still proceeds.
        }
        setCreatedCoupleId(null);
        setInviteCode(null);
      }
      await joinCouple(joinCode);
      track(EVENTS.COUPLE_PAIRED, { method: 'join' });
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
          Send your partner the invite link. Parallax only works once you're both in.
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
              {!creatingCouple && !inviteCode ? (
                <Press onPress={createInvite} scale={false}>
                  <Text
                    allowFontScaling={false}
                    style={{
                      fontFamily: fontFamily.mono,
                      fontSize: 30,
                      fontWeight: '700',
                      letterSpacing: 4.2,
                      color: colors.p2Deep,
                      marginTop: 12,
                      marginBottom: 6,
                    }}
                  >
                    Tap retry
                  </Text>
                </Press>
              ) : (
                <Text
                  allowFontScaling={false}
                  style={{
                    fontFamily: fontFamily.mono,
                    fontSize: 30,
                    fontWeight: '700',
                    letterSpacing: 4.2,
                    color: colors.ink,
                    marginTop: 12,
                    marginBottom: 6,
                  }}
                >
                  {creatingCouple ? 'Loading...' : inviteCode}
                </Text>
              )}
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
              Send your partner the link
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

// Step 4: Joined celebration (real) or waiting-for-partner state
function Step4Joined({ onNext, hasSession }: { onNext: () => void; hasSession: boolean }) {
  const router = useRouter();
  const { status } = useCouple();
  const { me, partner } = useIdentity();
  // Demo path (no session): show scripted celebration immediately.
  // Real path (session): wait for couple to become active via realtime/poll.
  const isActive = !hasSession || status === 'active';

  // COUPLE_PAIRED fires on the ACTUAL pairing moment: the realtime flip to
  // 'active' while the inviter waits here. If we mounted already-active (the
  // invitee — join_couple already tracked it), there is no flip to report.
  const initialStatus = useRef(status);
  const paired = useRef(false);
  useEffect(() => {
    if (
      hasSession &&
      status === 'active' &&
      initialStatus.current !== 'active' &&
      !paired.current
    ) {
      paired.current = true;
      track(EVENTS.COUPLE_PAIRED, { method: 'invite' });
    }
  }, [hasSession, status]);

  if (!isActive) {
    // Pending: invite sent, partner not in yet. Not a wall — a doorway. Let them
    // into the app to answer ahead; the reveal stays held until the partner joins
    // (realtime here also flips to the celebration below the moment they do).
    return (
      <SafeAreaViewContext style={styles.screenContainer}>
        <View style={[styles.screenContent, styles.centeredContent]}>
          <Float style={{ marginBottom: 16 }}>
            <Peek size={88} mood="love" />
          </Float>
          <Serif s={34} italic style={{ marginBottom: 12, textAlign: 'center' }}>
            You're in.
          </Serif>
          <Text
            allowFontScaling={false}
            style={{
              fontSize: 15,
              color: colors.inkSoft,
              lineHeight: 23,
              maxWidth: 290,
              textAlign: 'center',
              fontFamily: fontFamily.ui,
            }}
          >
            Their invite's on its way. Answer today's drop now — they'll see your
            hunches the moment they join.
          </Text>
          <View style={{ marginTop: 30, width: '100%' }}>
            {/* Ritual anchoring (P2.4): pending users go through the
                notify-time step too — it was silently skipped before,
                leaving most new users with no daily reminder at all. */}
            <Btn kind="us" onPress={onNext}>
              Answer today's drop →
            </Btn>
          </View>
        </View>
      </SafeAreaViewContext>
    );
  }

  return (
    <SafeAreaViewContext style={styles.screenContainer}>
      <View style={[styles.screenContent, styles.centeredContent]}>
        <View style={styles.avatarOverlap}>
          <Tok who={{ initial: me.initial }} you size={70} ring />
          <View style={{ marginLeft: -22 }}>
            <Tok who={{ initial: partner.initial, name: partner.name }} size={70} ring />
          </View>
        </View>

        <Text allowFontScaling={false} style={{ fontSize: 30, marginBottom: 4 }}>
          🎉
        </Text>
        <Serif s={42} italic>
          {partner.name} joined!
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
    // Persist best-effort - never block finishing onboarding on auth/network.
    try {
      const moment = MOMENTS.find((m) => m[0] === selected);
      const time = moment?.[4]; // 24h 'HH:MM' — valid for the Postgres `time` column

      // Request permission + schedule local daily nudge (no-ops gracefully in Expo Go).
      if (time) {
        await requestPermissions();
        await scheduleDailyNudge(time);
      }

      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id;
      if (uid) {
        if (time) {
          // @ts-expect-error supabase-js typed update arg resolves to never for this table
          await supabase.from('profiles').update({ notify_time: time }).eq('id', uid);
        }
        // GATE: registerPushToken no-ops in Expo Go without EAS project ID.
        await registerPushToken();
      }
    } catch {
      // ignore - saved if/when signed in
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
          sub="your first drop is live"
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
  const { session, loading: sessionLoading } = useSession();

  // A signed-in but unpaired user (e.g. just confirmed their email) skips the
  // intro and lands on pairing. Active couples never reach here (root guard).
  useEffect(() => {
    if (!sessionLoading && session && step === 0) {
      setStep(3);
    }
  }, [sessionLoading, session, step]);

  const handleFinish = () => {
    router.replace('/(tabs)/today');
  };

  // Pairing needs a real account; new users create one first.
  const handleIntentNext = () => {
    if (session) {
      setStep(3);
    } else {
      router.push('/signup');
    }
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
        <Step2Intent onNext={handleIntentNext} fireToast={fireToast} />
      )}
      {step3 && (
        <Step3PairUp onNext={() => setStep(4)} fireToast={fireToast} />
      )}
      {step4 && (
        <Step4Joined onNext={() => setStep(5)} hasSession={!!session} />
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
    paddingVertical: 15,
    paddingHorizontal: 16,
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
