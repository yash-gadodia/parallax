import React, { useEffect } from 'react';
import { View, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Peek } from '../src/components/Peek';
import { Kick, Serif } from '../src/components/Text';
import { DawnBlobs } from '../src/components/DawnBlobs';
import { colors, gradients, space } from '../src/design/tokens';
import { useSession } from '../src/features/auth/useSession';
import { useCouple } from '../src/features/pairing/useCouple';
import { useDropState } from '../src/features/drops/useDropState';

export default function WaitingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session } = useSession();
  const { couple } = useCouple();
  const blobAnim = React.useRef(new Animated.Value(0)).current;
  const dotAnims = React.useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  // If we have session + couple, use real-time polling for couple_drop state
  // We store couplDropId from session/couple context if available
  // For now, pass null to useDropState to fall back to timer
  const { coupleDrop } = useDropState(null);

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

    // If supabase connected and couple_drop revealed, go to reveal immediately
    if (session && coupleDrop?.state === 'revealed') {
      router.replace('/reveal');
      return;
    }

    // Otherwise fall back to timer (2.6s for demo)
    const timer = setTimeout(() => {
      router.replace('/reveal');
    }, 2600);

    return () => clearTimeout(timer);
  }, [router, blobAnim, dotAnims, session, coupleDrop?.state]);

  return (
    <LinearGradient
      colors={gradients.dawn.colors}
      locations={gradients.dawn.locations}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <DawnBlobs />

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
          {/* Animated soft background blob (pxfloat 3.5s) */}
          <Animated.View
            style={{
              position: 'absolute',
              width: 120,
              height: 120,
              borderRadius: 999,
              opacity: blobAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.08, 0.16],
              }),
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

          {/* Peek (search mood) with animation (pxfloat 4s) */}
          <Peek size={128} mood="search" />
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
                      outputRange: [0, -4, 0],
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
