import { useState } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import Sheet from '../../src/components/Sheet';
import Press from '../../src/components/Press';
import Toast from '../../src/components/Toast';
import { Kick } from '../../src/components/Text';
import { Icon, ICONS } from '../../src/components/Icon';
import { colors, radius, shadows } from '../../src/design/tokens';
import { fontFamily } from '../../src/design/typography';

type SpiceLevel = 'Sweet' | 'Flirty' | 'Spicy';

const SPICE_OPTIONS: Array<{ level: SpiceLevel; emoji: string; desc: string }> = [
  { level: 'Sweet', emoji: '🍰', desc: 'Wholesome, no spice. Cozy and kind.' },
  { level: 'Flirty', emoji: '😏', desc: 'A little suggestive. Tasteful heat.' },
  { level: 'Spicy', emoji: '🌶️', desc: 'Bolder, after-dark prompts. 18+' },
];

export default function SpiceSheet() {
  const router = useRouter();
  const [showToast, setShowToast] = useState(false);
  const [current, setCurrent] = useState<SpiceLevel>('Flirty');

  const handlePick = (level: SpiceLevel) => {
    setCurrent(level);
    setShowToast(true);
    setTimeout(() => {
      router.back();
    }, 400);
  };

  return (
    <>
      <Sheet title="spice level" onClose={() => router.back()}>
        <Text
          allowFontScaling={false}
          style={{
            fontSize: 14,
            color: colors.inkSoft,
            textAlign: 'center',
            marginBottom: 16,
            lineHeight: 21,
            fontFamily: fontFamily.ui,
          }}
        >
          How bold should your daily questions get? You both see the same level, and you can change it anytime.
        </Text>
        <View style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {SPICE_OPTIONS.map(({ level, emoji, desc }) => {
            const isSelected = current === level;
            return (
              <Press key={level} onPress={() => handlePick(level)}>
                <View
                  style={[
                    {
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 13,
                      paddingVertical: 15,
                      paddingHorizontal: 16,
                      borderRadius: radius.tile,
                      backgroundColor: isSelected ? 'rgba(157, 149, 245, 0.16)' : colors.surface,
                      borderWidth: 1.5,
                      borderColor: isSelected ? colors.p2 : colors.line,
                    },
                    shadows.shadowSoft,
                  ]}
                >
                  <Text
                    allowFontScaling={false}
                    style={{
                      fontSize: 26,
                      lineHeight: 26,
                      color: colors.ink,
                    }}
                  >
                    {emoji}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text
                      allowFontScaling={false}
                      style={{
                        fontSize: 15.5,
                        fontWeight: '700',
                        color: colors.ink,
                        lineHeight: 19,
                        fontFamily: fontFamily.ui,
                      }}
                    >
                      {level}
                    </Text>
                    <Text
                      allowFontScaling={false}
                      style={{
                        fontSize: 12.5,
                        color: colors.inkSoft,
                        marginTop: 2,
                        lineHeight: 17.5,
                        fontFamily: fontFamily.ui,
                      }}
                    >
                      {desc}
                    </Text>
                  </View>
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: radius.pill,
                      borderWidth: 2,
                      borderColor: isSelected ? colors.p2Deep : colors.inkMute,
                      backgroundColor: isSelected ? colors.p2Deep : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isSelected && (
                      <Icon d={ICONS.check} size={12} color="#fff" sw={2.6} />
                    )}
                  </View>
                </View>
              </Press>
            );
          })}
        </View>
      </Sheet>
      {showToast && <Toast msg={`Spice level set to ${current}`} />}
    </>
  );
}
