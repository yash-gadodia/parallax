import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { safeBack } from '../src/lib/nav';
import { colors, gradients, shadows, space, radius } from '../src/design/tokens';
import { fontFamily } from '../src/design/typography';
import { Icon, ICONS } from '../src/components/Icon';
import { RadialGlow } from '../src/components/RadialGlow';
import { Kick, Serif } from '../src/components/Text';
import { Mark } from '../src/components/Mark';
import { Ring } from '../src/components/Ring';
import Btn from '../src/components/Btn';
import TopBar from '../src/components/TopBar';
import { DawnBlobs } from '../src/components/DawnBlobs';
import GradientText from '../src/components/GradientText';
import { useIdentity } from '../src/features/profile/useIdentity';

// Preview art only — the real widget is native (targets/widget/index.swift),
// rendered by iOS from the App Group snapshot written in src/features/widget.
function WaveWidget() {
  const { partner } = useIdentity();
  return (
    <View
      style={{
        borderRadius: radius.card,
        backgroundColor: colors.surface,
        overflow: 'hidden',
        height: 150,
        paddingHorizontal: 16,
        paddingVertical: 15,
        justifyContent: 'flex-start',
        ...shadows.shadow,
        position: 'relative',
      }}
    >
      <View
        style={{
          position: 'absolute',
          top: -24,
          right: -24,
          width: 96,
          height: 96,
          borderRadius: 999,
          backgroundColor: gradients.usSoft.colors[0],
          opacity: 0.5,
        }}
      />

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 7,
          marginBottom: 12,
          zIndex: 1,
        }}
      >
        <Mark size={17} />
        <Text
          allowFontScaling={false}
          style={{
            fontFamily: fontFamily.mono,
            fontSize: 9.5,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
            color: colors.inkMute,
          }}
        >
          today
        </Text>
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          zIndex: 1,
        }}
      >
        <View style={{ width: 70, height: 70, justifyContent: 'center', alignItems: 'center' }}>
          <Ring pct={83} size={70} animate={false} />
          <GradientText
            style={{
              position: 'absolute',
              fontFamily: fontFamily.disp,
              fontSize: 22,
              lineHeight: 28,
            }}
          >
            83
          </GradientText>
        </View>

        <View>
          <Text
            allowFontScaling={false}
            style={{
              fontSize: 14.5,
              fontWeight: '700',
              color: colors.ink,
              lineHeight: 18,
              fontFamily: fontFamily.ui,
            }}
          >
            {partner.name} played 💌
          </Text>
          <Text
            allowFontScaling={false}
            style={{
              fontSize: 13,
              color: colors.inkSoft,
              lineHeight: 18,
              marginTop: 3,
              fontFamily: fontFamily.ui,
            }}
          >
            your turn, tap to see how{'\n'}in-sync you are
          </Text>
        </View>
      </View>
    </View>
  );
}

function PingWidget() {
  return (
    <View
      style={{
        flex: 1,
        aspectRatio: 1,
        borderRadius: radius.card,
        backgroundColor: colors.p2,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        ...shadows.shadow,
        position: 'relative',
      }}
    >
      <RadialGlow color="#ffffff" opacity={0.4} cx="50%" cy="0%" r="80%" stop={0.6} />

      <View style={{ zIndex: 1, alignItems: 'center' }}>
        <Text
          allowFontScaling={false}
          style={{
            fontSize: 30,
            marginBottom: 6,
            color: colors.p2,
          }}
        >
          💞
        </Text>
        <Text
          allowFontScaling={false}
          style={{
            fontFamily: fontFamily.mono,
            fontSize: 8.5,
            letterSpacing: 1,
            textTransform: 'uppercase',
            color: '#fff',
            fontWeight: '700',
          }}
        >
          in sync
        </Text>
      </View>
    </View>
  );
}

