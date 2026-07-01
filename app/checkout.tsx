import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { safeBack } from "../src/lib/nav";
import { colors, gradients, space, shadows, radius } from '../src/design/tokens';
import { fontFamily } from '../src/design/typography';
import { Icon, ICONS } from '../src/components/Icon';
import { Kick, Serif } from '../src/components/Text';
import Btn from '../src/components/Btn';
import Press from '../src/components/Press';
import TopBar from '../src/components/TopBar';
import { Mark } from '../src/components/Mark';
import { PLANS, PERKS } from '../src/content/pay';
import { usePurchases } from '../src/features/purchases/usePurchases';
import Toast from '../src/components/Toast';
import { track, EVENTS } from '../src/lib/analytics';
import { useIdentity } from '../src/features/profile/useIdentity';

type PlanId = 'year' | 'month';
type PaymentMethod = 'apple' | 'card';

export default function CheckoutScreen() {
  const router = useRouter();
  const { partner } = useIdentity();
  const [plan, setPlan] = useState<PlanId>('year');
  const [method, setMethod] = useState<PaymentMethod>('apple');
  const [confirming, setConfirming] = useState(false);
  const [failMsg, setFailMsg] = useState<string | null>(null);
  const offering = usePurchases((s) => s.offering);
  const purchase = usePurchases((s) => s.purchase);
  const restore = usePurchases((s) => s.restore);
  const setDemoPro = usePurchases((s) => s.setDemoPro);
  const [restoring, setRestoring] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const spinValue = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    track(EVENTS.PAYWALL_VIEWED);
  }, []);

  const pl = PLANS[plan];

  // Spinner animation
  useEffect(() => {
    if (confirming) {
      spinValue.setValue(0);
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [confirming]);

  const spinAnimationValue = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleStartFreeTrial = async () => {
    setConfirming(true);
    try {
      const pkg = offering ? (plan === 'year' ? offering.annual : offering.monthly) : null;
      if (pkg) {
        const unlocked = await purchase(pkg);
        if (!unlocked) {
          setConfirming(false);
          return; // cancelled or failed - stay on checkout
        }
      } else {
        // Expo Go / no live offering → demo unlock so the flow still completes.
        setDemoPro(true);
      }
      track(EVENTS.PURCHASE_COMPLETED, { plan });
      router.replace('/plusSuccess');
    } catch {
      setConfirming(false);
      setFailMsg("That didn't go through. No charge was made.");
      setTimeout(() => setFailMsg(null), 2600);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const pro = await restore();
      if (pro) {
        router.replace('/plusSuccess');
      } else {
        setToastMsg('No purchases to restore');
        setTimeout(() => setToastMsg(null), 2200);
      }
    } finally {
      setRestoring(false);
    }
  };

  const handleBack = () => {
    safeBack(router);
  };

  return (
    <LinearGradient
      colors={gradients.dawn.colors}
      locations={gradients.dawn.locations}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <TopBar title="parallax plus" onBack={handleBack} />

        <ScrollView
          contentContainerStyle={{
            paddingBottom: 150,
            paddingHorizontal: space.gutter,
          }}
          scrollEventThrottle={16}
        >
          {/* Spacing below TopBar */}
          <View style={{ height: 46 }} />

          {/* Hero: Mark + Heading */}
          <View
            style={{
              alignItems: 'center',
              marginBottom: 22,
            }}
          >
            <View
              style={{
                paddingVertical: 12,
                paddingHorizontal: 12,
                borderRadius: radius.cardSm,
                backgroundColor: colors.usSoft,
                marginBottom: 12,
              }}
            >
              <Mark size={36} />
            </View>

            <Serif
              s={34}
              c={colors.ink}
              style={{
                textAlign: 'center',
                marginBottom: 8,
                lineHeight: 34 * 1.05,
              }}
            >
              Unlock everything,{'\n'}for both of you.
            </Serif>

            <Text
              allowFontScaling={false}
              style={{
                fontSize: 14,
                color: colors.inkSoft,
                fontFamily: fontFamily.ui,
                textAlign: 'center',
              }}
            >
              One subscription covers you <Text style={{ fontStyle: 'italic', color: colors.inkSoft }}>and</Text> {partner.name}.
            </Text>
          </View>

          {/* Perks List */}
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: radius.cardMd,
              paddingVertical: 6,
              paddingHorizontal: space.cardPad,
              marginBottom: 20,
              ...shadows.shadowSoft,
            }}
          >
            {PERKS.map((perk, i) => (
              <View
                key={i}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingVertical: 12,
                  borderTopWidth: i ? 1 : 0,
                  borderTopColor: i ? colors.line : 'transparent',
                }}
              >
                {/* Emoji */}
                <Text
                  allowFontScaling={false}
                  style={{
                    fontSize: 20,
                  }}
                >
                  {perk.emoji}
                </Text>

                {/* Title + Desc */}
                <View style={{ flex: 1 }}>
                  <Text
                    allowFontScaling={false}
                    style={{
                      fontSize: 14,
                      fontWeight: '700',
                      color: colors.ink,
                      fontFamily: fontFamily.ui,
                    }}
                  >
                    {perk.title}
                  </Text>
                  <Text
                    allowFontScaling={false}
                    style={{
                      fontSize: 12,
                      color: colors.inkSoft,
                      fontFamily: fontFamily.ui,
                      marginTop: 1,
                    }}
                  >
                    {perk.desc}
                  </Text>
                </View>

                {/* Green check */}
                <Icon d={ICONS.check} size={16} color={colors.matchDeep} sw={2.4} />
              </View>
            ))}
          </View>

          {/* Plan Section Label */}
          <Kick style={{ marginBottom: 10, marginLeft: 4 }}>
            choose your plan
          </Kick>

          {/* Plan Cards */}
          <View style={{ gap: 11, marginBottom: 22 }}>
            <PlanCard
              id="year"
              selected={plan === 'year'}
              onSelect={() => setPlan('year')}
            />
            <PlanCard
              id="month"
              selected={plan === 'month'}
              onSelect={() => setPlan('month')}
            />
          </View>

          {/* Payment Section Label */}
          <Kick style={{ marginBottom: 10, marginLeft: 4 }}>
            payment
          </Kick>

          {/* Payment Method Toggle */}
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
            <PaymentMethodButton
              id="apple"
              label="Apple Pay"
              icon={ICONS.apple}
              selected={method === 'apple'}
              onSelect={() => setMethod('apple')}
            />
            <PaymentMethodButton
              id="card"
              label="Card"
              icon={ICONS.card}
              selected={method === 'card'}
              onSelect={() => setMethod('card')}
            />
          </View>

          {/* Card Fields (shown only if Card method selected) */}
          {method === 'card' && (
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: radius.cardXs,
                paddingHorizontal: 14,
                paddingVertical: 14,
                gap: 10,
                marginBottom: 6,
                ...shadows.shadowSoft,
              }}
            >
              <CardField
                label="Card number"
                placeholder="1234  5678  9012  3456"
                icon={ICONS.card}
              />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <CardField
                    label="Expiry"
                    placeholder="MM / YY"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <CardField
                    label="CVC"
                    placeholder="123"
                  />
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <Icon d={ICONS.lock} size={12} color={colors.inkMute} />
                <Text
                  allowFontScaling={false}
                  style={{
                    fontSize: 11,
                    color: colors.inkMute,
                    fontFamily: fontFamily.ui,
                  }}
                >
                  Encrypted & secure. Cancel anytime.
                </Text>
              </View>
            </View>
          )}

          {/* Apple Pay Info */}
          {method === 'apple' && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                justifyContent: 'center',
                marginTop: 2,
              }}
            >
              <Icon d={ICONS.lock} size={12} color={colors.inkMute} />
              <Text
                allowFontScaling={false}
                style={{
                  fontSize: 11.5,
                  color: colors.inkMute,
                  fontFamily: fontFamily.ui,
                }}
              >
                Confirm with Face ID. Cancel anytime.
              </Text>
            </View>
          )}

          {/* Restore purchases (App Store requirement) */}
          <Press onPress={handleRestore} scale={false} style={{ marginTop: 18 }}>
            <Text
              allowFontScaling={false}
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: colors.inkSoft,
                fontFamily: fontFamily.ui,
                textAlign: 'center',
                textDecorationLine: 'underline',
              }}
            >
              {restoring ? 'Restoring…' : 'Restore purchases'}
            </Text>
          </Press>
        </ScrollView>

        {/* Sticky CTA Footer */}
        <LinearGradient
          colors={['transparent', colors.bg1]}
          locations={[0, 0.36]}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            paddingHorizontal: space.gutter,
            paddingBottom: 22,
            paddingTop: 14,
            zIndex: 40,
          }}
        >
          <Btn
            kind="us"
            onPress={handleStartFreeTrial}
            disabled={confirming}
            sub={`7 days free, then ${pl.price}${pl.per}`}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {method === 'apple' && (
                <Icon d={ICONS.apple} size={18} color="#fff" fill="#fff" sw={0} />
              )}
              <Text
                allowFontScaling={false}
                style={{
                  fontSize: 16.5,
                  fontWeight: '700',
                  color: '#fff',
                  fontFamily: fontFamily.ui,
                }}
              >
                Start free trial
              </Text>
            </View>
          </Btn>
        </LinearGradient>

        {/* Confirming Overlay */}
        {confirming && (
          <BlurView
            intensity={18}
            tint="dark"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(40, 28, 50, 0.45)',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 18,
              zIndex: 90,
            }}
          >
            {/* Spinner */}
            <Animated.View
              style={{
                width: 54,
                height: 54,
                borderRadius: 999,
                borderWidth: 4,
                borderColor: 'rgba(255, 255, 255, 0.4)',
                borderTopColor: '#fff',
                transform: [{ rotate: spinAnimationValue }],
              }}
            />

            {/* Loading text */}
            <Text
              allowFontScaling={false}
              style={{
                color: '#fff',
                fontSize: 15,
                fontWeight: '600',
                fontFamily: fontFamily.ui,
              }}
            >
              Confirming…
            </Text>
          </BlurView>
        )}

        {failMsg && <Toast msg={failMsg} />}
        {toastMsg && <Toast msg={toastMsg} />}
      </SafeAreaView>
    </LinearGradient>
  );
}

