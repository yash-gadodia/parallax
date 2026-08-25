import React, { useState, useEffect, useRef } from 'react';
import { View } from 'react-native';
import { Peek } from '../../../components/Peek';
import { Serif } from '../../../components/Text';
import TopBar from '../../../components/TopBar';
import { Float } from '../../../components/Float';
import { colors, radius } from '../../../design/tokens';
import { RefocusResult, RefocusSafety } from '../../../content/refocus';
import { useIdentity } from '../../profile/useIdentity';
import { supabase } from '../../../lib/supabase';
import { SideInRow, PulseDot } from './shared';

export interface WaitingStepProps {
  userText: string;
  onCancel: () => void;
  onDone: (result: RefocusResult) => void;
  onSafety: (safety: RefocusSafety) => void;
  onError: () => void;
}

export function WaitingStep({ userText, onCancel, onDone, onSafety, onError }: WaitingStepProps) {
  const { partner } = useIdentity();
  const [phase, setPhase] = useState(0); // 0 reading · 1 reflecting
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const t1 = setTimeout(() => setPhase(1), 1600);
    const min = new Promise((r) => setTimeout(r, 4200));

    // Live Claude reflection (edge fn) raced against a min display time.
    // A failure surfaces the honest error step — never a canned result.
    Promise.all([analyze(userText, partner.name), min]).then(([res]) => {
      // Guard: the user may navigate away during the ~4.2s wait.
      if (!mounted.current) return;
      if (res && 'safety' in res) onSafety(res.safety);
      else if (res) onDone(res.reflection);
      else onError();
    });

    return () => {
      mounted.current = false;
      clearTimeout(t1);
    };
  }, []);

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 34,
      }}
    >
      {/* Visible exit — the analysis wait must never trap the user. */}
      <TopBar title="finding focus" onBack={onCancel} />

      {/* Floating Peek with halo */}
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
          <Peek size={128} mood={phase >= 1 ? 'focus' : 'search'} />
        </Float>
      </View>

      {/* Status text */}
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
        {phase < 1 ? 'reading your side…' : 'finding what’s underneath…'}
      </Serif>

      {/* Status item */}
      <View style={{ width: '100%', maxWidth: 280, gap: 12 }}>
        <SideInRow label="Your side is in" you />
      </View>

      {/* Loading dots */}
      <View style={{ marginTop: 22, flexDirection: 'row', gap: 6 }}>
        {[0, 1, 2].map((i) => (
          <PulseDot key={i} delay={i * 0.18} />
        ))}
      </View>
    </View>
  );
}

// ── AI analysis (solo; real implementation: Supabase edge function) ────

type SoloOutcome =
  | { reflection: RefocusResult }
  | { safety: RefocusSafety };

async function analyze(
  userText: string,
  partnerName: string
): Promise<SoloOutcome | null> {
  // Live Claude reflection via the `refocus` Supabase edge function (key is
  // server-side). A failure or malformed shape returns null so the screen can
  // show an honest error state — never a canned result. A safety verdict
  // (crisis/abuse) routes to the helplines screen instead of a reflection.
  try {
    const { data, error } = await supabase.functions.invoke<
      RefocusResult & { safety?: RefocusSafety }
    >('refocus', { body: { userText, partnerName } });
    if (error || !data) return null;
    if (
      data.safety &&
      (data.safety.type === 'crisis' || data.safety.type === 'abuse') &&
      typeof data.safety.title === 'string' &&
      typeof data.safety.message === 'string' &&
      Array.isArray(data.safety.helplines)
    ) {
      return { safety: data.safety };
    }
    if (
      !Array.isArray(data.happened) ||
      !Array.isArray(data.angles) ||
      !data.underneath ||
      !data.wayback ||
      !data.bridge
    ) {
      return null;
    }
    return { reflection: data };
  } catch {
    return null;
  }
}
