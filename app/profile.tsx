import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { safeBack } from "../src/lib/nav";

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
import { useTodayState } from '../src/features/drops/useTodayState';
import { unpairCouple } from '../src/features/pairing/pairingActions';
import { nudge } from '../src/features/engagement/engagementActions';
import { usePurchases } from '../src/features/purchases/usePurchases';
import { signOut } from '../src/features/auth/authActions';
import { useProfile } from '../src/features/profile/useProfile';
import { requestPermissions, scheduleDailyNudge } from '../src/features/notifications';
import { deleteMyAccount, exportMyData } from '../src/features/account/accountActions';
import Sheet from '../src/components/Sheet';

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { couple } = useCouple();
  const { today } = useTodayState(couple?.id ?? null);
  const isPro = usePurchases((s) => s.isPro);
  const { name, partnerName, spiceLevel, notifyTime } = useProfile();
  const plus = isPro;
  // Nudge only makes sense when I've played and my partner genuinely hasn't.
  const showNudge =
    !!today?.i_answered && !today.partner_answered && today.state !== 'revealed';

  // Format HH:MM (24h) to a display string like "8:00 PM"
  function formatNotifyTime(t: string | null): string {
    if (!t) return 'Off';
    const [hhStr, mmStr] = t.split(':');
    const h = parseInt(hhStr, 10);
    const m = parseInt(mmStr, 10);
    if (isNaN(h) || isNaN(m)) return 'Off';
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `Daily ${h12}:${mmStr} ${period}`;
  }

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
      showToast(`Nudge sent to ${partnerName} 👋`);
    } catch {
      showToast('Failed to send nudge');
    }
  };

  const handleNotifications = async () => {
    const granted = await requestPermissions();
    if (!granted) {
      showToast('Enable notifications in Settings');
      return;
    }
    if (notifyTime) {
      await scheduleDailyNudge(notifyTime);
      showToast(`Daily nudge set for ${formatNotifyTime(notifyTime)}`);
    } else {
      showToast('Set a notify time in onboarding');
    }
  };

  const handleUnpair = async () => {
    if (!couple) {
      showToast('Not paired');
      return;
    }
    try {
      await unpairCouple(couple.id);
      router.replace('/login');
    } catch {
      showToast('Failed to unpair');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/login');
    } catch {
      showToast('Could not log out');
    }
  };

  const handleExportData = async () => {
    try {
      await exportMyData();
    } catch {
      showToast('Could not export data');
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteMyAccount();
    } catch {
      setDeleting(false);
      setShowDeleteConfirm(false);
      showToast('Could not delete account');
      return;
    }
    // Account is gone — sign out best-effort and leave regardless of a signOut hiccup.
    signOut().catch(() => {});
    router.replace('/login');
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
      <TopBar title="you & settings" onBack={() => safeBack(router)} />

      <ScrollView contentContainerStyle={scrollContentStyle}>
        {/* Identity Card - editable */}
        <Press onPress={() => router.push('/editProfile')} scale={false}>
          <View style={identityCardStyle}>
            <View style={{ position: 'relative' }}>
              <Tok who={{ initial: (name[0] || 'Y').toUpperCase() }} size={64} ring you />
              <View style={tokEditButtonStyle}>
                <Icon d={ICONS.pencil} size={12} color="#fff" />
              </View>
            </View>
            <View style={identityContentStyle}>
              <Serif s={28} c={colors.ink}>
                {name}
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
                <Tok who={{ initial: (partnerName[0] || 'D').toUpperCase() }} size={18} />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '700',
                    color: colors.p2Deep,
                    fontFamily: fontFamily.ui,
                  }}
                >
                  {partnerName}
                </Text>
              </View>
            </View>
            <Icon d={ICONS.chevR} size={18} color={colors.inkMute} />
          </View>
        </Press>

        {/* Nudge Banner — only when I've played and my partner hasn't yet */}
        {showNudge && (
          <LinearGradient
            colors={gradients.usSoft.colors}
            locations={gradients.usSoft.locations}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 22,
              paddingHorizontal: 16,
              paddingVertical: 16,
              marginBottom: 14,
              borderWidth: 1,
              borderColor: 'rgba(157,149,245,0.25)',
              overflow: 'hidden',
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
                  {`Give ${partnerName} a nudge`}
                </Text>
                <Kick c={colors.p2Deep} style={{ marginTop: 2 }}>
                  they haven't played today's drop
                </Kick>
              </View>
            </View>
            <View style={{ marginTop: 12 }}>
              <Btn kind="us" onPress={handleNudge} style={{ minHeight: 48 }}>
                <Text style={{ fontSize: 14.5, color: '#fff', fontFamily: fontFamily.ui }}>Send a nudge</Text>
              </Btn>
            </View>
          </LinearGradient>
        )}

        {/* Plus Banner (conditional) */}
        {plus && (
          <LinearGradient
            colors={gradients.us.colors}
            locations={gradients.us.locations}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 22,
              paddingHorizontal: 16,
              paddingVertical: 14,
              marginBottom: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              overflow: 'hidden',
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
                {`SHARED WITH ${partnerName.toUpperCase()}`}
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
          </LinearGradient>
        )}

        {/* Preferences Group */}
        <Kick style={{ marginLeft: 4, marginBottom: 8, marginTop: 4 }}>
          preferences
        </Kick>
        <Group>
          <Row
            icon={ICONS.bell}
            label="Notifications"
            value={formatNotifyTime(notifyTime)}
            onPress={handleNotifications}
          />
          <Row
            icon={ICONS.flame}
            label="Spice level"
            value={spiceLevel}
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
            value={plus ? 'Active' : 'Upgrade'}
            onPress={() => router.push(plus ? '/manageSub' : '/checkout')}
          />
          <Row
            icon={ICONS.share}
            label="Export my data"
            onPress={handleExportData}
          />
          <Row
            icon={ICONS.logout}
            label="Log out"
            onPress={handleSignOut}
          />
          <Row
            icon={ICONS.link}
            label={`Unpair from ${partnerName}`}
            danger
            onPress={handleUnpair}
          />
          <Row
            icon={ICONS.cross}
            label="Delete account"
            danger
            onPress={() => setShowDeleteConfirm(true)}
          />
        </Group>

        {/* Version Footer */}
        <Text style={footerStyle}>
          parallax · v1.0 · made for two
        </Text>
      </ScrollView>

      {toastMsg && <Toast msg={toastMsg} />}

      {showDeleteConfirm && (
        <Sheet title="Delete account?" onClose={() => setShowDeleteConfirm(false)}>
          <Text
            style={{
              fontSize: 14,
              color: colors.inkSoft,
              fontFamily: fontFamily.ui,
              lineHeight: 20,
              textAlign: 'center',
              marginBottom: 20,
            }}
          >
            This will permanently delete your profile and answers. Your partner's account and shared history are not affected.
          </Text>
          <Btn
            kind="coral"
            onPress={handleDeleteAccount}
            style={{ marginBottom: 10 }}
            disabled={deleting}
          >
            {deleting ? 'Deleting…' : 'Yes, delete my account'}
          </Btn>
          <Btn kind="soft" onPress={() => setShowDeleteConfirm(false)} disabled={deleting}>
            Cancel
          </Btn>
        </Sheet>
      )}
    </View>
  );
}
