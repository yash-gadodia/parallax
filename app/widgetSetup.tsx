import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { colors, gradients, shadows, space, radius } from '../src/design/tokens';
import { fontFamily } from '../src/design/typography';
import { Icon, ICONS } from '../src/components/Icon';
import { RadialGlow } from '../src/components/RadialGlow';
import { Kick, Serif } from '../src/components/Text';
import Press from '../src/components/Press';
import { Mark } from '../src/components/Mark';
import { Ring } from '../src/components/Ring';
import Btn from '../src/components/Btn';
import TopBar from '../src/components/TopBar';
import { DawnBlobs } from '../src/components/DawnBlobs';
import GradientText from '../src/components/GradientText';
import Toast from '../src/components/Toast';

const YOU = { initial: 'Y' };
const PAR = { initial: 'D' };

function WaveWidget({ onTap, big }: { onTap?: () => void; big?: boolean }) {
  return (
    <Press onPress={onTap} scale={!!onTap}>
      <View
        style={{
          borderRadius: radius.card,
          backgroundColor: colors.surface,
          overflow: 'hidden',
          height: big ? 158 : 150,
          paddingHorizontal: 16,
          paddingVertical: 15,
          justifyContent: 'flex-start',
          ...shadows.shadowPop,
          position: 'relative',
        }}
      >
        {/* Blurred background blob */}
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

        {/* "today" label */}
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

        {/* Ring + status */}
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
              Dani played 💌
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
    </Press>
  );
}

function PingWidget({ onTap }: { onTap?: () => void }) {
  return (
    <Press onPress={onTap} scale={true}>
      <View
        style={{
          flex: 1,
          aspectRatio: 1,
          borderRadius: radius.card,
          backgroundColor: colors.p2,
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
          ...shadows.shadowPop,
          position: 'relative',
        }}
      >
        {/* Radial gradient shine overlay */}
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
            tap to ping
          </Text>
        </View>
      </View>
    </Press>
  );
}

export default function WidgetSetupScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [pingToast, setPingToast] = useState<string | null>(null);

  const handlePing = () => {
    setPingToast('Dani felt that 💞');
    setTimeout(() => setPingToast(null), 2200);
  };

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
        <TopBar
          title="home screen"
          onBack={() => router.back()}
        />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: space.gutter,
            paddingTop: 50,
            paddingBottom: 140,
          }}
          scrollEnabled={false}
        >
          {/* Kicker */}
          <Kick c={colors.p2Deep}>live on your home screen</Kick>

          {/* Hero headline */}
          <Serif s={38} style={{ marginTop: 10, marginBottom: 8 }}>
            See Dani all day, not just in the app.
          </Serif>

          {/* Subheader */}
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
            A little piece of <Text style={{ fontStyle: 'italic', color: colors.inkSoft }}>us</Text> on your home screen.
            Your wavelength updates live, and one tap sends Dani a "thinking of you."
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
              style={{
                padding: 22,
              }}
            >
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1.6 }}>
                  <WaveWidget />
                </View>
                <View style={{ flex: 1 }}>
                  <PingWidget onTap={handlePing} />
                </View>
              </View>
            </LinearGradient>
          </View>
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
          <Btn
            kind="us"
            onPress={() => router.push('/homeScreen')}
            sub="long-press · add widget"
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Icon d={ICONS.grid} size={17} color="#fff" />
              <Text allowFontScaling={false} style={{ color: '#fff', fontWeight: '700' }}>Add to Home Screen</Text>
            </View>
          </Btn>
        </View>

        {pingToast && <Toast msg={pingToast} />}
      </SafeAreaView>
    </LinearGradient>
  );
}
