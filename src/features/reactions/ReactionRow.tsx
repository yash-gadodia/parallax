import React from 'react';
import { View, Text } from 'react-native';
import Press from '../../components/Press';
import { Kick } from '../../components/Text';
import { colors, radius } from '../../design/tokens';
import * as haptics from '../../lib/haptics';
import { REACTION_EMOJIS } from './useReactions';

interface ReactionRowProps {
  promptId: string;
  /** My reaction emoji, when I have one (you = p1 coral, per the compare chips). */
  myEmoji: string | null;
  /** The partner's reaction emoji, when present (p2 periwinkle). */
  partnerEmoji: string | null;
  partnerName: string;
  onReact: (promptId: string, emoji: string) => void;
}

/**
 * The tap-once emoji row under each reveal compare card. Your reaction is
 * highlighted coral (you = p1); the partner's shows beside it in periwinkle.
 */
export default function ReactionRow({
  promptId,
  myEmoji,
  partnerEmoji,
  partnerName,
  onReact,
}: ReactionRowProps) {
  return (
    <View
      style={{
        marginTop: 11,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: colors.line,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
      }}
    >
      {REACTION_EMOJIS.map((emoji) => {
        const mine = myEmoji === emoji;
        return (
          <Press
            key={emoji}
            scale={false}
            onPress={() => {
              haptics.selection();
              onReact(promptId, emoji);
            }}
            accessibilityLabel={`React ${emoji}`}
            accessibilityState={{ selected: mine }}
            hitSlop={{ top: 6, bottom: 6, left: 2, right: 2 }}
            style={{
              width: 'auto',
              paddingVertical: 5,
              paddingHorizontal: 10,
              borderRadius: radius.pill,
              borderWidth: 1,
              borderColor: mine ? colors.p1 : 'transparent',
              backgroundColor: mine ? 'rgba(255,142,122,0.14)' : 'rgba(58,51,64,0.04)',
            }}
          >
            <Text allowFontScaling={false} style={{ fontSize: 14, color: colors.ink }}>
              {emoji}
            </Text>
          </Press>
        );
      })}

      {partnerEmoji != null && (
        <View
          style={{
            marginLeft: 'auto',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            paddingVertical: 5,
            paddingHorizontal: 10,
            borderRadius: radius.pill,
            backgroundColor: 'rgba(157,149,245,0.16)',
          }}
        >
          <Text allowFontScaling={false} style={{ fontSize: 14, color: colors.ink }}>
            {partnerEmoji}
          </Text>
          <Kick c={colors.p2Deep}>{partnerName}</Kick>
        </View>
      )}
    </View>
  );
}
