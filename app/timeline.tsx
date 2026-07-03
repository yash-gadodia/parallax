import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { safeBack } from '../src/lib/nav';
import TopBar from '../src/components/TopBar';
import Press from '../src/components/Press';
import Card from '../src/components/Card';
import Btn from '../src/components/Btn';
import GradientText from '../src/components/GradientText';
import { Icon, ICONS } from '../src/components/Icon';
import { Kick, Serif } from '../src/components/Text';
import { DawnBlobs } from '../src/components/DawnBlobs';
import { Skeleton } from '../src/components/Skeleton';

import { ARCHIVE } from '../src/content/drop';
import { colors, gradients, space } from '../src/design/tokens';
import { fontFamily } from '../src/design/typography';
import { useTimeline } from '../src/features/history/useTimeline';
import { useDropEmojis } from '../src/features/history/useDropEmojis';
import { useProfile } from '../src/features/profile/useProfile';
import type { DropEntry, MilestoneEntry, PairupEntry } from '../src/features/history/timeline';
import { dayLabel } from '../src/features/history/historyStats';

export default function TimelineScreen() {
  const router = useRouter();
  const { entries, loading, isSample, error, refetch } = useTimeline();
  const { partnerName } = useProfile();

  const dropCodes = entries
    .filter((e): e is DropEntry => e.kind === 'drop')
    .map((e) => e.code);
  const dropEmojis = useDropEmojis(dropCodes);

  // Real rows carry couple_drop_id → the detail screen renders the REAL drop;
  // demo/sample rows have none and fall back to the static ARCHIVE by code.
  const handleDropPress = (e: DropEntry) => {
    if (!isSample && e.couple_drop_id) {
      router.push(
        `/dropDetail?code=${e.code}&cdid=${e.couple_drop_id}&day=${encodeURIComponent(e.date)}`
      );
    } else {
      router.push(`/dropDetail?code=${e.code}`);
    }
  };

  const renderDrop = (e: DropEntry) => {
    const emoji =
      dropEmojis[e.code] ??
      ARCHIVE.find((a) => a.code === e.code)?.emoji ??
      '💬';
    return (
      <Press key={e.id} onPress={() => handleDropPress(e)}>
        <Card
          style={[
            styles.row,
            e.twin && {
              backgroundColor: colors.usSoft,
              borderColor: 'rgba(157,149,245,0.28)',
            },
          ]}
        >
          <View
            style={[
              styles.iconBox,
              e.twin && { backgroundColor: 'rgba(157,149,245,0.16)' },
            ]}
          >
            <Text allowFontScaling={false} style={styles.iconEmoji}>{emoji}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text
              allowFontScaling={false}
              style={styles.rowTitle}
              numberOfLines={1}
            >
              {e.title}
            </Text>
            <Kick style={{ marginTop: 3 }}>
              {`${e.code} · ${dayLabel(e.date)}`}
            </Kick>
            {e.twin && (
              <Kick c={colors.p2Deep} style={{ marginTop: 4 }}>
                👯 twin day
              </Kick>
            )}
          </View>

          <View style={{ alignItems: 'flex-end' }}>
            <GradientText
              style={{
                fontFamily: fontFamily.disp,
                fontSize: 22,
                lineHeight: 24,
                textAlign: 'right',
              }}
            >
              {`${e.wavelength}%`}
            </GradientText>
            <Kick style={{ marginTop: 2 }}>{`${e.twins_count} 👯`}</Kick>
          </View>

          <Icon d={ICONS.chevR} size={17} color={colors.inkMute} />
        </Card>
      </Press>
    );
  };

  const renderMilestone = (e: MilestoneEntry) => (
    <Press key={e.id} onPress={() => router.push('/streak')}>
      <Card style={[styles.row, styles.milestoneRow]}>
        <View style={[styles.iconBox, { backgroundColor: 'rgba(255,142,122,0.14)' }]}>
          <Text allowFontScaling={false} style={styles.iconEmoji}>🔥</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text allowFontScaling={false} style={styles.rowTitle} numberOfLines={1}>
            {`${e.days}-day streak`}
          </Text>
          <Kick style={{ marginTop: 3 }}>milestone · you kept it alive</Kick>
        </View>
        <Icon d={ICONS.chevR} size={17} color={colors.inkMute} />
      </Card>
    </Press>
  );

  const renderPairup = (e: PairupEntry) => (
    <Card key={e.id} style={[styles.row, styles.pairupRow]}>
      <View style={[styles.iconBox, { backgroundColor: 'rgba(157,149,245,0.16)' }]}>
        <Text allowFontScaling={false} style={styles.iconEmoji}>💞</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text allowFontScaling={false} style={styles.rowTitle} numberOfLines={2}>
          {e.label}
        </Text>
        <Kick style={{ marginTop: 3 }}>{`where your story begins · ${dayLabel(e.date)}`}</Kick>
      </View>
    </Card>
  );

  return (
    <LinearGradient
      colors={gradients.dawn.colors}
      locations={gradients.dawn.locations}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <DawnBlobs />

      <SafeAreaView style={styles.safe}>
        <TopBar title="your story" onBack={() => safeBack(router)} />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topSpacer} />

          {loading ? (
            <View style={styles.items}>
              <Skeleton h={16} w={110} br={8} testID="timeline-skeleton-month" />
              <Skeleton h={70} br={20} testID="timeline-skeleton-row" />
              <Skeleton h={70} br={20} testID="timeline-skeleton-row" />
              <Skeleton h={70} br={20} testID="timeline-skeleton-row" />
            </View>
          ) : error ? (
            <View style={styles.centered}>
              <Text allowFontScaling={false} style={styles.bubble}>🫧</Text>
              <Serif s={21} style={{ textAlign: 'center', marginBottom: 6 }}>
                hmm, that didn't load
              </Serif>
              <Text allowFontScaling={false} style={styles.centeredBody}>
                {`your story with ${partnerName} is safe — we just couldn't reach it.`}
              </Text>
              <Btn kind="soft" onPress={refetch} style={{ alignSelf: 'stretch' }}>
                try again
              </Btn>
            </View>
          ) : entries.length === 0 ? (
            <View style={styles.centered}>
              <Text allowFontScaling={false} style={styles.bubble}>🌱</Text>
              <Serif s={22} style={{ textAlign: 'center', marginBottom: 6 }}>
                your story starts with tonight's drop
              </Serif>
              <Text allowFontScaling={false} style={styles.centeredBody}>
                {`every reveal, streak and twin moment you and ${partnerName} unlock lands here — a story only you two are writing.`}
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.items}>
                {entries.map((e) => {
                  if (e.kind === 'month') {
                    return (
                      <View key={e.id} style={styles.monthHeader}>
                        <Kick>{e.label}</Kick>
                      </View>
                    );
                  }
                  if (e.kind === 'drop') return renderDrop(e);
                  if (e.kind === 'milestone') return renderMilestone(e);
                  return renderPairup(e);
                })}
              </View>
              <Text allowFontScaling={false} style={styles.footer}>
                that's your whole story · just you two
              </Text>
            </>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: space.gutter,
  },
  topSpacer: { height: 50 },
  items: { gap: 10 },
  monthHeader: {
    marginTop: 14,
    marginBottom: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingVertical: 13,
    paddingHorizontal: 15,
    gap: 13,
  },
  milestoneRow: {
    borderLeftWidth: 3,
    borderLeftColor: colors.p1,
  },
  pairupRow: {
    borderLeftWidth: 3,
    borderLeftColor: colors.p2,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.sunken,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: { fontSize: 22 },
  rowTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
    fontFamily: fontFamily.disp,
  },
  centered: {
    alignItems: 'center',
    paddingVertical: 44,
    paddingHorizontal: 24,
  },
  bubble: { fontSize: 30, marginBottom: 10 },
  centeredBody: {
    fontSize: 13.5,
    lineHeight: 13.5 * 1.45,
    color: colors.inkMute,
    textAlign: 'center',
    fontFamily: fontFamily.ui,
    marginBottom: 16,
  },
  footer: {
    textAlign: 'center',
    fontFamily: fontFamily.mono,
    fontSize: 10.5,
    color: colors.inkMute,
    marginTop: 22,
  },
  bottomSpacer: { height: 40 },
});
