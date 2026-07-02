import React, { useState } from 'react';
import { Redirect } from 'expo-router';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Wordmark, Slashes } from '../src/components/Wordmark';
import { Mark } from '../src/components/Mark';
import { Peek } from '../src/components/Peek';
import { Ring } from '../src/components/Ring';
import GradientText from '../src/components/GradientText';
import Btn from '../src/components/Btn';
import Chip from '../src/components/Chip';
import Tok from '../src/components/Tok';
import Stat from '../src/components/Stat';
import { Kick, Serif } from '../src/components/Text';
import Sheet from '../src/components/Sheet';
import Toast from '../src/components/Toast';
import Press from '../src/components/Press';
import { colors, gradients, space } from '../src/design/tokens';
import { useUiStore } from '../src/store/ui';

function GallerySection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ marginBottom: 32, paddingHorizontal: space.gutter }}>
      <Text
        style={{
          fontSize: 12,
          fontWeight: '700',
          letterSpacing: 1.8,
          textTransform: 'uppercase',
          color: colors.inkMute,
          marginBottom: 12,
        }}
      >
        {title}
      </Text>
      <View
        style={{
          display: 'flex',
          gap: 12,
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
        }}
      >
        {children}
      </View>
    </View>
  );
}

export default function Gallery() {
  const insets = useSafeAreaInsets();
  const [wordmarkOffset, setWordmarkOffset] = useState(false);
  const [ringKey, setRingKey] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const { toast, fireToast } = useUiStore();

  // Dev-only component storybook — never a reachable surface in production.
  if (!__DEV__) {
    return <Redirect href="/" />;
  }

  return (
    <LinearGradient
      colors={gradients.dawn.colors}
      locations={gradients.dawn.locations}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={{ flex: 1, paddingTop: insets.top }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      >
        {/* Wordmark */}
        <GallerySection title="Wordmark">
          <View style={{ gap: 12, width: '100%' }}>
            <View>
              <Wordmark size={25} offset={wordmarkOffset} />
            </View>
            <Press
              onPress={() => setWordmarkOffset(!wordmarkOffset)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                backgroundColor: colors.sunken,
                borderRadius: 8,
                alignSelf: 'flex-start',
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  color: colors.ink,
                  fontWeight: '600',
                }}
              >
                Toggle Offset
              </Text>
            </Press>
          </View>
        </GallerySection>

        {/* Mark */}
        <GallerySection title="Mark">
          <Mark size={26} />
        </GallerySection>

        {/* Peek Moods */}
        <GallerySection title="Peek Moods">
          <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
            <View style={{ alignItems: 'center', gap: 6 }}>
              <Peek size={88} mood="happy" />
              <Kick c={colors.inkMute}>Happy</Kick>
            </View>
            <View style={{ alignItems: 'center', gap: 6 }}>
              <Peek size={88} mood="focus" />
              <Kick c={colors.inkMute}>Focus</Kick>
            </View>
            <View style={{ alignItems: 'center', gap: 6 }}>
              <Peek size={88} mood="search" />
              <Kick c={colors.inkMute}>Search</Kick>
            </View>
            <View style={{ alignItems: 'center', gap: 6 }}>
              <Peek size={88} mood="love" />
              <Kick c={colors.inkMute}>Love</Kick>
            </View>
          </View>
        </GallerySection>

        {/* Ring at various percentages */}
        <GallerySection title="Ring Stages">
          <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
            <View style={{ alignItems: 'center', gap: 6 }}>
              <Ring key={`${ringKey}-0`} pct={0} size={140} animate={false} />
              <Kick c={colors.inkMute}>0%</Kick>
            </View>
            <View style={{ alignItems: 'center', gap: 6 }}>
              <Ring key={`${ringKey}-50`} pct={50} size={140} animate={false} />
              <Kick c={colors.inkMute}>50%</Kick>
            </View>
            <View style={{ alignItems: 'center', gap: 6 }}>
              <Ring key={`${ringKey}-83`} pct={83} size={140} animate={false} />
              <Kick c={colors.inkMute}>83%</Kick>
            </View>
            <View style={{ alignItems: 'center', gap: 6 }}>
              <Ring key={`${ringKey}-100`} pct={100} size={140} animate={false} />
              <Kick c={colors.inkMute}>100%</Kick>
            </View>
          </View>
          <Press
            onPress={() => setRingKey(ringKey + 1)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              backgroundColor: colors.sunken,
              borderRadius: 8,
              alignSelf: 'flex-start',
              marginTop: 12,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                color: colors.ink,
                fontWeight: '600',
              }}
            >
              Animate Ring
            </Text>
          </Press>
        </GallerySection>

        {/* GradientText */}
        <GallerySection title="Gradient Text">
          <GradientText
            style={{
              fontSize: 48,
              fontWeight: '400',
              lineHeight: 48,
              textAlign: 'left',
            }}
          >
            83%
          </GradientText>
        </GallerySection>

        {/* Buttons */}
        <GallerySection title="Buttons">
          <View style={{ width: '100%', gap: 12 }}>
            <Btn kind="ink">Ink Button</Btn>
            <Btn kind="us">Gradient Button</Btn>
            <Btn kind="coral">Coral Button</Btn>
            <Btn kind="soft">Soft Button</Btn>
            <Btn disabled>Disabled Button</Btn>
          </View>
        </GallerySection>

        {/* Chips */}
        <GallerySection title="Chips">
          <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
            <Chip you={false} soft={false}>
              Them Solid
            </Chip>
            <Chip you={false} soft={true}>
              Them Soft
            </Chip>
            <Chip you={true} soft={false}>
              You Solid
            </Chip>
            <Chip you={true} soft={true}>
              You Soft
            </Chip>
          </View>
        </GallerySection>

        {/* Tok */}
        <GallerySection title="Tok">
          <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
            <View style={{ alignItems: 'center', gap: 6 }}>
              <Tok who={{ initial: 'Y' }} size={40} you={true} />
              <Kick c={colors.inkMute}>You</Kick>
            </View>
            <View style={{ alignItems: 'center', gap: 6 }}>
              <Tok who={{ initial: 'T' }} size={40} you={false} />
              <Kick c={colors.inkMute}>Them</Kick>
            </View>
            <View style={{ alignItems: 'center', gap: 6 }}>
              <Tok who={{ initial: 'Y' }} size={40} you={true} ring={true} />
              <Kick c={colors.inkMute}>You (Ring)</Kick>
            </View>
            <View style={{ alignItems: 'center', gap: 6 }}>
              <Tok who={{ initial: 'T' }} size={40} you={false} ring={true} />
              <Kick c={colors.inkMute}>Them (Ring)</Kick>
            </View>
          </View>
        </GallerySection>

        {/* Stat */}
        <GallerySection title="Stat">
          <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap', width: '100%' }}>
            <View style={{ flex: 1, minWidth: 120 }}>
              <Stat big="42" label="Plain" grad={false} />
            </View>
            <View style={{ flex: 1, minWidth: 120 }}>
              <Stat big="83" label="Gradient" grad={true} />
            </View>
          </View>
        </GallerySection>

        {/* Typography */}
        <GallerySection title="Kick Typography">
          <Kick>Kick mono text</Kick>
        </GallerySection>

        <GallerySection title="Serif Typography">
          <View style={{ gap: 12, width: '100%' }}>
            <Serif s={34}>Regular Serif</Serif>
            <Serif s={34} italic={true}>
              Italic Serif
            </Serif>
          </View>
        </GallerySection>

        {/* Sheet trigger */}
        <GallerySection title="Sheet">
          <Btn kind="ink" onPress={() => setSheetOpen(true)}>
            Open Sheet
          </Btn>
        </GallerySection>

        {/* Toast trigger */}
        <GallerySection title="Toast">
          <Btn kind="us" onPress={() => fireToast('Hello from gallery!')}>
            Fire Toast
          </Btn>
        </GallerySection>
      </ScrollView>

      {/* Sheet Modal */}
      {sheetOpen && (
        <Sheet
          title="Gallery Sheet"
          onClose={() => setSheetOpen(false)}
        >
          <Text
            style={{
              fontSize: 14,
              color: colors.ink,
              lineHeight: 20,
              marginBottom: 16,
            }}
          >
            This is a modal sheet in the gallery. Tap outside or the close button to dismiss.
          </Text>
          <Btn kind="ink" onPress={() => setSheetOpen(false)}>
            Close
          </Btn>
        </Sheet>
      )}

      {/* Toast overlay */}
      {toast && <Toast msg={toast} />}
    </LinearGradient>
  );
}
