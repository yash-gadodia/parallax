import React from 'react';
import {
  View,
  ScrollView,
  SafeAreaView,
  Text,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { DawnBlobs } from '../../src/components/DawnBlobs';
import Tok from '../../src/components/Tok';
import Press from '../../src/components/Press';
import { Icon, ICONS } from '../../src/components/Icon';
import Card from '../../src/components/Card';
import { Kick, Serif } from '../../src/components/Text';
import GradientText from '../../src/components/GradientText';
import { colors, gradients, radius, shadows, space } from '../../src/design/tokens';
import { fontFamily } from '../../src/design/typography';
import { LEARNINGS } from '../../src/content/us';
import { ARCHIVE } from '../../src/content/drop';

// Identity definitions
const YOU = { name: 'you', initial: 'Y' };
const PAR = { name: 'Dani', initial: 'D' };

export default function UsScreen() {
  const router = useRouter();

  // Mock state for demonstration
  const streak = 23;
  const done = true;
  const wave = 76;

  // Wavelength history (last 7 from ARCHIVE) + current
  const hist = [62, 71, 58, 80, 74, 88, done ? wave : 83];

  const handleProfilePress = () => {
    router.push('/profile');
  };

  const handleWrappedPress = () => {
    router.push('/wrapped');
  };

  const handleLoveMapPress = () => {
    router.push('/lovemap');
  };

  const handleStreakPress = () => {
    // Would open streak widget
  };

  const handleDropPress = (code: string) => {
    router.push(`/dropDetail?code=${code}`);
  };

  return (
    <LinearGradient
      colors={gradients.dawn.colors}
      locations={gradients.dawn.locations}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1, backgroundColor: colors.bg0 }}
    >
      <DawnBlobs />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          scrollEnabled
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: space.gutter - 16,
            paddingHorizontal: space.gutter,
            paddingBottom: 140,
          }}
        >
          {/* Settings gear (top-right) */}
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 2 }}>
            <Press
              onPress={handleProfilePress}
              scale={false}
              style={{ width: 'auto' }}
            >
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: radius.pill,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.line,
                  ...shadows.shadowSoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon d={ICONS.gear} size={19} color={colors.inkSoft} />
              </View>
            </Press>
          </View>

          {/* Couple avatars + name + streak */}
          <View
            style={{
              alignItems: 'center',
              marginTop: 2,
              marginBottom: 8,
            }}
          >
            {/* Overlapping avatars */}
            <View
              style={{
                flexDirection: 'row',
                marginBottom: 14,
                alignItems: 'center',
              }}
            >
              <Tok who={YOU} you size={62} ring />
              <View style={{ marginLeft: -18 }}>
                <Tok who={PAR} size={62} ring />
              </View>
            </View>

            {/* Couple name (serif italic) */}
            <Serif s={34} italic>
              Yash & Dani
            </Serif>

            {/* Together since + streak */}
            <Press
              onPress={handleStreakPress}
              scale={false}
              style={{ width: 'auto', marginTop: 8 }}
            >
              <Kick>
                together since feb · {streak} day streak 🔥
              </Kick>
            </Press>
          </View>

          {/* Wrapped hero card */}
          <Press onPress={handleWrappedPress}>
            <View
              style={{
                borderRadius: 26,
                overflow: 'hidden',
                marginTop: 18,
                ...shadows.shadow,
              }}
            >
              <LinearGradient
                colors={gradients.us.colors}
                locations={gradients.us.locations}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  paddingHorizontal: 18,
                  paddingVertical: 18,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                  position: 'relative',
                }}
              >
                {/* Radial overlay for depth */}
                <View
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(255,255,255,0.15)',
                  }}
                />

                {/* Gift emoji */}
                <Text style={{ fontSize: 38, zIndex: 1 }}>🎁</Text>

                {/* Text content */}
                <View style={{ flex: 1, zIndex: 1 }}>
                  <Kick c="rgba(255,255,255,0.85)">new · june recap</Kick>
                  <Serif s={28} c="#fff" style={{ marginTop: 2 }}>
                    Your month, wrapped
                  </Serif>
                  <Text
                    style={{
                      fontSize: 13,
                      color: 'rgba(255,255,255,0.92)',
                      marginTop: 3,
                      fontFamily: fontFamily.ui,
                    }}
                  >
                    find out your couple type →
                  </Text>
                </View>
              </LinearGradient>
            </View>
          </Press>

          {/* Love Map card */}
          <Press onPress={handleLoveMapPress}>
            <Card
              style={{
                borderRadius: 26,
                paddingHorizontal: 18,
                paddingVertical: 18,
                marginTop: 14,
              }}
            >
              {/* Header */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 14,
                }}
              >
                <Text style={{ fontSize: 24 }}>🗺️</Text>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '700',
                      color: colors.ink,
                      fontFamily: fontFamily.ui,
                    }}
                  >
                    Your Love Map
                  </Text>
                  <Kick style={{ marginTop: 2 }}>
                    {LEARNINGS.length} things you're learning
                  </Kick>
                </View>
                <Icon d={ICONS.chevR} size={18} color={colors.inkMute} />
              </View>

              {/* First 2 learnings preview */}
              <View style={{ flexDirection: 'column', gap: 9 }}>
                {LEARNINGS.slice(0, 2).map((l) => {
                  const isYou = l.who === 'you';
                  return (
                    <View
                      key={l.id}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 10,
                        paddingHorizontal: 13,
                        paddingVertical: 11,
                        borderRadius: 14,
                        backgroundColor: isYou
                          ? 'rgba(255,142,122,0.08)'
                          : 'rgba(157,149,245,0.09)',
                        borderLeftWidth: 3,
                        borderLeftColor: isYou ? colors.p1 : colors.p2,
                      }}
                    >
                      <Text style={{ fontSize: 17 }}>{l.emoji}</Text>
                      <Text
                        style={{
                          flex: 1,
                          fontSize: 13.5,
                          fontWeight: '600',
                          lineHeight: 19,
                          color: colors.ink,
                          fontFamily: fontFamily.ui,
                        }}
                      >
                        {l.need}
                      </Text>
                      {l.from === 'refocus' && (
                        <Text
                          style={{
                            fontSize: 8,
                            fontWeight: '700',
                            letterSpacing: 1.2,
                            textTransform: 'uppercase',
                            color: colors.p2Deep,
                            backgroundColor: 'rgba(157,149,245,0.16)',
                            paddingHorizontal: 6,
                            paddingVertical: 3,
                            borderRadius: radius.pill,
                            fontFamily: fontFamily.mono,
                          }}
                        >
                          FROM A FIGHT
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>
            </Card>
          </Press>

          {/* Wavelength card with chart */}
          <Card
            style={{
              borderRadius: 26,
              paddingHorizontal: 18,
              paddingVertical: 20,
              marginTop: 18,
            }}
          >
            {/* Header */}
            <View
              style={{
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                marginBottom: 16,
              }}
            >
              <View>
                <Kick c={colors.inkMute}>wavelength · this month</Kick>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'baseline',
                    gap: 8,
                    marginTop: 6,
                  }}
                >
                  <GradientText
                    style={{
                      fontFamily: fontFamily.disp,
                      fontSize: 40,
                      lineHeight: 44,
                      paddingRight: 2.4,
                    }}
                  >
                    76%
                  </GradientText>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '700',
                      color: colors.matchDeep,
                      fontFamily: fontFamily.mono,
                      letterSpacing: 0,
                    }}
                  >
                    ▲ 9%
                  </Text>
                </View>
              </View>
            </View>

            {/* Bar chart (last 7 + current) */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-end',
                gap: 7,
                height: 90,
              }}
            >
              {hist.map((h, i) => (
                <View
                  key={i}
                  style={{
                    flex: 1,
                    height: `${h}%`,
                    borderRadius: 8,
                    backgroundColor:
                      i === hist.length - 1 ? colors.p1 : colors.sunken,
                  }}
                />
              ))}
            </View>

            {/* Chart label */}
            <Text
              style={{
                fontSize: 9,
                fontWeight: '700',
                letterSpacing: 1.6,
                textTransform: 'uppercase',
                color: colors.inkMute,
                textAlign: 'right',
                marginTop: 8,
                fontFamily: fontFamily.mono,
              }}
            >
              LAST 7 DROPS
            </Text>
          </Card>

          {/* Stats trio */}
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 14 }}>
            {[
              { big: '142', label: 'answered' },
              { big: '38', label: 'twin moments' },
              { big: '12', label: 'packs played' },
            ].map((stat, i) => (
              <Card
                key={i}
                style={{
                  flex: 1,
                  borderRadius: 20,
                  paddingHorizontal: 8,
                  paddingVertical: 16,
                  alignItems: 'center',
                }}
              >
                <Serif s={26}>{stat.big}</Serif>
                <Kick style={{ marginTop: 5 }}>{stat.label}</Kick>
              </Card>
            ))}
          </View>

          {/* Drop history label */}
          <View style={{ marginTop: 24, marginBottom: 10 }}>
            <Kick>your drop history</Kick>
          </View>

          {/* History list */}
          <View style={{ flexDirection: 'column', gap: 10 }}>
            {ARCHIVE.map((d) => (
              <Press key={d.code} onPress={() => handleDropPress(d.code)}>
                <Card
                  style={{
                    borderRadius: 20,
                    paddingHorizontal: 15,
                    paddingVertical: 13,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 13,
                  }}
                >
                  {/* Emoji icon */}
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      backgroundColor: colors.sunken,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 22 }}>{d.emoji}</Text>
                  </View>

                  {/* Title + code/day */}
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: '700',
                        color: colors.ink,
                        fontFamily: fontFamily.disp,
                      }}
                    >
                      {d.title}
                    </Text>
                    <Kick style={{ marginTop: 3 }}>
                      {d.code} · {d.day}
                    </Kick>
                  </View>

                  {/* Wave % + twins count (right side) */}
                  <View style={{ alignItems: 'flex-end' }}>
                    <GradientText
                      style={{
                        fontFamily: fontFamily.disp,
                        fontSize: 22,
                        lineHeight: 24,
                        textAlign: 'right',
                      }}
                    >
                      {`${d.wave}%`}
                    </GradientText>
                    <Kick style={{ marginTop: 2 }}>
                      {d.twins} 👯
                    </Kick>
                  </View>

                  {/* Chevron */}
                  <Icon d={ICONS.chevR} size={17} color={colors.inkMute} />
                </Card>
              </Press>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
