import React from 'react';
import {
  View,
  ScrollView,
  Text,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets  } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { safeBack } from "../src/lib/nav";
import { PACKS } from '../src/content/extras';
import { colors, gradients, radius, shadows, space } from '../src/design/tokens';
import { Kick, Serif } from '../src/components/Text';
import Press from '../src/components/Press';
import Btn from '../src/components/Btn';
import TopBar from '../src/components/TopBar';
import { Icon, ICONS } from '../src/components/Icon';
import { DawnBlobs } from '../src/components/DawnBlobs';
import { usePurchases } from '../src/features/purchases/usePurchases';
import { useIdentity } from '../src/features/profile/useIdentity';

export default function PacksScreen() {
  const router = useRouter();
  const plus = usePurchases((s) => s.isPro);
  const insets = useSafeAreaInsets();
  const { partner } = useIdentity();

  const handlePackPress = (packId: string) => {
    router.push(`/packDetail?id=${packId}`);
  };

  const handleTryPlus = () => {
    router.push('/checkout');
  };

  const handleManagePlus = () => {
    router.push('/manageSub');
  };

  const handleBack = () => {
    safeBack(router);
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
        {/* TopBar with back button */}
        <TopBar title="PACKS" onBack={handleBack} />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: space.gutter,
            paddingTop: 52 + 8,
            paddingBottom: insets.bottom + space.gutter,
          }}
        >
          {/* Title */}
          <View style={{ marginTop: 6, marginBottom: 6 }}>
            <Serif s={40} c={colors.ink}>
              Packs
            </Serif>
          </View>

          {/* Description copy */}
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 15,
                lineHeight: 15 * 1.47,
                color: colors.inkSoft,
              }}
            >
              {plus ? (
                <>
                  {'You\'re '}
                  <Text
                    style={{
                      color: colors.p2Deep,
                      fontWeight: '700',
                      lineHeight: 15 * 1.47,
                    }}
                  >
                    Plus
                  </Text>
                  {`, every pack is open to browse — their questions land in your daily rotation with ${partner.name}.`}
                </>
              ) : (
                <>
                  {`Themed questions that land in your daily rotation with ${partner.name} — Deep end's open to browse, the rest are `}
                  <Text
                    style={{
                      color: colors.p1Deep,
                      fontWeight: '700',
                      lineHeight: 15 * 1.47,
                    }}
                  >
                    Plus
                  </Text>
                  {'.'}
                </>
              )}
            </Text>
          </View>

          {/* 2-column grid of packs */}
          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              gap: space.gap,
              marginBottom: 16,
            }}
          >
            {/* Left column */}
            <View style={{ flex: 1, gap: space.gap }}>
              {PACKS.filter((_, i) => i % 2 === 0).map((pk) => (
                <PackCard
                  key={pk.id}
                  pack={pk}
                  onPress={() => handlePackPress(pk.id)}
                  isLocked={pk.locked && !plus}
                />
              ))}
            </View>

            {/* Right column */}
            <View style={{ flex: 1, gap: space.gap }}>
              {PACKS.filter((_, i) => i % 2 === 1).map((pk) => (
                <PackCard
                  key={pk.id}
                  pack={pk}
                  onPress={() => handlePackPress(pk.id)}
                  isLocked={pk.locked && !plus}
                />
              ))}
            </View>
          </View>

          {/* Plus upsell card */}
          <LinearGradient
            colors={gradients.usSoft.colors}
            locations={gradients.usSoft.locations}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderWidth: 1,
              borderColor: 'rgba(157,149,245,0.25)',
              borderRadius: radius.card,
              padding: 20,
              marginBottom: 0,
              overflow: 'hidden',
            }}
          >
            {plus ? (
              <>
                <Kick c={colors.matchDeep}>● plus active</Kick>
                <Serif
                  s={26}
                  c={colors.ink}
                  style={{ marginTop: 8, marginBottom: 6 }}
                >
                  You're all unlocked.
                </Serif>
                <Text
                  style={{
                    fontSize: 14,
                    lineHeight: 14 * 1.5,
                    color: colors.inkSoft,
                    marginBottom: 16,
                  }}
                >
                  {`Every pack, unlimited drops, full history, shared with ${partner.name}. Manage anytime in settings.`}
                </Text>
                <Btn kind="soft" onPress={handleManagePlus}>
                  Manage Plus
                </Btn>
              </>
            ) : (
              <>
                <Kick c={colors.p2Deep}>parallax plus</Kick>
                <Serif
                  s={26}
                  c={colors.ink}
                  style={{ marginTop: 8, marginBottom: 6 }}
                >
                  One sub, both of you.
                </Serif>
                <Text
                  style={{
                    fontSize: 14,
                    lineHeight: 14 * 1.5,
                    color: colors.inkSoft,
                    marginBottom: 16,
                  }}
                >
                  {`Every pack, unlimited drops, your full wavelength history. $4.99/mo, covers you and ${partner.name}.`}
                </Text>
                <Btn
                  kind="us"
                  onPress={handleTryPlus}
                  sub="7 days free"
                >
                  Try Plus
                </Btn>
              </>
            )}
          </LinearGradient>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

interface PackCardProps {
  pack: typeof PACKS[0];
  onPress: () => void;
  isLocked: boolean;
}

function PackCard({ pack, onPress, isLocked }: PackCardProps) {
  return (
    <Press onPress={onPress}>
      <View
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.line,
          borderRadius: 24,
          padding: 16,
          minHeight: 156,
          justifyContent: 'space-between',
          overflow: 'hidden',
          ...shadows.shadowSoft,
        }}
      >
        {/* Decorative tint blob in background */}
        <View
          style={{
            position: 'absolute',
            top: -30,
            right: -30,
            width: 110,
            height: 110,
            borderRadius: 999,
            backgroundColor: pack.tint,
            opacity: 0.14,
          }}
        />

        {/* Content */}
        <View style={{ position: 'relative', zIndex: 1 }}>
          {/* Emoji */}
          <Text style={{ fontSize: 34, marginBottom: 0 }}>
            {pack.emoji}
          </Text>
        </View>

        {/* Title and tag */}
        <View>
          <Serif s={24} c={colors.ink}>
            {pack.title}
          </Serif>
          <Kick c={colors.inkMute} style={{ marginTop: 5 }}>
            {pack.tag}
          </Kick>
        </View>

        {/* Lock/FREE badge in top-right */}
        <View
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 2,
          }}
        >
          {isLocked ? (
            <Icon d={ICONS.lock} size={15} color={colors.inkMute} />
          ) : (
            <View
              style={{
                backgroundColor: 'rgba(84,194,160,0.16)',
                paddingHorizontal: 7,
                paddingVertical: 3,
                borderRadius: 999,
              }}
            >
              <Text
                style={{
                  fontSize: 8.5,
                  fontWeight: '700',
                  letterSpacing: 0.85,
                  textTransform: 'uppercase',
                  color: colors.matchDeep,
                }}
              >
                FREE
              </Text>
            </View>
          )}
        </View>
      </View>
    </Press>
  );
}
