import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DawnBlobs } from '../../src/components/DawnBlobs';
import { Wordmark } from '../../src/components/Wordmark';
import { Serif, Kick } from '../../src/components/Text';
import Btn from '../../src/components/Btn';
import Press from '../../src/components/Press';
import Card from '../../src/components/Card';
import Tok from '../../src/components/Tok';
import { Icon, ICONS } from '../../src/components/Icon';
import { colors, gradients, space } from '../../src/design/tokens';
import { fontFamily } from '../../src/design/typography';
import { useSession } from '../../src/features/auth/useSession';
import { useCouple } from '../../src/features/pairing/useCouple';
import { useIdentity } from '../../src/features/profile/useIdentity';
import { useRefocusSession } from '../../src/features/refocus/useRefocusSession';
import { useLearnings } from '../../src/features/lovemap/useLearnings';
import { MoodCheckCard } from '../../src/features/mood/MoodCheckCard';
import { RepairCheckinCard } from '../../src/features/repair/RepairCheckinCard';

// v2 Home. The whole app at a glance: how you two are today, anything live,
// and the one thing this product is for — always reachable, never nagging.
export default function HomeScreen() {
  const router = useRouter();
  const { session } = useSession();
  const { couple, status } = useCouple();
  const { me, partner } = useIdentity();
  const myId = session?.user.id ?? null;
  const { session: rfSession } = useRefocusSession(couple?.id ?? null);
  const { items: learnings, isSample } = useLearnings();

  const unpaired = status !== 'active';
  const openSession =
    rfSession &&
    (rfSession.state === 'waiting_partner' ||
      rfSession.state === 'ready' ||
      rfSession.state === 'revealed');
  const theyStartedIt =
    !!rfSession &&
    rfSession.state === 'waiting_partner' &&
    rfSession.initiator !== myId;
  // isSample means the demo seed, not this couple — never present it as theirs.
  const latestLearning = isSample ? null : (learnings?.[0] ?? null);

  return (
    <LinearGradient
      colors={gradients.dawn.colors}
      locations={gradients.dawn.locations}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1, backgroundColor: colors.bg0 }}
    >
      <DawnBlobs />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: space.gutter,
            paddingBottom: 140,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: 8,
              marginBottom: 22,
            }}
          >
            <Wordmark size={28} />
            <Press onPress={() => router.push('/profile')} scale={false}>
              <Tok who={{ name: me.name, initial: me.initial }} size={38} you />
            </Press>
          </View>

          {unpaired && (
            <Press onPress={() => router.push('/(onboarding)')}>
              <Card
                style={{
                  borderRadius: 20,
                  padding: 16,
                  marginBottom: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <Text style={{ fontSize: 26 }}>💌</Text>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '700',
                      color: colors.ink,
                      fontFamily: fontFamily.ui,
                    }}
                  >
                    Bring {partner.name} in
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      color: colors.inkSoft,
                      marginTop: 2,
                      lineHeight: 13 * 1.45,
                      fontFamily: fontFamily.ui,
                    }}
                  >
                    Parallax needs both of you to find a middle ground.
                  </Text>
                </View>
                <Icon d={ICONS.chevR} size={18} color={colors.inkMute} />
              </Card>
            </Press>
          )}

          {/* The daily pulse: one tap, no typing. Keeps the mediator's sense of
              how you two have been without ever becoming homework. */}
          <MoodCheckCard
            coupleId={couple?.id ?? null}
            userId={myId}
            tz={couple?.tz}
            playedToday={false}
          />

          {/* A live session outranks everything else on this screen. */}
          {openSession && (
            <Press onPress={() => router.push('/(tabs)/refocus')}>
              <Card
                style={{
                  borderRadius: 22,
                  padding: 18,
                  marginTop: 16,
                  borderWidth: 1,
                  borderColor: colors.p2,
                }}
              >
                <Kick>{theyStartedIt ? 'they opened one' : 'in progress'}</Kick>
                <Serif s={22} style={{ marginTop: 6, lineHeight: 22 * 1.15 }}>
                  {theyStartedIt
                    ? `${partner.name} shared their side`
                    : 'Your side is in'}
                </Serif>
                <Text
                  style={{
                    fontSize: 13.5,
                    color: colors.inkSoft,
                    marginTop: 6,
                    lineHeight: 13.5 * 1.5,
                    fontFamily: fontFamily.ui,
                  }}
                >
                  {theyStartedIt
                    ? 'Add yours whenever you’re ready. They never see your words, only the middle ground.'
                    : 'The middle ground appears the moment their side is in.'}
                </Text>
              </Card>
            </Press>
          )}

          <RepairCheckinCard
            coupleId={couple?.id ?? null}
            userId={myId}
            partnerName={partner.name}
            myName={me.name}
            myInitial={me.initial}
            partnerInitial={partner.initial}
          />

          {/* Always here, never shouting. The reason the app is on the phone. */}
          <View style={{ marginTop: 26 }}>
            <Serif s={30} style={{ marginBottom: 8, lineHeight: 30 * 1.1 }}>
              Something's up?
            </Serif>
            <Text
              style={{
                fontSize: 14.5,
                color: colors.inkSoft,
                marginBottom: 16,
                lineHeight: 14.5 * 1.5,
                fontFamily: fontFamily.ui,
              }}
            >
              Tell it your side, privately. If {partner.name} adds theirs, you
              both get the middle ground, never each other's raw words.
            </Text>
            <Btn kind="us" onPress={() => router.push('/(tabs)/refocus')}>
              Untangle something
            </Btn>
          </View>

          {latestLearning && (
            <Press onPress={() => router.push('/(tabs)/us')}>
              <Card
                style={{
                  borderRadius: 20,
                  padding: 16,
                  marginTop: 26,
                }}
              >
                <Kick>what you two know</Kick>
                <Text
                  style={{
                    fontSize: 15,
                    color: colors.ink,
                    marginTop: 8,
                    lineHeight: 15 * 1.5,
                    fontFamily: fontFamily.ui,
                  }}
                >
                  {latestLearning.emoji ? `${latestLearning.emoji} ` : ''}
                  {latestLearning.need ?? latestLearning.detail}
                </Text>
              </Card>
            </Press>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
