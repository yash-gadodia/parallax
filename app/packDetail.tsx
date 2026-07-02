import React from 'react';
import {
  View,
  Text,
  ScrollView,
  ViewStyle,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { safeBack } from "../src/lib/nav";
import { usePurchases } from '../src/features/purchases/usePurchases';
import { SafeAreaView, useSafeAreaInsets  } from 'react-native-safe-area-context';
import { PACKS, PACK_SAMPLE } from '../src/content/extras';
import { colors, gradients, radius, shadows, space } from '../src/design/tokens';
import { fontFamily } from '../src/design/typography';
import { Kick, Serif } from '../src/components/Text';
import TopBar from '../src/components/TopBar';
import Card from '../src/components/Card';
import Btn from '../src/components/Btn';
import Press from '../src/components/Press';
import { Icon, ICONS } from '../src/components/Icon';
import { useIdentity } from '../src/features/profile/useIdentity';

export default function PackDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { partner } = useIdentity();

  // Resolve pack ID from params, fallback to 'deep'
  const packId = typeof params.id === 'string' ? params.id : 'deep';
  const pack = PACKS.find((p) => p.id === packId);
  const samples = PACK_SAMPLE[packId] || [];

  const plus = usePurchases((s) => s.isPro);
  const locked = pack && pack.locked && !plus;

  const handleBack = () => {
    safeBack(router);
  };

  const handleUnlockPlus = () => {
    router.push('/checkout');
  };

  if (!pack) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg0 }}>
        <LinearGradient
          colors={gradients.dawn.colors}
          locations={gradients.dawn.locations}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ position: 'absolute', inset: 0 }}
        />
        <TopBar title="pack" onBack={handleBack} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: colors.inkSoft }}>Pack not found</Text>
        </View>
      </View>
    );
  }

  // Convert tint from 'var(--p2)' format to actual color hex
  const tintMap: Record<string, string> = {
    'var(--p2)': colors.p2,
    'var(--p1)': colors.p1,
    'var(--match)': colors.match,
    'var(--p2-deep)': colors.p2Deep,
  };
  const tintColor = tintMap[pack.tint] || colors.p2;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg0 }}>
      <LinearGradient
        colors={gradients.dawn.colors}
        locations={gradients.dawn.locations}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', inset: 0 }}
      />

      <TopBar title="pack" onBack={handleBack} />

      <ScrollView
        contentContainerStyle={{
          paddingBottom: 140,
        }}
        scrollEnabled={true}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <View style={{ height: 44 }} />

          {/* Hero Card: tint bg + emoji + tag + title + badge */}
          <View
            style={{
              marginHorizontal: space.gutter,
              borderRadius: radius.card,
              overflow: 'hidden',
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.line,
              ...shadows.shadow,
            }}
          >
            {/* Tinted hero section with emoji + title */}
            <View
              style={{
                height: 150,
                backgroundColor: tintColor,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Radial gradient overlay (top-right highlight) */}
              <LinearGradient
                colors={['rgba(255,255,255,0.55)', 'transparent']}
                locations={[0, 0.6]}
                start={{ x: 1.5, y: -0.2 }}
                end={{ x: 0, y: 1 }}
                style={{
                  position: 'absolute',
                  inset: 0,
                }}
              />

              {/* Emoji (bottom-right) */}
              <Text
                allowFontScaling={false}
                style={{
                  position: 'absolute',
                  right: 16,
                  bottom: -8,
                  fontSize: 86,
                  lineHeight: 86,
                }}
              >
                {pack.emoji}
              </Text>

              {/* Tag + Title (bottom-left) */}
              <View
                style={{
                  position: 'absolute',
                  left: 20,
                  bottom: 16,
                }}
              >
                <Kick
                  c="rgba(255,255,255,0.9)"
                  style={{ marginBottom: 4 }}
                >
                  {pack.tag}
                </Kick>
                <Serif
                  s={40}
                  c="#fff"
                  style={{ marginTop: 4, lineHeight: 40 * 1.09 }}
                >
                  {pack.title}
                </Serif>
              </View>

              {/* FREE / PLUS badge (top-right) */}
              {locked ? (
                <View
                  style={{
                    position: 'absolute',
                    top: 14,
                    right: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                    paddingHorizontal: 11,
                    paddingVertical: 6,
                    borderRadius: radius.pill,
                    backgroundColor: 'rgba(0,0,0,0.22)',
                  }}
                >
                  <Icon d={ICONS.lock} size={13} color="#fff" sw={1.6} />
                  <Text
                    allowFontScaling={false}
                    style={{
                      fontFamily: fontFamily.mono,
                      fontSize: 10,
                      fontWeight: '700',
                      letterSpacing: 0.1,
                      color: '#fff',
                    }}
                  >
                    PLUS
                  </Text>
                </View>
              ) : (
                <View
                  style={{
                    position: 'absolute',
                    top: 14,
                    right: 14,
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: radius.pill,
                    backgroundColor: 'rgba(84,194,160,0.9)',
                  }}
                >
                  <Text
                    allowFontScaling={false}
                    style={{
                      fontFamily: fontFamily.mono,
                      fontSize: 9,
                      fontWeight: '700',
                      letterSpacing: 0.1,
                      color: '#fff',
                    }}
                  >
                    FREE
                  </Text>
                </View>
              )}
            </View>

            {/* Description */}
            <View style={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 20 }}>
              <Text
                allowFontScaling={false}
                style={{
                  fontSize: 15,
                  lineHeight: 15 * 1.5,
                  color: colors.inkSoft,
                  fontFamily: fontFamily.ui,
                  fontWeight: '400',
                }}
              >
                {locked
                  ? `A themed drop for when you want to go there. Unlock Plus to peek at every question inside — drops like these land in your daily rotation.`
                  : `Nothing to send — drops like these land in your daily rotation, and you and ${partner.name} both answer + place hunches, same as always.`}
              </Text>
            </View>
          </View>

          {/* "What's inside" section */}
          <View style={{ marginHorizontal: space.gutter, marginTop: 22, marginBottom: 12 }}>
            <Kick style={{ marginBottom: 8 }}>what's inside</Kick>
          </View>

          {/* Sample questions list */}
          <View
            style={{
              marginHorizontal: space.gutter,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {samples.map((question, i) => (
              <Card
                key={i}
                style={{
                  paddingVertical: 15,
                  paddingHorizontal: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  opacity: locked && i > 0 ? 0.7 : 1,
                }}
              >
                {/* Question number */}
                <Text
                  allowFontScaling={false}
                  style={{
                    fontFamily: fontFamily.disp,
                    fontSize: 20,
                    lineHeight: 20 * 1.1,
                    color: tintColor,
                    width: 22,
                    fontWeight: '600',
                  }}
                >
                  {i + 1}
                </Text>

                {/* Question text */}
                <Text
                  allowFontScaling={false}
                  style={{
                    flex: 1,
                    fontSize: 15,
                    fontWeight: '600',
                    lineHeight: 15 * 1.4,
                    color: colors.ink,
                    fontFamily: fontFamily.ui,
                  }}
                >
                  {question}
                </Text>

                {/* Blur effect for locked questions (beyond first) */}
                {locked && i > 0 && (
                  <BlurView
                    intensity={14}
                    tint="light"
                    pointerEvents="none"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: radius.tile,
                      overflow: 'hidden',
                    }}
                  />
                )}
              </Card>
            ))}
          </View>
        </SafeAreaView>
      </ScrollView>

      {/* Floating CTA Button */}
      <View
        style={{
          position: 'absolute',
          left: 20,
          right: 20,
          bottom: 22 + insets.bottom,
          zIndex: 40,
        }}
      >
        {locked ? (
          <Btn kind="us" onPress={handleUnlockPlus} sub="7 days free">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Icon d={ICONS.lock} size={17} color="#fff" sw={1.6} />
              <Text
                allowFontScaling={false}
                style={{
                  fontSize: 16.5,
                  fontWeight: '700',
                  color: '#fff',
                  fontFamily: fontFamily.ui,
                }}
              >
                Unlock with Plus
              </Text>
            </View>
          </Btn>
        ) : (
          /* No fake sends: drops arrive through the daily rotation, so the
             honest state here is a note, not a button. */
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              paddingVertical: 16,
              paddingHorizontal: 18,
              borderRadius: radius.pill,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.line,
              ...shadows.shadow,
            }}
          >
            <Icon d={ICONS.spark} size={16} color={colors.p2Deep} sw={1.6} />
            <Text
              allowFontScaling={false}
              style={{
                flex: 1,
                fontSize: 13.5,
                lineHeight: 13.5 * 1.4,
                fontWeight: '600',
                color: colors.inkSoft,
                fontFamily: fontFamily.ui,
              }}
            >
              {pack.id === 'spicy'
                ? `these join your rotation once you and ${partner.name} both set your spice to spicy`
                : `these land in your daily rotation — no sending needed`}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
