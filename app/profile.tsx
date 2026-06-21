import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import TopBar from '../src/components/TopBar';
import Press from '../src/components/Press';
import Tok from '../src/components/Tok';
import Btn from '../src/components/Btn';
import Toast from '../src/components/Toast';
import { Icon, ICONS } from '../src/components/Icon';
import { Kick, Serif } from '../src/components/Text';
import { Mark } from '../src/components/Mark';

import { colors, gradients, radius, shadows, space } from '../src/design/tokens';
import { fontFamily } from '../src/design/typography';
import { useCouple } from '../src/features/pairing/useCouple';
import { nudge } from '../src/features/engagement/engagementActions';

const YOU = { initial: 'Y' };
const DANI = { initial: 'D' };

interface ProfileState {
  name: string;
  spice: string;
  plus: boolean;
}

interface RowProps {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
}

function Row({ icon, label, value, onPress, danger = false }: RowProps) {
  return (
    <Press onPress={onPress} scale={false}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 13,
          paddingHorizontal: 16,
          paddingVertical: 15,
        }}
      >
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            backgroundColor: danger ? 'rgba(239,106,83,0.12)' : colors.sunken,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Icon
            d={icon}
            size={18}
            color={danger ? colors.p1Deep : colors.inkSoft}
          />
        </View>
        <Text
          style={{
            flex: 1,
            fontSize: 15,
            fontWeight: '600',
            color: danger ? colors.p1Deep : colors.ink,
            fontFamily: fontFamily.ui,
          }}
        >
          {label}
        </Text>
        {value && (
          <Text
            style={{
              fontSize: 13.5,
              fontWeight: '600',
              color: colors.inkMute,
              fontFamily: fontFamily.ui,
            }}
          >
            {value}
          </Text>
        )}
        <Icon d={ICONS.chevR} size={16} color={colors.inkMute} />
      </View>
    </Press>
  );
}

