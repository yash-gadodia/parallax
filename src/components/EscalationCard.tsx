import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Card from './Card';
import Btn from './Btn';
import Press from './Press';
import { Kick } from './Text';
import { colors } from '../design/tokens';
import { fontFamily } from '../design/typography';
import { getDismissalKey } from '../features/refocus/checkEscalation';

interface EscalationCardProps {
  sessionCount: number;
  onDismiss?: () => void;
}

export default function EscalationCard({
  sessionCount,
  onDismiss,
}: EscalationCardProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const checkDismissed = async () => {
      const key = getDismissalKey(sessionCount);
      const dismissed = await AsyncStorage.getItem(key);
      if (dismissed === 'true') {
        setIsDismissed(true);
      }
    };
    checkDismissed();
  }, [sessionCount]);

  const handleDismiss = useCallback(async () => {
    const key = getDismissalKey(sessionCount);
    await AsyncStorage.setItem(key, 'true');
    setIsDismissed(true);
    onDismiss?.();
  }, [sessionCount, onDismiss]);

  const openLink = (url: string) => {
    Linking.openURL(url);
  };

  if (isDismissed) return null;

  return (
    <Card
      style={{
        borderRadius: 24,
        paddingHorizontal: 18,
        paddingVertical: 18,
        marginVertical: 12,
        backgroundColor: 'rgba(46,156,124,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(46,156,124,0.2)',
      }}
    >
      <Kick c={colors.matchDeep} style={{ marginBottom: 8 }}>
        You two keep showing up — that's the work 💛
      </Kick>

      <Text
        style={{
          fontSize: 14.5,
          lineHeight: 14.5 * 1.55,
          color: colors.ink,
          marginBottom: 12,
          fontFamily: fontFamily.ui,
        }}
      >
        Noticing you've refocused a few times lately? Talking to a couples
        professional isn't an escalation, it's a power move.
      </Text>

      <View style={{ gap: 8, marginBottom: 12 }}>
        <Press
          onPress={() =>
            openLink('https://www.cphonlinecounselling.sg')
          }
        >
          <View
            style={{
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: 12,
              backgroundColor: 'rgba(46,156,124,0.12)',
              borderWidth: 1,
              borderColor: 'rgba(46,156,124,0.25)',
            }}
          >
            <Text
              style={{
                fontSize: 13.5,
                fontWeight: '600',
                color: colors.matchDeep,
                lineHeight: 13.5 * 1.4,
                fontFamily: fontFamily.ui,
              }}
            >
              Community Psychology Hub (online)
            </Text>
          </View>
        </Press>

        <Press
          onPress={() =>
            openLink('https://www.msf.gov.sg/our-services/directories')
          }
        >
          <View
            style={{
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: 12,
              backgroundColor: 'rgba(46,156,124,0.12)',
              borderWidth: 1,
              borderColor: 'rgba(46,156,124,0.25)',
            }}
          >
            <Text
              style={{
                fontSize: 13.5,
                fontWeight: '600',
                color: colors.matchDeep,
                lineHeight: 13.5 * 1.4,
                fontFamily: fontFamily.ui,
              }}
            >
              Family Service Centres
            </Text>
          </View>
        </Press>
      </View>

      <Btn
        kind="soft"
        onPress={handleDismiss}
        style={{ marginTop: 8 }}
      >
        Not now
      </Btn>
    </Card>
  );
}
