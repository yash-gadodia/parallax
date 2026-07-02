import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { safeBack } from "../../src/lib/nav";
import Sheet from '../../src/components/Sheet';
import Btn from '../../src/components/Btn';
import { presentPaywall } from '../../src/features/purchases/usePurchases';
import { purchasesAvailable } from '../../src/features/purchases/client';
import Press from '../../src/components/Press';
import { Serif } from '../../src/components/Text';
import { colors, space, radius, gradients } from '../../src/design/tokens';
import { fontFamily } from '../../src/design/typography';
import { useIdentity } from '../../src/features/profile/useIdentity';

const perks = [
  {
    emoji: '🎁',
    title: 'Every themed pack',
    desc: 'Deep end, After dark, Chaos hour & more',
  },
  {
    emoji: '♾️',
    title: 'Unlimited drops',
    desc: 'Send each other questions any time',
  },
  {
    emoji: '📈',
    title: 'Full wavelength history',
    desc: 'Every reveal, kept forever',
  },
];

export default function PlusSheet() {
  const router = useRouter();
  const { partner } = useIdentity();

  const handleStart = async () => {
    // Real build: present RevenueCat's hosted paywall; on unlock → success.
    // Expo Go / no SDK: fall back to the in-app Checkout screen.
    if (purchasesAvailable()) {
      const unlocked = await presentPaywall();
      router.replace(unlocked ? '/plusSuccess' : '/checkout');
      return;
    }
    router.replace('/checkout');
  };

  const handleMaybeLater = () => {
    safeBack(router);
  };

  return (
    <Sheet title="parallax plus" onClose={handleMaybeLater}>
      <ScrollView scrollEnabled={false}>
        <View style={{ alignItems: 'center', marginBottom: 18 }}>
          <Serif s={34} italic c={colors.ink}>
            One sub, both of you.
          </Serif>
          <Text
            allowFontScaling={false}
            style={{
              fontSize: 14,
              lineHeight: 14 * 1.4,
              color: colors.inkSoft,
              marginTop: 4,
              fontFamily: fontFamily.ui,
            }}
          >
            {`$4.99/mo or $79.99 lifetime · one price covers you and ${partner.name}`}
          </Text>
        </View>

        <View style={{ flexDirection: 'column', gap: 14, marginBottom: 20 }}>
          {perks.map((perk, i) => (
            <View key={i} style={{ display: 'flex', flexDirection: 'row', gap: 13, alignItems: 'center' }}>
              <LinearGradient
                colors={gradients.usSoft.colors}
                locations={gradients.usSoft.locations}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 13,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                <Text
                  allowFontScaling={false}
                  style={{
                    fontSize: 20,
                    lineHeight: 20,
                    color: colors.ink,
                  }}
                >
                  {perk.emoji}
                </Text>
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text
                  allowFontScaling={false}
                  style={{
                    fontSize: 15,
                    fontWeight: '700',
                    lineHeight: 20,
                    color: colors.ink,
                    fontFamily: fontFamily.ui,
                  }}
                >
                  {perk.title}
                </Text>
                <Text
                  allowFontScaling={false}
                  style={{
                    fontSize: 13,
                    lineHeight: 13 * 1.4,
                    color: colors.inkSoft,
                    marginTop: 1,
                    fontFamily: fontFamily.ui,
                  }}
                >
                  {perk.desc}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <Btn kind="us" onPress={handleStart} sub="then $4.99/mo">
          Start 7 days free
        </Btn>

        <Press onPress={handleMaybeLater}>
          <View style={{ alignItems: 'center', paddingVertical: 10, marginTop: 4 }}>
            <Text
              allowFontScaling={false}
              style={{
                fontSize: 13.5,
                fontWeight: '600',
                lineHeight: 18,
                color: colors.inkMute,
                fontFamily: fontFamily.ui,
              }}
            >
              Maybe later
            </Text>
          </View>
        </Press>
      </ScrollView>
    </Sheet>
  );
}
