import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { safeBack } from "../src/lib/nav";
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import TopBar from '../src/components/TopBar';
import Press from '../src/components/Press';
import Tok from '../src/components/Tok';
import Toast from '../src/components/Toast';
import { Icon, ICONS } from '../src/components/Icon';
import { Kick } from '../src/components/Text';
import { DawnBlobs } from '../src/components/DawnBlobs';

import { ACTIVITY } from '../src/content/us';
import { colors, gradients, radius, shadows, space } from '../src/design/tokens';
import { fontFamily } from '../src/design/typography';
import { useSession } from '../src/features/auth/useSession';
import { useCouple } from '../src/features/pairing/useCouple';
import { useActivity } from '../src/features/engagement/useActivity';
import { mapActivityToDisplay, DisplayActivity } from '../src/features/engagement/activityFormatter';

const YOU = { initial: 'Y' };
const DANI = { initial: 'D' };

export default function ActivityScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const { session } = useSession();
  const { couple } = useCouple();
  const { items: dbItems, markAllRead: markAllReadDb, loading: activityLoading } = useActivity(couple?.id || null);

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const userId = session?.user?.id;

  // A paired couple shows their real feed (which may legitimately be empty - see
  // the empty state below). Only the unauthenticated demo falls back to samples.
  const paired = !!(session && couple);
  const displayItems: DisplayActivity[] = paired
    ? dbItems
        .map(a => {
          const mapped = mapActivityToDisplay(a);
          return {
            ...mapped,
            unread: userId && a.read_by ? !a.read_by.includes(userId) : false,
          };
        })
        .sort((a, b) => {
          const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
          const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
          return bTime - aTime;
        })
    : ACTIVITY.map(item => ({
        ...item,
        created_at: undefined,
        read_by: [],
      }));

  // PRD: opening the feed clears the unread dot. Auto-mark read shortly after open
  // (silent - no toast; the manual button still confirms with one).
  useEffect(() => {
    if (!session || !couple) return;
    const t = setTimeout(() => {
      markAllReadDb().catch(() => {});
    }, 900);
    return () => clearTimeout(t);
  }, [session, couple, markAllReadDb]);

  const handleMarkAllRead = async () => {
    if (session && couple) {
      try {
        await markAllReadDb();
        setToastMsg('All caught up');
        setTimeout(() => setToastMsg(null), 2000);
      } catch {
        setToastMsg('Failed to mark as read');
        setTimeout(() => setToastMsg(null), 2000);
      }
    } else {
      setToastMsg('All caught up');
      setTimeout(() => setToastMsg(null), 2000);
    }
  };

  const handleActivityPress = (item: DisplayActivity) => {
    if (!item.cta) return;

    if (item.cta === 'play') {
      router.push('/play');
    } else if (item.cta === 'streak') {
      router.push('/streak');
    } else if (item.cta === 'packs') {
      router.push('/packs');
    } else if (item.cta === 'lovemap') {
      router.push('/lovemap');
    }
  };

  return (
    <LinearGradient
      colors={gradients.dawn.colors}
      locations={gradients.dawn.locations}
      style={styles.container}
    >
      <DawnBlobs />

      <SafeAreaView style={styles.safe}>
        <TopBar
          title="activity"
          onBack={() => safeBack(router)}
          right={
            <Press
              onPress={handleMarkAllRead}
              scale={false}
              style={styles.rightButton}
            >
              <Icon d={ICONS.check} size={19} color={colors.inkSoft} sw={2} />
            </Press>
          }
        />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topSpacer} />

          <View style={styles.itemsContainer}>
            {(displayItems as DisplayActivity[]).map(a => {
              const tappable = !!a.cta;
              const isUnread = a.unread;

              return (
                <Press
                  key={a.id}
                  onPress={() => handleActivityPress(a)}
                  scale={tappable}
                  disabled={!tappable}
                >
                  {isUnread ? (
                    <LinearGradient
                      colors={gradients.usSoft.colors}
                      locations={gradients.usSoft.locations}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[
                        styles.card,
                        {
                          overflow: 'hidden',
                          borderColor: 'rgba(157,149,245,0.28)',
                        },
                      ]}
                    >
                      {/* Emoji icon with optional Tok overlay */}
                      <View style={styles.iconContainer}>
                        <View style={styles.emojiBox}>
                          <Text allowFontScaling={false} style={styles.emoji}>
                            {a.emoji}
                          </Text>
                        </View>
                        {a.who !== 'us' && (
                          <View style={styles.tokOverlay}>
                            <Tok
                              who={a.who === 'you' ? YOU : DANI}
                              you={a.who === 'you'}
                              size={20}
                            />
                          </View>
                        )}
                      </View>

                      {/* Content: title, body, when */}
                      <View style={styles.content}>
                        <Text
                          style={styles.title}
                          numberOfLines={2}
                          allowFontScaling={false}
                        >
                          {a.title}
                        </Text>
                        <Text
                          style={styles.body}
                          numberOfLines={2}
                          allowFontScaling={false}
                        >
                          {a.body}
                        </Text>
                        <Kick style={{ marginTop: 5 }}>{a.when}</Kick>
                      </View>

                      {/* Unread dot or chevron */}
                      <View style={styles.unreadDot} />
                    </LinearGradient>
                  ) : (
                    <View
                      style={[
                        styles.card,
                        {
                          borderColor: colors.line,
                          backgroundColor: colors.surface,
                        },
                      ]}
                    >
                      {/* Emoji icon with optional Tok overlay */}
                      <View style={styles.iconContainer}>
                        <View style={styles.emojiBox}>
                          <Text allowFontScaling={false} style={styles.emoji}>
                            {a.emoji}
                          </Text>
                        </View>
                        {a.who !== 'us' && (
                          <View style={styles.tokOverlay}>
                            <Tok
                              who={a.who === 'you' ? YOU : DANI}
                              you={a.who === 'you'}
                              size={20}
                            />
                          </View>
                        )}
                      </View>

                      {/* Content: title, body, when */}
                      <View style={styles.content}>
                        <Text
                          style={styles.title}
                          numberOfLines={2}
                          allowFontScaling={false}
                        >
                          {a.title}
                        </Text>
                        <Text
                          style={styles.body}
                          numberOfLines={2}
                          allowFontScaling={false}
                        >
                          {a.body}
                        </Text>
                        <Kick style={{ marginTop: 5 }}>{a.when}</Kick>
                      </View>

                      {/* Unread dot or chevron */}
                      {tappable && (
                        <Icon
                          d={ICONS.chevR}
                          size={16}
                          color={colors.inkMute}
                          style={styles.chevron}
                        />
                      )}
                    </View>
                  )}
                </Press>
              );
            })}
          </View>

          {displayItems.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 44, paddingHorizontal: 24 }}>
              <Text allowFontScaling={false} style={{ fontSize: 30, marginBottom: 10 }}>
                🫧
              </Text>
              <Text
                allowFontScaling={false}
                style={{
                  fontSize: 15,
                  fontWeight: '700',
                  color: colors.ink,
                  fontFamily: fontFamily.ui,
                  marginBottom: 6,
                }}
              >
                Nothing yet
              </Text>
              <Text
                allowFontScaling={false}
                style={{
                  fontSize: 13.5,
                  lineHeight: 13.5 * 1.45,
                  color: colors.inkMute,
                  textAlign: 'center',
                  fontFamily: fontFamily.ui,
                }}
              >
                When you and Dani play, nudge, or hit a milestone, it shows up here.
              </Text>
            </View>
          ) : (
            <Text style={styles.footer}>that's everything · just you two</Text>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>

      {toastMsg && <Toast msg={toastMsg} />}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: space.gutter,
  },
  topSpacer: {
    height: 50,
  },
  itemsContainer: {
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 15,
    gap: 13,
    borderWidth: 1,
    ...shadows.shadowSoft,
  },
  iconContainer: {
    position: 'relative',
    width: 44,
    height: 44,
    flexShrink: 0,
  },
  emojiBox: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: colors.sunken,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 21,
  },
  tokOverlay: {
    position: 'absolute',
    bottom: -3,
    right: -3,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.ink,
    lineHeight: 19,
    fontFamily: fontFamily.ui,
  },
  body: {
    fontSize: 13,
    color: colors.inkSoft,
    lineHeight: 18,
    marginTop: 2,
    fontFamily: fontFamily.ui,
  },
  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 999,
    backgroundColor: colors.p1Deep,
    flexShrink: 0,
  },
  chevron: {
    flexShrink: 0,
  },
  footer: {
    textAlign: 'center',
    fontFamily: fontFamily.mono,
    fontSize: 10.5,
    color: colors.inkMute,
    marginTop: 22,
  },
  bottomSpacer: {
    height: 40,
  },
  rightButton: {
    width: 'auto',
  },
});