interface PlanCardProps {
  id: PlanId;
  selected: boolean;
  onSelect: () => void;
}

function PlanCard({ id, selected, onSelect }: PlanCardProps) {
  const p = PLANS[id];
  const planName = id === 'year' ? 'Annual' : 'Monthly';

  return (
    <Press onPress={onSelect}>
      <View
        style={{
          position: 'relative',
          borderRadius: radius.cardSm,
          paddingVertical: 15,
          paddingHorizontal: 16,
          backgroundColor: selected ? colors.usSoft : colors.surface,
          borderWidth: 2,
          borderColor: selected ? colors.p2Deep : colors.line,
          ...(!selected ? shadows.shadowSoft : shadows.shadow),
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 11,
          }}
        >
          {/* Radio circle */}
          <View
            style={{
              width: 22,
              height: 22,
              borderRadius: 999,
              borderWidth: 2,
              borderColor: selected ? colors.p2Deep : colors.inkMute,
              backgroundColor: selected ? colors.p2Deep : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {selected && (
              <Icon d={ICONS.check} size={12} color="#fff" sw={2.6} />
            )}
          </View>

          {/* Plan name + monthly breakdown */}
          <View style={{ flex: 1 }}>
            <Text
              allowFontScaling={false}
              style={{
                fontSize: 15.5,
                fontWeight: '700',
                color: colors.ink,
                fontFamily: fontFamily.ui,
                textTransform: 'capitalize',
              }}
            >
              {planName}
            </Text>
            <Text
              allowFontScaling={false}
              style={{
                fontSize: 11,
                color: colors.inkSoft,
                fontFamily: fontFamily.mono,
                marginTop: 2,
              }}
            >
              {p.mo}
            </Text>
          </View>

          {/* Price (right aligned) */}
          <View style={{ alignItems: 'flex-end' }}>
            <Text
              allowFontScaling={false}
              style={{
                fontSize: 23,
                fontWeight: '700',
                color: colors.ink,
                fontFamily: fontFamily.disp,
              }}
            >
              {p.price}
            </Text>
            <Text
              allowFontScaling={false}
              style={{
                fontSize: 10,
                color: colors.inkMute,
                fontFamily: fontFamily.mono,
              }}
            >
              {p.per}
            </Text>
          </View>
        </View>

        {/* Badge (if any) */}
        {p.badge && (
          <LinearGradient
            colors={gradients.us.colors}
            locations={gradients.us.locations}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              position: 'absolute',
              top: -9,
              right: 14,
              paddingVertical: 3,
              paddingHorizontal: 9,
              borderRadius: 999,
              overflow: 'hidden',
            }}
          >
            <Text
              allowFontScaling={false}
              style={{
                fontSize: 8.5,
                fontWeight: '700',
                letterSpacing: 1,
                color: '#fff',
                fontFamily: fontFamily.mono,
                textTransform: 'uppercase',
              }}
            >
              {p.badge}
            </Text>
          </LinearGradient>
        )}
      </View>
    </Press>
  );
}

