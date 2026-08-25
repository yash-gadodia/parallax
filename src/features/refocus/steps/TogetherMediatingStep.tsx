import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { Peek } from '../../../components/Peek';
import { Serif } from '../../../components/Text';
import TopBar from '../../../components/TopBar';
import { Float } from '../../../components/Float';
import { colors, radius } from '../../../design/tokens';
import { RefocusAiResult } from '../../../content/refocus';
import { useIdentity } from '../../profile/useIdentity';
import { mediateSession } from '../refocusActions';
import { SideInRow, PulseDot } from './shared';

export function TogetherMediatingStep({
  sessionId,
  onCancel,
  onDone,
  onError,
}: {
  sessionId: string;
  onCancel: () => void;
  onDone: (result: RefocusAiResult) => void;
  onError: () => void;
}) {
  const { partner } = useIdentity();
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const min = new Promise((r) => setTimeout(r, 2500));

    // The server is idempotent: whichever partner calls first pays for the
    // mediation, everyone else gets the SAME stored result back.
    Promise.all([mediateSession(sessionId), min]).then(([res]) => {
      if (!mounted.current) return;
      if (res) onDone(res);
      else onError();
    });

    return () => {
      mounted.current = false;
    };
  }, [sessionId]);

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 34,
      }}
    >
      <TopBar title="finding the middle" onBack={onCancel} />

      <View
        style={{
          width: 150,
          height: 120,
          marginBottom: 28,
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <Float distance={7} duration={3500}>
          <View
            style={{
              position: 'absolute',
              width: 120,
              height: 120,
              borderRadius: radius.pill,
              backgroundColor: colors.usSoft,
            }}
          />
        </Float>
        <Float distance={7} duration={4000}>
          <Peek size={128} mood="focus" />
        </Float>
      </View>

      <Serif
        s={28}
        italic
        style={{
          textAlign: 'center',
          marginBottom: 24,
          maxWidth: 280,
          lineHeight: 28 * 1.09,
        }}
      >
        both sides are in…
      </Serif>

      <View style={{ width: '100%', maxWidth: 280, gap: 12 }}>
        <SideInRow label="Your side is in" you />
        <SideInRow
          label={`${partner.name}'s side is in`}
          who={{ name: partner.name, initial: partner.initial }}
        />
      </View>

      <View style={{ marginTop: 22, flexDirection: 'row', gap: 6 }}>
        {[0, 1, 2].map((i) => (
          <PulseDot key={i} delay={i * 0.18} />
        ))}
      </View>
    </View>
  );
}
