import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DawnBlobs } from '../../src/components/DawnBlobs';
import { Serif, Kick } from '../../src/components/Text';
import Press from '../../src/components/Press';
import Card from '../../src/components/Card';
import Chip from '../../src/components/Chip';
import { Peek } from '../../src/components/Peek';
import { Float } from '../../src/components/Float';
import { colors, gradients, space } from '../../src/design/tokens';
import { fontFamily } from '../../src/design/typography';
import { useCouple } from '../../src/features/pairing/useCouple';
import { useLearnings } from '../../src/features/lovemap/useLearnings';
import { useRefocusRecord } from '../../src/features/refocus/useRefocusRecord';

function shortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

// The couple's record: what they came through, and what they learned from it.
// This is also exactly what the mediator reads before it mediates — showing it
// is the trust story, not a feature.
export default function MemoryScreen() {
  const router = useRouter();
  const { couple } = useCouple();
  const { items: learnings, isSample } = useLearnings();
  const { sessions, loading } = useRefocusRecord(couple?.id ?? null);

  const realLearnings = isSample ? [] : learnings;
  const resolved = sessions.filter((s) => s.state === 'revealed');
  const empty = !loading && resolved.length === 0 && realLearnings.length === 0;

  return (
    <LinearGradient
      colors={gradients.dawn.colors}
      locations={gradients.dawn.locations}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1, backgroundColor: colors.bg0 }}
    >
      <DawnBlobs />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: space.gutter,
            paddingTop: 12,
            paddingBottom: 140,
          }}
        >
          <Kick>your record</Kick>
          <Serif s={34} style={{ marginTop: 8, marginBottom: 18, lineHeight: 34 * 1.08 }}>
            What you two came through.
          </Serif>

          {empty && (
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <Float>
                <Peek size={88} mood="search" />
              </Float>
              <Text
                style={{
                  fontSize: 15,
                  color: colors.inkSoft,
                  textAlign: 'center',
                  marginTop: 20,
                  maxWidth: 290,
                  lineHeight: 15 * 1.55,
                  fontFamily: fontFamily.ui,
                }}
              >
                Nothing here yet, which is a fine place to be. Your first repair
                starts the record.
              </Text>
            </View>
          )}

          {resolved.length > 0 && (
            <View style={{ gap: 12, marginBottom: 28 }}>
              {resolved.map((s) => (
                <Card key={s.id} style={{ borderRadius: 20, padding: 16 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 6,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 15.5,
                        fontWeight: '700',
                        color: colors.ink,
                        flex: 1,
                        fontFamily: fontFamily.ui,
                      }}
                    >
                      {s.topic}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12.5,
                        color: colors.inkMute,
                        marginLeft: 10,
                        fontFamily: fontFamily.ui,
                      }}
                    >
                      {shortDate(s.created_at)}
                    </Text>
                  </View>

                  {s.summary ? (
                    <Text
                      style={{
                        fontSize: 14,
                        color: colors.inkSoft,
                        lineHeight: 14 * 1.55,
                        fontFamily: fontFamily.ui,
                      }}
                    >
                      {s.summary}
                    </Text>
                  ) : (
                    <Text
                      style={{
                        fontSize: 14,
                        color: colors.inkMute,
                        fontStyle: 'italic',
                        fontFamily: fontFamily.ui,
                      }}
                    >
                      You found the middle ground on this one.
                    </Text>
                  )}

                  {!!s.themes?.length && (
                    <View
                      style={{
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        gap: 6,
                        marginTop: 12,
                      }}
                    >
                      {s.themes.map((t) => (
                        <Chip key={t} soft>
                          {t}
                        </Chip>
                      ))}
                    </View>
                  )}
                </Card>
              ))}
            </View>
          )}

          {realLearnings.length > 0 && (
            <>
              <Kick>what you now know</Kick>
              <View style={{ gap: 10, marginTop: 10 }}>
                {realLearnings.map((l) => (
                  <Press key={l.id} onPress={() => router.push('/lovemap')}>
                    <Card
                      style={{
                        borderRadius: 18,
                        padding: 14,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                      }}
                    >
                      <Text style={{ fontSize: 22 }}>{l.emoji ?? '💡'}</Text>
                      <Text
                        style={{
                          flex: 1,
                          fontSize: 14.5,
                          color: colors.ink,
                          lineHeight: 14.5 * 1.5,
                          fontFamily: fontFamily.ui,
                        }}
                      >
                        {l.need ?? l.detail}
                      </Text>
                    </Card>
                  </Press>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
