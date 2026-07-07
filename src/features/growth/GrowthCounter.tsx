import React from 'react';
import { Text, View } from 'react-native';
import GradientText from '../../components/GradientText';
import { Kick } from '../../components/Text';
import { colors } from '../../design/tokens';
import { fontFamily } from '../../design/typography';
import { FLAGS, useFlag } from '../../lib/flags';
import { counterUnit } from './growthLogic';

/**
 * V2 F5: the Us tab's hero stat (V2_PLAN §10 — exact order: avatars/name/
 * streak → THIS → Wrapped card → wavelength, demoted). One full-width
 * GradientText number: "23 things you now know about each other". Private
 * solo insights are badged separately; zero learnings renders the warm
 * empty state, never a blank. Behind f5_growth_counter.
 */
export function GrowthCounter({
  count,
  privateCount,
}: {
  count: number;
  privateCount: number;
}) {
  const flagOn = useFlag(FLAGS.F5_GROWTH_COUNTER);
  if (!flagOn) return null;

  return (
    <View
      style={{ alignItems: 'center', marginTop: 16 }}
      accessibilityRole="text"
      accessibilityLabel={
        count === 0
          ? 'Your map starts with tonight’s drop'
          : `${count} ${counterUnit(count)}`
      }
      testID="growth-counter"
    >
      {count === 0 ? (
        <Text
          style={{
            fontSize: 14.5,
            lineHeight: 21,
            color: colors.inkSoft,
            fontFamily: fontFamily.ui,
            textAlign: 'center',
          }}
        >
          your map starts with tonight’s drop 🗺️
        </Text>
      ) : (
        <>
          <GradientText
            style={{
              fontFamily: fontFamily.disp,
              fontSize: 54,
              lineHeight: 58,
              paddingHorizontal: 4,
            }}
          >
            {String(count)}
          </GradientText>
          <Kick c={colors.inkMute} style={{ marginTop: 2 }}>
            {counterUnit(count)}
          </Kick>
          {privateCount > 0 && (
            <Text
              style={{
                marginTop: 5,
                fontSize: 12,
                lineHeight: 16,
                color: colors.inkSoft,
                fontFamily: fontFamily.ui,
              }}
            >
              {privateCount === 1
                ? '1 of them just for you 🔒'
                : `${privateCount} of them just for you 🔒`}
            </Text>
          )}
        </>
      )}
    </View>
  );
}
