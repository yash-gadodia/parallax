import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  Animated,
  useWindowDimensions,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, shadows, radius, space, gradients } from '../src/design/tokens';
import { fontFamily } from '../src/design/typography';
import { Icon, ICONS } from '../src/components/Icon';
import { Kick, Serif } from '../src/components/Text';
import Press from '../src/components/Press';
import Tok from '../src/components/Tok';
import { Ring } from '../src/components/Ring';
import { Mark } from '../src/components/Mark';
import Toast from '../src/components/Toast';
import GradientText from '../src/components/GradientText';

const YOU = { initial: 'Y' };
const PAR = { initial: 'D' };

interface HeartParticle {
  id: number;
  x: number;
  emoji: string;
}

// WaveWidget: ring @ 83%, subtitle, touchable to open play screen
function WaveWidget({ onTap, big }: { onTap?: () => void; big?: boolean }) {
  const widgetHeight = big ? 158 : 150;

  return (
    <Press onPress={onTap} scale={!!onTap}>
      <View
        style={{
          borderRadius: 26,
          backgroundColor: colors.surface,
          overflow: 'hidden',
          paddingHorizontal: 16,
          paddingVertical: 15,
          height: widgetHeight,
          position: 'relative',
          ...shadows.shadow,
        }}
      >
        {/* blurred bg circle (top right) */}
        <View
          style={{
            position: 'absolute',
            top: -24,
            right: -24,
            width: 96,
            height: 96,
            borderRadius: 48,
            backgroundColor: 'rgba(157,149,245,0.18)',
          }}
        />

        {/* "today" label */}
        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 7 }}>
          <Mark size={17} />
          <Text
            allowFontScaling={false}
            style={{
              fontFamily: fontFamily.mono,
              fontSize: 9.5,
              letterSpacing: 1.2,
              color: colors.inkMute,
              textTransform: 'uppercase',
            }}
          >
            today
          </Text>
        </View>

        {/* ring + text row */}
        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
            marginTop: 12,
          }}
        >
          {/* Ring with center percentage */}
          <View style={{ position: 'relative', width: 70, height: 70, flexShrink: 0 }}>
            <Ring pct={83} size={70} animate={false} />
            <View
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <GradientText style={{ fontFamily: fontFamily.disp, fontSize: 22, lineHeight: 22 * 1.09 }}>
                83
              </GradientText>
            </View>
          </View>

          {/* Text */}
          <View>
            <Text
              allowFontScaling={false}
              style={{
                fontSize: 14.5,
                fontWeight: '700',
                color: colors.ink,
                lineHeight: 14.5 * 1.2,
              }}
            >
              Dani played 💌
            </Text>
            <Text
              allowFontScaling={false}
              style={{
                fontSize: 13,
                color: colors.inkSoft,
                marginTop: 3,
                lineHeight: 13 * 1.35,
              }}
            >
              your turn, tap to see how in‐sync you are
            </Text>
          </View>
        </View>
      </View>
    </Press>
  );
}

// PingWidget: square, 💞 emoji, tap -> heart rain + toast
function PingWidget({ onTap }: { onTap?: () => void }) {
  return (
    <Press onPress={onTap} scale>
      <LinearGradient
        colors={gradients.us.colors}
        locations={gradients.us.locations}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          aspectRatio: 1,
          borderRadius: 24,
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          ...shadows.shadow,
        }}
      >
        {/* top sheen */}
        <View
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(255,255,255,0.4)',
          }}
        />

        <Text
          allowFontScaling={false}
          style={{
            fontSize: 30,
            position: 'relative',
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
            color: '#fff',
            textTransform: 'uppercase',
            marginTop: 6,
            position: 'relative',
            fontWeight: '700',
          }}
        >
          tap to ping
        </Text>
      </LinearGradient>
    </Press>
  );
}

