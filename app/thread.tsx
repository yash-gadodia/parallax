import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import TopBar from '../src/components/TopBar';
import Press from '../src/components/Press';
import Tok from '../src/components/Tok';
import { Icon, ICONS } from '../src/components/Icon';
import { Kick } from '../src/components/Text';
import { colors, gradients, radius, shadows } from '../src/design/tokens';
import { fontFamily } from '../src/design/typography';
import { THREAD } from '../src/content/extras';
import { DROP } from '../src/content/drop';

interface ThreadMessage {
  who: string;
  text: string;
}

export default function ThreadScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [msgs, setMsgs] = useState<ThreadMessage[]>(THREAD.msgs);
  const [text, setText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [msgs]);

  const send = (t?: string) => {
    const v = (t || text).trim();
    if (!v) return;
    setMsgs((m) => [...m, { who: 'you', text: v }]);
    setText('');
  };

  const PAR = { initial: 'D' };

  return (
    <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, paddingTop: insets.top + 48, flexDirection: 'column' }}>
      <TopBar title="talk about it" onBack={() => router.back()} />

      {/* Pinned prompt context card */}
      <View
        style={{
          marginHorizontal: 18,
          marginTop: 52,
          marginBottom: 0,
          paddingHorizontal: 15,
          paddingVertical: 13,
          borderRadius: 18,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.line,
          ...shadows.shadowSoft,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 11,
        }}
      >
        <Text style={{ fontSize: 22 }}>{THREAD.emoji}</Text>
        <View style={{ flex: 1 }}>
          <Kick>{DROP.code} · the answer you're on</Kick>
          <Text
            style={{
              fontSize: 14.5,
              fontWeight: '700',
              color: colors.ink,
              marginTop: 2,
              fontFamily: fontFamily.ui,
              lineHeight: Math.round(14.5 * 1.4),
            }}
          >
            {THREAD.q}
          </Text>
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingHorizontal: 18,
          paddingVertical: 16,
          gap: 10,
        }}
        style={{ flex: 1 }}
      >
        {/* Messages */}
        {msgs.map((m) => {
          const isYou = m.who === 'you';
          return (
            <View
              key={`${m.who}-${m.text}`}
              style={{
                gap: 8,
                alignSelf: isYou ? 'flex-end' : 'flex-start',
                maxWidth: '82%',
                alignItems: 'flex-end',
                flexDirection: 'row',
              }}
            >
              {!isYou && <Tok who={PAR} size={26} />}
              <View
                style={{
                  paddingHorizontal: 15,
                  paddingVertical: 11,
                  borderRadius: 20,
                  backgroundColor: isYou ? colors.p1 : colors.surface,
                  borderWidth: isYou ? 0 : 1,
                  borderColor: isYou ? 'transparent' : colors.line,
                  ...shadows.shadowSoft,
                  borderBottomLeftRadius: isYou ? 20 : 5,
                  borderBottomRightRadius: isYou ? 5 : 20,
                }}
              >
                <Text
                  style={{
                    fontSize: 14.5,
                    lineHeight: Math.round(14.5 * 1.4),
                    color: isYou ? '#fff' : colors.ink,
                    fontFamily: fontFamily.ui,
                  }}
                >
                  {m.text}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Reactions + Input Footer */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 8,
          flexDirection: 'row',
          gap: 8,
        }}
      >
        {THREAD.reactions.map((e) => (
          <Press
            key={e}
            onPress={() => send(e)}
            scale={false}
            style={{
              width: 40,
              height: 40,
              borderRadius: radius.pill,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.line,
              justifyContent: 'center',
              alignItems: 'center',
              ...shadows.shadowSoft,
            }}
          >
            <Text style={{ fontSize: 19, color: colors.ink }}>{e}</Text>
          </Press>
        ))}
      </View>
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 6,
          paddingBottom: insets.bottom + 22,
          flexDirection: 'row',
          gap: 10,
          alignItems: 'center',
        }}
      >
        <TextInput
          value={text}
          onChangeText={setText}
          onSubmitEditing={() => send()}
          placeholder="say something…"
          placeholderTextColor={colors.inkMute}
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: colors.line,
            backgroundColor: colors.surface,
            borderRadius: radius.pill,
            paddingHorizontal: 18,
            paddingVertical: 13,
            fontSize: 15,
            color: colors.ink,
            fontFamily: fontFamily.ui,
          }}
        />
        <Press onPress={() => send()} scale={false}>
          <LinearGradient
            colors={gradients.us.colors}
            locations={gradients.us.locations}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 46,
              height: 46,
              borderRadius: radius.pill,
              justifyContent: 'center',
              alignItems: 'center',
              ...shadows.shadowSoft,
            }}
          >
            <Icon d={ICONS.send} size={20} color="#fff" />
          </LinearGradient>
        </Press>
      </View>
    </View>
  );
}
