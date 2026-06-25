import React, { useEffect } from 'react';
import { View, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Peek } from '../src/components/Peek';
import { Float } from '../src/components/Float';
import Press from '../src/components/Press';
import { Icon, ICONS } from '../src/components/Icon';
import { Kick, Serif } from '../src/components/Text';
import { DawnBlobs } from '../src/components/DawnBlobs';
import { colors, gradients, space } from '../src/design/tokens';
import { useSession } from '../src/features/auth/useSession';
import { useCouple } from '../src/features/pairing/useCouple';
import { useDropState } from '../src/features/drops/useDropState';
import { usePlayStore } from '../src/store/play';

export default function WaitingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session } = useSession();
  const { couple } = useCouple();
  const coupleDropId = usePlayStore((s) => s.coupleDropId);
  const blobAnim = React.useRef(new Animated.Value(0)).current;
  const dotAnims = React.useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  // When session+couple exists, pass the real coupleDropId so we subscribe to
  // real-time state changes and advance only when state becomes 'revealed'.
  // In demo mode (no session) coupleDropId is null — useDropState returns null state.
  const { coupleDrop } = useDropState(session && couple ? coupleDropId : null);

  const isLive = !!(session && couple);

  useEffect(() => {
    // Animate blob (pxfloat 3.5s)
    Animated.loop(
      Animated.sequence([
        Animated.timing(blobAnim, {
          toValue: 1,
          duration: 1750,
          useNativeDriver: false,
        }),
        Animated.timing(blobAnim, {
          toValue: 0,
          duration: 1750,
          useNativeDriver: false,
        }),
      ])
    ).start();

    // Animate dots with stagger
    dotAnims.forEach((anim, i) => {
      setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 1,
              duration: 600,
              useNativeDriver: false,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 600,
              useNativeDriver: false,
            }),
          ])
        ).start();
      }, i * 180);
    });

    // Live path: advance only when couple_drops.state flips to 'revealed'.
    // No timer — we wait for the real partner (or sim_partner_submit to flip state).
    if (isLive) {
      if (coupleDrop?.state === 'revealed') {
        router.replace('/reveal');
      }
      return;
    }

    // Demo path (no session): fall back to a 2.6s timer so the demo still works.
    const timer = setTimeout(() => {
      router.replace('/reveal');
    }, 2600);

    return () => clearTimeout(timer);
  }, [router, blobAnim, dotAnims, isLive, coupleDrop?.state]);

  return (
    <LinearGradient
      colors={gradients.dawn.colors}
      locations={gradients.dawn.locations}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <DawnBlobs />

      {/* Back to Today — your answers are already saved; don't trap the user here. */}
      <Press
        onPress={() => router.replace('/(tabs)/today')}
        scale={false}
        style={{
          position: 'absolute',
          top: insets.top + 8,
          left: 18,
          zIndex: 30,
          width: 38,
          height: 38,
          borderRadius: 999,
          backgroundColor: colors.surfaceSoft,
          borderWidth: 1,
          borderColor: colors.line,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Icon d={ICONS.back} size={20} color={colors.ink} />
      </Press>

      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: space.gutter,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        }}
      >
        {/* Pulsing background blob + Peek centered */}
        <View
          style={{
            position: 'relative',
            width: 150,
            height: 120,
            marginBottom: 26,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {/* Soft background blob - gentle vertical float (pxfloat 3.5s) */}
          <Animated.View
            style={{
              position: 'absolute',
              width: 120,
              height: 120,
              borderRadius: 999,
              opacity: 0.13,
              transform: [
                {
                  translateY: blobAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -7],
                  }),
                },
              ],
            }}
          >
            <LinearGradient
              colors={gradients.usSoft.colors}
              locations={gradients.usSoft.locations}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ width: 120, height: 120, borderRadius: 999 }}
            />
          </Animated.View>

          {/* Peek (search mood) - gentle float (pxfloat 4s) */}
          <Float distance={7} duration={4000}>
            <Peek size={128} mood="search" />
          </Float>
        </View>

        {/* Status label */}
        <Kick c={colors.p2Deep}>
          you're in ✓
        </Kick>

        {/* Main heading */}
        <Serif
          s={34}
          italic
          c={colors.ink}
          style={{ marginTop: 12, marginBottom: 10, textAlign: 'center' }}
        >
          looking for Dani…
        </Serif>

        {/* Description text */}
        <View style={{ maxWidth: 268, marginBottom: 26, marginTop: 0 }}>
          <Kick
            c={colors.inkSoft}
            style={{ fontSize: 15, lineHeight: 22, textAlign: 'center' }}
          >
            Your two views are still apart. The moment Dani plays, they snap into focus, that's the reveal.
          </Kick>
        </View>

        {/* Three floating dots animation */}
        <View
          style={{
            flexDirection: 'row',
            gap: 6,
            justifyContent: 'center',
            marginTop: 26,
          }}
        >
          {[0, 1, 2].map((i) => (
            <Animated.View
              key={i}
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                backgroundColor: colors.p2,
                opacity: dotAnims[i].interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.3, 1, 0.3],
                }),
                transform: [
                  {
                    translateY: dotAnims[i].interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0, -7, 0],
                    }),
                  },
                ],
              }}
            />
          ))}
        </View>
      </View>
    </LinearGradient>
  );
}
