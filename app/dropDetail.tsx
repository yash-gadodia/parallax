import React, { useEffect, useState } from 'react';
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
import Btn from '../src/components/Btn';
import Card from '../src/components/Card';
import Chip from '../src/components/Chip';
import GradientText from '../src/components/GradientText';
import { DawnBlobs } from '../src/components/DawnBlobs';
import { useIdentity } from '../src/features/profile/useIdentity';
import { getDropContent, fetchReveal } from '../src/features/drops/dropActions';

// The screen's render shape — ARCHIVE rows already match it; live drops are
// mapped into it from the server (0.4: the REAL drop from history, no demo
// stand-in for real couples).
interface DetailDrop {
  code: string;
  emoji: string;
  title: string;
  day: string;
  wave: number;
  twins: number;
  rows: [string, string, string, boolean][];
}

export default function DropDetailScreen() {
  const router = useRouter();
  const { partner } = useIdentity();
  const params = useLocalSearchParams();
  const code = typeof params.code === 'string' ? params.code : undefined;
  // cdid = the real couple_drop id (couple_history, 0024). Present → live.
  const cdid = typeof params.cdid === 'string' ? params.cdid : undefined;
  const dayLabel = typeof params.day === 'string' ? params.day : '';

  const [live, setLive] = useState<DetailDrop | null>(null);
  const [liveFailed, setLiveFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!cdid) return;
    let cancelled = false;
    (async () => {
      try {
        const [content, revealData] = await Promise.all([
          getDropContent(cdid),
          fetchReveal(cdid),
        ]);
        if (cancelled) return;
        if (!content || content.prompts.length === 0) throw new Error('no content');
        setLive({
          code: content.code ?? code ?? 'drop',
          emoji: content.prompts[0]?.emoji ?? '💬',
          title: content.title ?? '',
          day: dayLabel,
          wave: revealData.reveal.wave,
          twins: revealData.reveal.twins,
          rows: content.prompts.map((p, i) => {
            const a = revealData.promptAnswers[i];
            const mine = a && a.youPick >= 0 ? p.opts[a.youPick] ?? '—' : '—';
            const theirs = a && a.themPick >= 0 ? p.opts[a.themPick] ?? '—' : '—';
            return [p.q, mine, theirs, !!a && a.youPick >= 0 && a.youPick === a.themPick];
          }),
        });
      } catch {
        if (!cancelled) setLiveFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cdid, code, dayLabel, attempt]);

  // A real drop renders from the server; the static ARCHIVE only ever serves
  // the unauthenticated demo codes. Never substitute a different drop.
  const d: DetailDrop | null = cdid
    ? live
    : code
      ? (ARCHIVE.find((x) => x.code === code) as DetailDrop | undefined) ?? null
      : null;

  // Live drop still loading (not failed): a quiet hold, never demo content.
  if (cdid && !live && !liveFailed) {
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
        <TopBar title={code ?? 'drop'} onBack={() => safeBack(router)} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Kick c={colors.inkSoft}>opening this drop…</Kick>
        </View>
      </View>
    );
  }

  const handleBack = () => {
    safeBack(router);
  };

  // Live drop failed to load: an honest, retryable error — distinct from the
  // "not available" empty state (this drop exists; we just couldn't reach it).
  if (cdid && liveFailed) {
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

        <TopBar title={code ?? 'drop'} onBack={handleBack} />

        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: space.gutter,
          }}
        >
          <Text allowFontScaling={false} style={{ fontSize: 30, marginBottom: 10 }}>
            🫧
          </Text>
          <Serif s={28} italic c={colors.ink} style={{ textAlign: 'center' }}>
            hmm, that didn't load
          </Serif>
          <Text
            allowFontScaling={false}
            style={{
              fontSize: 14,
              lineHeight: 20,
              color: colors.inkSoft,
              fontFamily: fontFamily.ui,
              textAlign: 'center',
              marginTop: 8,
              marginBottom: 16,
            }}
          >
            Your answers are safe — we just couldn't reach this drop.
          </Text>
          <Btn
            kind="soft"
            onPress={() => {
              setLiveFailed(false);
              setAttempt((a) => a + 1);
            }}
            style={{ alignSelf: 'stretch' }}
          >
            try again
          </Btn>
        </View>
      </View>
    );
  }

  if (!d) {
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

        <TopBar title={code ?? 'drop'} onBack={handleBack} />

        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: space.gutter,
          }}
        >
          <Text
            allowFontScaling={false}
            style={{ fontSize: 40, lineHeight: 44 }}
          >
            🌒
          </Text>
          <Serif s={28} italic c={colors.ink} style={{ marginTop: 12, textAlign: 'center' }}>
            This drop isn't available yet
          </Serif>
          <Text
            allowFontScaling={false}
            style={{
              fontSize: 14,
              lineHeight: 20,
              color: colors.inkSoft,
              fontFamily: fontFamily.ui,
              textAlign: 'center',
              marginTop: 8,
            }}
          >
            The full look-back at your answers is coming soon.
          </Text>
        </View>
      </View>
    );
  }

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