// AppIcon: grid item with bg + glyph/mark, label
function AppIcon({
  label,
  bg,
  glyph,
  mark,
  onTap,
}: {
  label: string;
  bg: string;
  glyph?: React.ReactNode;
  mark?: boolean;
  onTap?: () => void;
}) {
  const isGradient = typeof bg === 'string' && bg.startsWith('linear-gradient');
  const tileStyle = {
    width: 58 as const,
    height: 58 as const,
    borderRadius: 15 as const,
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    overflow: 'hidden' as const,
    ...shadows.shadowSoft,
  };

  return (
    <Press onPress={onTap} scale={!!onTap} style={{ width: 'auto' }}>
      <View style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {isGradient ? (
          <LinearGradient
            colors={gradients.us.colors}
            locations={gradients.us.locations}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={tileStyle}
          >
            {mark ? <Mark size={30} /> : glyph}
          </LinearGradient>
        ) : (
          <View
            style={{
              ...tileStyle,
              backgroundColor: bg,
            }}
          >
            {mark ? <Mark size={30} /> : glyph}
          </View>
        )}
        {label ? (
          <Text
            allowFontScaling={false}
            style={{
              fontSize: 10.5,
              color: 'rgba(58,51,64,0.78)',
              fontWeight: '500',
            }}
          >
            {label}
          </Text>
        ) : null}
      </View>
    </Press>
  );
}

