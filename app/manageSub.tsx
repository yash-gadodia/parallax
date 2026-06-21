import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { colors, gradients, radius, shadows, space } from '../src/design/tokens';
import { Kick } from '../src/components/Text';
import TopBar from '../src/components/TopBar';
import Btn from '../src/components/Btn';
import Card from '../src/components/Card';
import Press from '../src/components/Press';
import { Mark } from '../src/components/Mark';
import { DawnBlobs } from '../src/components/DawnBlobs';
import Toast from '../src/components/Toast';

// Status card with Mark icon
function StatusCard() {
  return (
    <LinearGradient
      colors={gradients.usSoft.colors}
      locations={gradients.usSoft.locations}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        borderRadius: radius.cardLg,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(157,149,245,0.25)',
        marginBottom: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <Mark size={24} />

      <View style={{ flex: 1 }}>
        <Text
          allowFontScaling={false}
          style={{
            fontSize: 16,
            fontWeight: '700',
            color: colors.ink,
          }}
        >
          Parallax Plus
        </Text>
        <Kick
          c={colors.matchDeep}
          style={{
            marginTop: 3,
          }}
        >
          ● active · free trial
        </Kick>
      </View>

      <Text
        allowFontScaling={false}
        style={{
          fontSize: 9,
          fontWeight: '700',
          letterSpacing: 1.6,
          color: '#fff',
          backgroundColor: colors.p2,
          paddingVertical: 4,
          paddingHorizontal: 9,
          borderRadius: radius.pill,
        }}
      >
        ANNUAL
      </Text>
    </LinearGradient>
  );
}

// Plan details row
function PlanDetailsCard() {
  const rows = [
    ['Plan', 'Annual · $39.99/yr'],
    ['Free trial ends', 'in 7 days'],
    ['Renews', 'Jun 15, 2026'],
    ['Shared with', 'Dani'],
  ];

  return (
    <Card style={{ overflow: 'hidden', marginTop: 14 }}>
      {rows.map((row, i) => (
        <View
          key={`row-${i}`}
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingVertical: 14,
            paddingHorizontal: 16,
            borderTopWidth: i ? 1 : 0,
            borderTopColor: colors.line,
          }}
        >
          <Text
            allowFontScaling={false}
            style={{
              fontSize: 14.5,
              color: colors.inkSoft,
              fontWeight: '600',
            }}
          >
            {row[0]}
          </Text>
          <Text
            allowFontScaling={false}
            style={{
              fontSize: 14.5,
              color: colors.ink,
              fontWeight: '700',
            }}
          >
            {row[1]}
          </Text>
        </View>
      ))}
    </Card>
  );
}

export default function ManageSubScreen() {
  const router = useRouter();
  const [switchToastMsg, setSwitchToastMsg] = useState<string | null>(null);
  const [cancelToastMsg, setCancelToastMsg] = useState<string | null>(null);

  const handleSwitchPlan = () => {
    // GATE: RevenueCat purchase / backend call to switch plan
    setSwitchToastMsg('Plan switched to monthly');
    setTimeout(() => setSwitchToastMsg(null), 2000);
  };

  const handleCancelSubscription = () => {
    // GATE: RevenueCat entitlement revocation / backend call to cancel
    Alert.alert(
      'Cancel Parallax Plus?',
      "You'll lose access to Plus features at the end of your billing period.",
      [
        {
          text: 'Keep subscription',
          onPress: () => {},
          style: 'cancel',
        },
        {
          text: 'Cancel',
          onPress: () => {
            setCancelToastMsg('Subscription cancelled');
            setTimeout(() => setCancelToastMsg(null), 2000);
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleBack = () => {
    router.back();
  };

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

      <TopBar title="manage plus" onBack={handleBack} />

      <ScrollView
        contentContainerStyle={{
          paddingBottom: 40,
          paddingHorizontal: space.gutter,
        }}
        style={{ flex: 1 }}
      >
        {/* Top padding */}
        <View style={{ height: 50 }} />

        {/* Status Card */}
        <StatusCard />

        {/* Plan Details */}
        <PlanDetailsCard />

        {/* Action Buttons */}
        <View
          style={{
            marginTop: 18,
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <Btn kind="soft" onPress={handleSwitchPlan}>
            Switch to monthly
          </Btn>

          <Press onPress={handleCancelSubscription}>
            <View
              style={{
                paddingVertical: 14,
                paddingHorizontal: 16,
                alignItems: 'center',
              }}
            >
              <Text
                allowFontScaling={false}
                style={{
                  fontSize: 14.5,
                  fontWeight: '700',
                  color: colors.p1Deep,
                  textAlign: 'center',
                }}
              >
                Cancel subscription
              </Text>
            </View>
          </Press>
        </View>
      </ScrollView>

      {switchToastMsg && <Toast msg={switchToastMsg} />}
      {cancelToastMsg && <Toast msg={cancelToastMsg} />}
    </View>
  );
}
