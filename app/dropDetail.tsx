import React from 'react';
import {
  View,
  Text,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { safeBack } from "../src/lib/nav";
import { ARCHIVE } from '../src/content/drop';
import { colors, gradients, radius, shadows, space } from '../src/design/tokens';
import { fontFamily } from '../src/design/typography';
import { Kick, Serif } from '../src/components/Text';
import TopBar from '../src/components/TopBar';
import Card from '../src/components/Card';
import Chip from '../src/components/Chip';
import GradientText from '../src/components/GradientText';
import { DawnBlobs } from '../src/components/DawnBlobs';
import { useIdentity } from '../src/features/profile/useIdentity';

export default function DropDetailScreen() {
  const router = useRouter();
  const { partner } = useIdentity();
  const params = useLocalSearchParams();
  const code = typeof params.code === 'string' ? params.code : undefined;

  // Look up drop in ARCHIVE by code, fallback to first
  const drop = code ? ARCHIVE.find((x) => x.code === code) : null;
  const d = drop || ARCHIVE[0];

  const handleBack = () => {
    safeBack(router);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg0 }}>
      <LinearGradient
        colors={gradients.dawn.colors}
        locations={gradients.dawn.locations}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', inset: 0 }}
      />
      <DawnBlobs />

      <TopBar title={d.code} onBack={handleBack} />

      <ScrollView
        contentContainerStyle={{
          paddingBottom: 40,
        }}
        style={{ flex: 1 }}
        scrollEnabled={true}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <View style={{ height: 50 }} />

          {/* Header: emoji, title, day, wave */}
          <View style={{ alignItems: 'center', marginBottom: 8, paddingHorizontal: space.gutter }}>
            <Text
              allowFontScaling={false}
              style={{
                fontSize: 40,
                lineHeight: 44,
              }}
            >
              {d.emoji}
            </Text>
            <Serif
              s={36}
              italic
              c={colors.ink}
              style={{ marginTop: 4 }}
            >
              {d.title}
            </Serif>
            <Kick style={{ marginTop: 8 }}>{d.day}</Kick>

            {/* Wave % + in sync + twins */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'baseline',
                gap: 10,
                marginTop: 14,
              }}
            >
              <GradientText
                style={{
                  fontSize: 54,
                  lineHeight: 59,
                  fontFamily: fontFamily.disp,
                  letterSpacing: 0.005,
                }}
              >
                {`${d.wave}%`}
              </GradientText>
              <Text
                allowFontScaling={false}
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  lineHeight: 20,
                  color: colors.inkSoft,
                }}
              >
                in sync · {d.twins} twin{d.twins === 1 ? '' : 's'}
              </Text>
            </View>
          </View>

          {/* Rows */}
          <View style={{ marginTop: 18, paddingHorizontal: space.gutter }}>
            {d.rows.map((r, i) => {
              const twin = r[3]; // boolean: true when both same answer
              return (
                <Card
                  key={i}
                  style={{
                    paddingVertical: 15,
                    paddingHorizontal: 16,
                    borderRadius: 20,
                    marginBottom: i < d.rows.length - 1 ? 12 : 0,
                  }}
                >
                  {/* Question row */}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 12,
                    }}
                  >
                    <Text
                      allowFontScaling={false}
                      style={{
                        fontSize: 14.5,
                        fontWeight: '700',
                        lineHeight: 20,
                        color: colors.ink,
                        flex: 1,
                      }}
                    >
                      {r[0]}
                    </Text>
                    {twin && (
                      <Text
                        allowFontScaling={false}
                        style={{
                          fontSize: 16,
                          lineHeight: 20,
                          color: colors.ink,
                        }}
                      >
                        👯
                      </Text>
                    )}
                  </View>

                  {/* Chips side by side */}
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {/* YOU column */}
                    <View style={{ flex: 1 }}>
                      <Kick
                        c={colors.p1Deep}
                        style={{ marginBottom: 6 }}
                      >
                        you
                      </Kick>
                      <Chip you soft>
                        {r[1]}
                      </Chip>
                    </View>

                    {/* partner column */}
                    <View style={{ flex: 1 }}>
                      <Kick
                        c={colors.p2Deep}
                        style={{ marginBottom: 6 }}
                      >
                        {partner.name}
                      </Kick>
                      <Chip soft>
                        {r[2]}
                      </Chip>
                    </View>
                  </View>
                </Card>
              );
            })}
          </View>
        </SafeAreaView>
      </ScrollView>
    </View>
  );
}