function Step({ n, title, detail }: { n: string; title: string; detail: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
      <View
        style={{
          width: 26,
          height: 26,
          borderRadius: 999,
          backgroundColor: colors.sunken,
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: 1,
        }}
      >
        <Text
          allowFontScaling={false}
          style={{
            fontFamily: fontFamily.mono,
            fontSize: 11,
            color: colors.p2Deep,
            fontWeight: '700',
          }}
        >
          {n}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text
          allowFontScaling={false}
          style={{
            fontSize: 14.5,
            fontWeight: '700',
            color: colors.ink,
            lineHeight: 20,
            fontFamily: fontFamily.ui,
          }}
        >
          {title}
        </Text>
        <Text
          allowFontScaling={false}
          style={{
            fontSize: 13,
            color: colors.inkSoft,
            lineHeight: 18,
            marginTop: 2,
            fontFamily: fontFamily.ui,
          }}
        >
          {detail}
        </Text>
      </View>
    </View>
  );
}

export default function WidgetSetupScreen() {
  const router = useRouter();
  const { partner } = useIdentity();

  return (
    <LinearGradient
      colors={gradients.dawn.colors}
      locations={gradients.dawn.locations}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <DawnBlobs />
      <SafeAreaView style={{ flex: 1 }}>
        <TopBar title="home screen" onBack={() => safeBack(router)} />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: space.gutter,
            paddingTop: 34,
            paddingBottom: 140,
          }}
          showsVerticalScrollIndicator={false}
        >
          <Kick c={colors.p2Deep}>live on your home screen</Kick>

          <Serif s={38} style={{ marginTop: 10, marginBottom: 8 }}>
            See {partner.name} all day, not just in the app.
          </Serif>

          <Text
            allowFontScaling={false}
            style={{
              fontSize: 15,
              color: colors.inkSoft,
              lineHeight: 21,
              marginBottom: 24,
              fontFamily: fontFamily.ui,
            }}
          >
            The parallax widget shows today's drop, your wavelength, and your
            streak — and it lights up the moment {partner.name} answers.
          </Text>

          {/* Preview on a mini wallpaper */}
          <View
            style={{
              borderRadius: radius.cardLg,
              overflow: 'hidden',
              ...shadows.shadow,
            }}
          >
            <LinearGradient
              colors={['#FCEFF0', '#EEEDFB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ padding: 22 }}
            >
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1.6 }}>
                  <WaveWidget />
                </View>
                <View style={{ flex: 1 }}>
                  <PingWidget />
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Real install steps */}
          <View
            style={{
              marginTop: 24,
              borderRadius: radius.cardLg,
              backgroundColor: colors.surfaceSoft,
              padding: space.cardPad + 4,
              gap: 16,
            }}
          >
            <Kick c={colors.inkMute}>how to add it</Kick>
            <Step
              n="1"
              title="long-press your home screen"
              detail="anywhere that's empty, until the apps start to wiggle."
            />
            <Step
              n="2"
              title="tap + (or edit → add widget)"
              detail="it's in the top corner of the screen."
            />
            <Step
              n="3"
              title="search parallax"
              detail="pick the small or medium size, then tap add widget."
            />
          </View>

          <Text
            allowFontScaling={false}
            style={{
              fontSize: 12.5,
              color: colors.inkMute,
              lineHeight: 18,
              marginTop: 14,
              fontFamily: fontFamily.ui,
            }}
          >
            just installed the app? parallax appears in the widget list after
            your next app launch.
          </Text>
        </ScrollView>

        {/* Sticky CTA */}
        <View
          style={{
            position: 'absolute',
            left: space.gutter,
            right: space.gutter,
            bottom: 22,
            zIndex: 40,
          }}
        >
          <Btn kind="us" onPress={() => safeBack(router)} sub="see you out there">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Icon d={ICONS.grid} size={17} color="#fff" />
              <Text allowFontScaling={false} style={{ color: '#fff', fontWeight: '700' }}>
                got it
              </Text>
            </View>
          </Btn>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