function Group({ children }: { children: React.ReactNode }) {
  const childrenArray = React.Children.toArray(children);
  return (
    <View
      style={{
        borderRadius: 22,
        overflow: 'hidden',
        marginBottom: 14,
        backgroundColor: colors.surface,
        ...shadows.shadowSoft,
      }}
    >
      {childrenArray.map((child, i) => (
        <View
          key={i}
          style={{
            borderTopWidth: i > 0 ? 1 : 0,
            borderTopColor: colors.line,
          }}
        >
          {child}
        </View>
      ))}
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const { couple } = useCouple();

  // Mock profile state
  const state: ProfileState = {
    name: 'Yash',
    spice: 'Flirty',
    plus: false,
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2000);
  };

  const handleNudge = async () => {
    if (!couple) {
      showToast('Not paired yet');
      return;
    }
    try {
      await nudge(couple.id);
      showToast('Nudge sent to Dani 👋');
    } catch {
      showToast('Failed to send nudge');
    }
  };

  const handleNotifications = () => {
    showToast('Notification settings');
  };

  const handlePairing = () => {
    showToast('Pairing settings');
  };

  const handleUnpair = () => {
    showToast('Unpaired from Dani');
  };

  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor: colors.bg0,
  };

  const scrollContentStyle = {
    paddingTop: insets.top + 52 + 58,
    paddingHorizontal: space.gutter,
    paddingBottom: insets.bottom + 40,
  };

  const identityCardStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  };

  const identityContentStyle: ViewStyle = {
    flex: 1,
  };

  const pairedWithStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  };

  const tokEditButtonStyle: ViewStyle = {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    backgroundColor: colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
    position: 'absolute',
    bottom: -2,
    right: -2,
  };


  const footerStyle = {
    textAlign: 'center' as const,
    fontFamily: fontFamily.mono,
    fontSize: 10,
    color: colors.inkMute,
    marginTop: 18,
  };

  return (
    <View style={containerStyle}>
      <TopBar title="you & settings" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={scrollContentStyle}>
        {/* Identity Card - editable */}
        <Press onPress={() => router.push('/editProfile')} scale={false}>
          <View style={identityCardStyle}>
            <View style={{ position: 'relative' }}>
              <Tok who={YOU} size={64} ring you />
              <View style={tokEditButtonStyle}>
                <Icon d={ICONS.pencil} size={12} color="#fff" />
              </View>
            </View>
            <View style={identityContentStyle}>
              <Serif s={28} c={colors.ink}>
                {state.name}
              </Serif>
              <View style={pairedWithStyle}>
                <Text
                  style={{
                    fontFamily: fontFamily.mono,
                    fontSize: 11,
                    color: colors.inkSoft,
                  }}
                >
                  paired with
                </Text>
                <Tok who={DANI} size={18} />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '700',
                    color: colors.p2Deep,
                    fontFamily: fontFamily.ui,
                  }}
                >
                  Dani
                </Text>
              </View>
            </View>
            <Icon d={ICONS.chevR} size={18} color={colors.inkMute} />
          </View>
        </Press>

        {/* Nudge Banner */}
        <View
          style={{
            borderRadius: 22,
            paddingHorizontal: 16,
            paddingVertical: 16,
            marginBottom: 14,
            backgroundColor: gradients.usSoft.colors[0],
            borderWidth: 1,
            borderColor: 'rgba(157,149,245,0.25)',
            ...shadows.shadowSoft,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Text style={{ fontSize: 24 }}>👋</Text>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 14.5,
                  fontWeight: '700',
                  color: colors.ink,
                  fontFamily: fontFamily.ui,
                }}
              >
                Give Dani a nudge
              </Text>
              <Kick c={colors.p2Deep} style={{ marginTop: 2 }}>
                they haven't opened today's reveal
              </Kick>
            </View>
          </View>
          <View style={{ marginTop: 12 }}>
            <Btn kind="us" onPress={handleNudge} style={{ minHeight: 48 }}>
              <Text style={{ fontSize: 14.5, color: '#fff', fontFamily: fontFamily.ui }}>Send a nudge</Text>
            </Btn>
          </View>
        </View>

        {/* Plus Banner (conditional) */}
        {state.plus && (
          <View
            style={{
              borderRadius: 22,
              paddingHorizontal: 16,
              paddingVertical: 14,
              marginBottom: 14,
              backgroundColor: colors.p2,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              ...shadows.shadowSoft,
            }}
          >
            <Mark size={24} />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 14.5,
                  fontWeight: '700',
                  color: '#fff',
                  fontFamily: fontFamily.ui,
                }}
              >
                Parallax Plus is active
              </Text>
              <Text
                style={{
                  fontFamily: fontFamily.mono,
                  fontSize: 10,
                  letterSpacing: 0.1,
                  color: 'rgba(255,255,255,0.85)',
                  marginTop: 2,
                  textTransform: 'uppercase',
                }}
              >
                SHARED WITH DANI
              </Text>
            </View>
            <Press
              onPress={() => router.push('/checkout')}
              scale={false}
            >
              <View
                style={{
                  paddingHorizontal: 13,
                  paddingVertical: 8,
                  borderRadius: radius.pill,
                  backgroundColor: 'rgba(255,255,255,0.9)',
                }}
              >
                <Text
                  style={{
                    fontSize: 12.5,
                    fontWeight: '700',
                    color: colors.ink,
                    fontFamily: fontFamily.ui,
                  }}
                >
                  Manage
                </Text>
              </View>
            </Press>
          </View>
        )}

        {/* Preferences Group */}
        <Kick style={{ marginLeft: 4, marginBottom: 8, marginTop: 4 }}>
          preferences
        </Kick>
        <Group>
          <Row
            icon={ICONS.bell}
            label="Notifications"
            value="Daily 8pm"
            onPress={handleNotifications}
          />
          <Row
            icon={ICONS.flame}
            label="Spice level"
            value={state.spice}
            onPress={() => router.push('/(sheets)/spice')}
          />
          <Row
            icon={ICONS.grid}
            label="Home screen widget"
            onPress={() => router.push('/widgetSetup')}
          />
          <Row
            icon={ICONS.spark}
            label="Replay intro"
            onPress={() => router.push('/(onboarding)')}
          />
        </Group>

        {/* Account Group */}
        <Kick style={{ marginLeft: 4, marginBottom: 8, marginTop: 4 }}>
          account
        </Kick>
        <Group>
          <Row
            icon={ICONS.heart}
            label="Parallax Plus"
            value={state.plus ? 'Active' : 'Upgrade'}
            onPress={() => router.push('/checkout')}
          />
          <Row
            icon={ICONS.link}
            label="Manage pairing"
            onPress={handlePairing}
          />
          <Row
            icon={ICONS.logout}
            label="Unpair from Dani"
            danger
            onPress={handleUnpair}
          />
        </Group>

        {/* Version Footer */}
        <Text style={footerStyle}>
          parallax · v1.0 · made for two
        </Text>
      </ScrollView>

      {toastMsg && <Toast msg={toastMsg} />}
    </View>
  );
}
