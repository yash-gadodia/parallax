import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import Btn from '../../src/components/Btn';
import Press from '../../src/components/Press';
import { Serif } from '../../src/components/Text';
import TopBar from '../../src/components/TopBar';
import { colors, space } from '../../src/design/tokens';
import { fontFamily } from '../../src/design/typography';
import {
  listReceipts,
  markSent,
  Receipt,
} from '../../src/features/refocus/receipts';

// Receipts exists to run the §7 test, not as a feature: what was logged, what
// was let go, and — as the user's own deliberate act — what was actually sent.
// No streaks, no counts, no scores.

function stateLine(r: Receipt): string {
  if (r.kind === 'saved') return 'Saved only · never read';
  if (r.outcome === 'no_bridge') return 'No bridge — let go';
  if (r.outcome === 'safety') return 'Stopped, with somewhere to turn';
  if (r.sentAt) return 'Sent · marked by you';
  if (r.copied) return 'Bridge copied';
  return 'Read';
}

export default function ReceiptsScreen() {
  const router = useRouter();
  const [rows, setRows] = useState<Receipt[]>([]);

  const refresh = useCallback(() => {
    listReceipts().then(setRows);
  }, []);
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const when = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }}>
      <TopBar title="receipts" onBack={() => router.back()} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: space.gutter,
          paddingTop: 80,
          paddingBottom: 40,
        }}
      >
        <Serif s={28} style={{ lineHeight: 28 * 1.13, marginBottom: 6 }}>
          What you&apos;ve logged.
        </Serif>

        {rows.length === 0 && (
          <Text
            style={{
              fontSize: 15,
              lineHeight: 15 * 1.5,
              color: colors.inkSoft,
              fontFamily: fontFamily.ui,
              marginTop: 12,
            }}
          >
            Nothing yet. The next time something happens, it lands here.
          </Text>
        )}

        {rows.map((r) => (
          <View
            key={r.id}
            style={{
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: colors.line,
              gap: 5,
            }}
          >
            <Text
              allowFontScaling={false}
              style={{
                fontFamily: fontFamily.mono,
                fontSize: 10,
                letterSpacing: 1.2,
                textTransform: 'uppercase',
                color: colors.inkMute,
              }}
            >
              {when(r.at)}
            </Text>
            <Text
              style={{
                fontSize: 16,
                lineHeight: 16 * 1.4,
                color: colors.ink,
                fontFamily: fontFamily.ui,
              }}
              numberOfLines={2}
            >
              {`“${r.snippet}”`}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text
                style={{
                  fontSize: 13,
                  color: r.sentAt ? colors.matchDeep : colors.inkSoft,
                  fontFamily: fontFamily.ui,
                }}
              >
                {stateLine(r)}
              </Text>
              {r.outcome === 'bridge' && !r.sentAt && (
                <Press
                  onPress={async () => {
                    await markSent(r.id);
                    refresh();
                  }}
                  scale={false}
                >
                  <Text
                    testID={`mark-sent-${r.id}`}
                    style={{
                      fontSize: 13,
                      fontWeight: '600',
                      color: colors.p2Deep,
                      fontFamily: fontFamily.ui,
                      paddingVertical: 8,
                      paddingHorizontal: 4,
                    }}
                  >
                    I sent it
                  </Text>
                </Press>
              )}
            </View>
          </View>
        ))}

        <View style={{ marginTop: 28 }}>
          <Btn kind="soft" onPress={() => router.back()}>
            Done
          </Btn>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
