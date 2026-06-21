import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import TopBar from '../src/components/TopBar';
import Press from '../src/components/Press';
import Tok from '../src/components/Tok';
import Toast from '../src/components/Toast';
import { Icon, ICONS } from '../src/components/Icon';
import { Kick } from '../src/components/Text';
import { DawnBlobs } from '../src/components/DawnBlobs';

import { ACTIVITY, Activity as ActivityItem } from '../src/content/us';
import { colors, gradients, radius, shadows, space } from '../src/design/tokens';
import { fontFamily } from '../src/design/typography';

const YOU = { initial: 'Y' };
const DANI = { initial: 'D' };

export default function ActivityScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();

  const [items, setItems] = useState<ActivityItem[]>(ACTIVITY);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Mark all as read on mount (after ~900ms)
  useEffect(() => {
    const t = setTimeout(() => {
      setItems(a => a.map(x => ({ ...x, unread: false })));
    }, 900);
    return () => clearTimeout(t);
  }, []);

  const handleMarkAllRead = () => {
    setItems(a => a.map(x => ({ ...x, unread: false })));
    setToastMsg('All caught up');
    // Clear toast after 2s
    setTimeout(() => setToastMsg(null), 2000);
  };

  const handleActivityPress = (item: ActivityItem) => {
    if (!item.cta) return;

    if (item.cta === 'play') {
      // Would open play screen
      router.push('/');
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
          onBack={() => router.back()}
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
            {items.map(a => {
              const tappable = !!a.cta;
              const isUnread = a.unread;

              return (
                <Press
                  key={a.id}
                  onPress={() => handleActivityPress(a)}
                  scale={tappable}
                  disabled={!tappable}
                >
                  <View
                    style={[
                      styles.card,
                      {
                        backgroundColor: isUnread ? colors.p1 + '14' : colors.surface,
                        borderColor: isUnread ? 'rgba(157,149,245,0.28)' : colors.line,
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
                    {isUnread && <View style={styles.unreadDot} />}
                    {!isUnread && tappable && (
                      <Icon
                        d={ICONS.chevR}
                        size={16}
                        color={colors.inkMute}
                        style={styles.chevron}
                      />
                    )}
                  </View>
                </Press>
              );
            })}
          </View>

          <Text style={styles.footer}>that's everything · just you two</Text>

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
    letterSpacing: 1.5,
  },
  bottomSpacer: {
    height: 40,
  },
  rightButton: {
    width: 'auto',
  },
});