// Heart rain particle
function HeartRain({ x, emoji }: { x: number; emoji: string }) {
  const translateY = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(translateY, {
      toValue: -200,
      duration: 1600,
      useNativeDriver: true,
    }).start();
  }, [translateY]);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        bottom: 200,
        left: `${x}%` as `${number}%`,
        zIndex: 25,
        transform: [{ translateY }],
      }}
    >
      <Text style={{ fontSize: 26 }}>{emoji}</Text>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [hearts, setHearts] = useState<HeartParticle[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const ping = () => {
    const id = Date.now();
    const emojis = ['💞', '💗', '🫶', '❤️'];
    const burst = Array.from({ length: 6 }, (_, i) => ({
      id: id + i,
      x: 10 + Math.random() * 80,
      emoji: emojis[i % 4],
    }));
    setHearts((h) => [...h, ...burst]);
    setToastMsg('Dani felt that 💞');

    setTimeout(() => {
      setHearts((h) => h.filter((x) => !burst.find((b) => b.id === x.id)));
      setToastMsg(null);
    }, 1800);
  };

  const handleExitPill = () => {
    router.back();
  };

  const handlePlayTap = () => {
    router.push('/play');
  };

  const handleParallaxTap = () => {
    router.back();
  };

  const iconColor = '#3A3340';
  const iconSize = 26;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#fff',
        position: 'relative',
      }}
    >
      {/* Status bar padding + springboard mockup */}
      <View
        style={{
          position: 'absolute',
          inset: 0,
          paddingTop: 48,
        }}
      >
        {/* Exit pill (top right) */}
        <View
          style={{
            position: 'absolute',
            top: 54,
            right: 18,
            zIndex: 30,
            overflow: 'hidden',
            borderRadius: radius.pill,
          }}
        >
          <BlurView intensity={60}>
            <Press onPress={handleExitPill} scale={false}>
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 13,
                  paddingVertical: 8,
                }}
              >
                <Text
                  allowFontScaling={false}
                  style={{
                    fontSize: 12.5,
                    fontWeight: '700',
                    color: colors.ink,
                  }}
                >
                  Back to app
                </Text>
              </View>
            </Press>
          </BlurView>
        </View>

        {/* Clock (center top) */}
        <View style={{ alignItems: 'center', marginTop: 18 }}>
          <Text
            allowFontScaling={false}
            style={{
              fontSize: 15,
              fontWeight: '600',
              color: 'rgba(58,51,64,0.8)',
            }}
          >
            Sunday, June 8
          </Text>
          <Text
            allowFontScaling={false}
            style={{
              fontSize: 78,
              fontWeight: '600',
              color: colors.ink,
              lineHeight: 78,
              letterSpacing: -1,
              fontFamily: fontFamily.ui,
            }}
          >
            9:41
          </Text>
        </View>

        {/* Widgets (wave + ping) */}
        <View style={{ paddingHorizontal: 22, paddingTop: 24 }}>
          <View style={{ display: 'flex', flexDirection: 'row', gap: 13, alignItems: 'stretch' }}>
            <View style={{ flex: 1.6 }}>
              <WaveWidget big onTap={handlePlayTap} />
            </View>
            <View style={{ flex: 1 }}>
              <PingWidget onTap={ping} />
            </View>
          </View>
        </View>

        {/* App icon grid (4x2) */}
        <View
          style={{
            paddingHorizontal: 26,
            paddingTop: 26,
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 13,
            rowGap: 18,
            zIndex: 10,
          }}
        >
          <View style={{ width: '25%', alignItems: 'center' }}>
            <AppIcon label="Parallax" bg="#fff" mark onTap={handleParallaxTap} />
          </View>
          <View style={{ width: '25%', alignItems: 'center' }}>
            <AppIcon
              label="Messages"
              bg="#34C759"
              glyph={
                <Icon d={ICONS.chat} size={iconSize} color="#fff" sw={1.5} />
              }
            />
          </View>
          <View style={{ width: '25%', alignItems: 'center' }}>
            <AppIcon
              label="Camera"
              bg="#3A3340"
              glyph={
                <Icon
                  d="M5 7h2l1-1.5h4L13 7h2a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1V8a1 1 0 011-1zM10 13a2.3 2.3 0 100-4.6 2.3 2.3 0 000 4.6z"
                  size={iconSize}
                  color="#fff"
                  sw={1.5}
                />
              }
            />
          </View>
          <View style={{ width: '25%', alignItems: 'center' }}>
            <AppIcon
              label="Photos"
              bg="linear-gradient(135deg,#FF8E7A,#9D95F5)"
              glyph={
                <Icon d={ICONS.spark} size={iconSize} color="#fff" sw={1.5} />
              }
            />
          </View>
          <View style={{ width: '25%', alignItems: 'center' }}>
            <AppIcon
              label="Notes"
              bg="#FFD60A"
              glyph={
                <Icon
                  d={ICONS.pencil}
                  size={iconSize}
                  color={iconColor}
                  sw={1.5}
                />
              }
            />
          </View>
          <View style={{ width: '25%', alignItems: 'center' }}>
            <AppIcon
              label="Music"
              bg="#FF6A53"
              glyph={
                <Icon
                  d="M7 14V5l8-1.5V12M7 14a2 2 0 11-2.5-1.9M15 12a2 2 0 11-2.5-1.9"
                  size={iconSize}
                  color="#fff"
                  sw={1.5}
                />
              }
            />
          </View>
          <View style={{ width: '25%', alignItems: 'center' }}>
            <AppIcon
              label="Maps"
              bg="#54C2A0"
              glyph={
                <Icon
                  d="M10 17s5-4.5 5-8a5 5 0 00-10 0c0 3.5 5 8 5 8zM10 7.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z"
                  size={iconSize}
                  color="#fff"
                  sw={1.5}
                />
              }
            />
          </View>
          <View style={{ width: '25%', alignItems: 'center' }}>
            <AppIcon
              label="Settings"
              bg="#8B8398"
              glyph={
                <Icon d={ICONS.gear} size={iconSize} color="#fff" sw={1.5} />
              }
            />
          </View>
        </View>

        {/* Dock (frosted glass, bottom) */}
        <View
          style={{
            position: 'absolute',
            left: 16,
            right: 16,
            bottom: 16,
            height: 86,
            borderRadius: 32,
            overflow: 'hidden',
            zIndex: 20,
          }}
        >
          <BlurView intensity={80} style={{ flex: 1 }} />
          <View
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-around',
              paddingHorizontal: 18,
            }}
          >
            <AppIcon
              label=""
              bg="#34C759"
              glyph={
                <Icon
                  d="M4 5.5h12a1 1 0 011 1v6a1 1 0 01-1 1H9l-3.5 3v-3H4a1 1 0 01-1-1v-6a1 1 0 011-1z"
                  size={iconSize}
                  color="#fff"
                  sw={1.5}
                />
              }
            />
            <AppIcon
              label=""
              bg="#3A82F7"
              glyph={
                <Icon
                  d="M3 6.5h14M3 10h14M3 13.5h9"
                  size={iconSize}
                  color="#fff"
                  sw={1.5}
                />
              }
            />
            <AppIcon label="" bg="#fff" mark onTap={handleParallaxTap} />
            <AppIcon
              label=""
              bg="#5A8DEE"
              glyph={
                <Icon d={ICONS.us} size={iconSize} color="#fff" sw={1.5} />
              }
            />
          </View>
        </View>

        {/* Heart rain particles */}
        {hearts.map((h) => (
          <HeartRain key={h.id} x={h.x} emoji={h.emoji} />
        ))}
      </View>

      {/* Toast message */}
      {toastMsg && <Toast msg={toastMsg} />}
    </View>
  );
}