interface PaymentMethodButtonProps {
  id: PaymentMethod;
  label: string;
  icon: string;
  selected: boolean;
  onSelect: () => void;
}

function PaymentMethodButton({
  id,
  label,
  icon,
  selected,
  onSelect,
}: PaymentMethodButtonProps) {
  const isFilled = id === 'apple';

  return (
    <Press onPress={onSelect} style={{ flex: 1 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingVertical: 14,
          paddingHorizontal: 8,
          borderRadius: radius.input,
          backgroundColor: selected ? colors.ink : colors.surface,
          borderWidth: 1.5,
          borderColor: selected ? colors.ink : colors.line,
          ...shadows.shadowSoft,
        }}
      >
        <Icon
          d={icon}
          size={18}
          color={selected ? '#fff' : colors.ink}
          fill={isFilled ? (selected ? '#fff' : colors.ink) : 'none'}
          sw={isFilled ? 0 : 1.6}
        />
        <Text
          allowFontScaling={false}
          style={{
            fontSize: 14.5,
            fontWeight: '700',
            color: selected ? '#fff' : colors.ink,
            fontFamily: fontFamily.ui,
          }}
        >
          {label}
        </Text>
      </View>
    </Press>
  );
}

interface CardFieldProps {
  label: string;
  placeholder: string;
  icon?: string;
}

function CardField({ label, placeholder, icon }: CardFieldProps) {
  const [value, setValue] = React.useState('');

  return (
    <View>
      <Text
        allowFontScaling={false}
        style={{
          fontSize: 9.5,
          letterSpacing: 1,
          textTransform: 'uppercase',
          color: colors.inkMute,
          fontFamily: fontFamily.mono,
          marginBottom: 5,
        }}
      >
        {label}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingHorizontal: 13,
          paddingVertical: 12,
          borderRadius: radius.sm,
          backgroundColor: colors.sunken,
          borderWidth: 1,
          borderColor: colors.line,
        }}
      >
        {icon && (
          <Icon d={icon} size={16} color={colors.inkMute} />
        )}
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={colors.inkMute}
          value={value}
          onChangeText={setValue}
          style={{
            flex: 1,
            fontSize: 14.5,
            fontWeight: '600',
            fontFamily: fontFamily.ui,
            color: colors.ink,
            minWidth: 0,
            padding: 0,
          }}
        />
      </View>
    </View>
  );
}
