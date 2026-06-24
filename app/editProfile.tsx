import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  ViewStyle,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets  } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { safeBack } from "../src/lib/nav";
import { colors, gradients, radius, shadows, space } from '../src/design/tokens';
import { fontFamily } from '../src/design/typography';
import { Kick } from '../src/components/Text';
import TopBar from '../src/components/TopBar';
import Tok from '../src/components/Tok';
import Btn from '../src/components/Btn';
import Press from '../src/components/Press';
import Toast from '../src/components/Toast';
import { Icon, ICONS } from '../src/components/Icon';
import { DawnBlobs } from '../src/components/DawnBlobs';
import { useProfile } from '../src/features/profile/useProfile';

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { name: profileName, partnerName, togetherSince, updateProfile } = useProfile();
  const [name, setName] = useState('');
  const [since, setSince] = useState('');
  const [showCameraToast, setShowCameraToast] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);

  useEffect(() => {
    setName(profileName);
    setSince(togetherSince || 'February 2024');
  }, [profileName, togetherSince]);

  const handleCameraPress = () => {
    setShowCameraToast(true);
    setTimeout(() => setShowCameraToast(false), 2000);
  };

  const handleSaveChanges = async () => {
    await updateProfile(name, since);
    setShowSaveToast(true);
    setTimeout(() => {
      setShowSaveToast(false);
      safeBack(router);
    }, 2000);
  };

  const handleBack = () => {
    safeBack(router);
  };

  // Field component for editable text inputs
  const Field = ({
    label,
    value,
    onChange,
    readOnly = false,
    hint,
  }: {
    label: string;
    value: string;
    onChange?: (text: string) => void;
    readOnly?: boolean;
    hint?: string;
  }) => (
    <View>
      <Text
        allowFontScaling={false}
        style={{
          fontFamily: fontFamily.mono,
          fontSize: 9.5,
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          color: colors.inkMute,
          marginBottom: 6,
          lineHeight: 10,
        }}
      >
        {label}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingVertical: 14,
          paddingHorizontal: 15,
          borderRadius: radius.tile,
          backgroundColor: readOnly ? colors.sunken : colors.surface,
          borderWidth: 1,
          borderColor: colors.line,
          ...(readOnly ? {} : shadows.shadowSoft),
        }}
      >
        <TextInput
          value={value}
          onChangeText={onChange}
          editable={!readOnly}
          placeholderTextColor={colors.inkMute}
          allowFontScaling={false}
          style={{
            flex: 1,
            fontSize: 15.5,
            fontWeight: '600',
            fontFamily: fontFamily.ui,
            color: readOnly ? colors.inkSoft : colors.ink,
            minWidth: 0,
            padding: 0,
          }}
        />
        {hint && (
          <Text
            allowFontScaling={false}
            style={{
              fontSize: 12,
              color: colors.inkMute,
            }}
          >
            {hint}
          </Text>
        )}
      </View>
    </View>
  );

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

      <TopBar title="edit profile" onBack={handleBack} />

      <ScrollView
        contentContainerStyle={{
          paddingBottom: 140,
          paddingHorizontal: space.gutter,
        }}
        style={{ flex: 1 }}
      >
        {/* Top padding - clear the absolute TopBar (insets.top + 52) */}
        <View style={{ height: insets.top + 64 }} />

        {/* Avatar section */}
        <View
          style={{
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: 24,
          }}
        >
          <View style={{ position: 'relative' }}>
            {/* Avatar */}
            <Tok
              who={{ initial: (name[0] || 'Y').toUpperCase() }}
              size={88}
              you
              ring
            />

            {/* Camera overlay button */}
            <Press
              onPress={handleCameraPress}
              scale={false}
              style={{
                position: 'absolute',
                bottom: -2,
                right: -2,
                width: 32,
                height: 32,
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: radius.pill,
                  backgroundColor: colors.ink,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 3,
                  borderColor: colors.surface,
                }}
              >
                <Icon
                  d="M5 7h2l1-1.5h4L13 7h2a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1V8a1 1 0 011-1zM10 13a2.3 2.3 0 100-4.6 2.3 2.3 0 000 4.6z"
                  size={15}
                  color="#fff"
                  sw={1.5}
                />
              </View>
            </Press>
          </View>

          {/* Change photo link */}
          <Press onPress={handleCameraPress} scale={false} style={{ marginTop: 10 }}>
            <Text
              allowFontScaling={false}
              style={{
                fontSize: 13.5,
                fontWeight: '700',
                color: colors.p2Deep,
              }}
            >
              Change photo
            </Text>
          </Press>
        </View>

        {/* Form fields */}
        <View style={{ flexDirection: 'column', gap: 16 }}>
          <Field label="Your name" value={name} onChange={setName} />
          <Field label="Together since" value={since} onChange={setSince} hint="📅" />

          {/* Paired with read-only card */}
          <View>
            <Text
              allowFontScaling={false}
              style={{
                fontFamily: fontFamily.mono,
                fontSize: 9.5,
                letterSpacing: 1.2,
                textTransform: 'uppercase',
                color: colors.inkMute,
                marginBottom: 6,
                lineHeight: 10,
              }}
            >
              paired with
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 11,
                paddingVertical: 12,
                paddingHorizontal: 15,
                borderRadius: radius.tile,
                backgroundColor: colors.sunken,
                borderWidth: 1,
                borderColor: colors.line,
              }}
            >
              {/* Partner avatar */}
              <Tok who={{ initial: (partnerName[0] || 'D').toUpperCase() }} size={32} />

              {/* Partner info */}
              <View style={{ flex: 1 }}>
                <Text
                  allowFontScaling={false}
                  style={{
                    fontSize: 15,
                    fontWeight: '700',
                    color: colors.ink,
                  }}
                >
                  {partnerName}
                </Text>
                <Text
                  allowFontScaling={false}
                  style={{
                    fontSize: 12,
                    lineHeight: 12 * 1.4,
                    color: colors.inkSoft,
                    marginTop: 2,
                  }}
                >
                  {`paired · ${togetherSince || 'Feb 2024'}`}
                </Text>
              </View>

              {/* LINKED badge */}
              <Text
                allowFontScaling={false}
                style={{
                  fontFamily: fontFamily.mono,
                  fontSize: 9,
                  fontWeight: '700',
                  letterSpacing: 0.8,
                  color: colors.matchDeep,
                  backgroundColor: 'rgba(84,194,160,0.16)',
                  paddingVertical: 4,
                  paddingHorizontal: 8,
                  borderRadius: radius.pill,
                }}
              >
                LINKED
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sticky save button */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: space.gutter,
          paddingVertical: 22,
          zIndex: 40,
          backgroundColor: 'transparent',
        }}
      >
        <LinearGradient
          colors={[colors.bg1, colors.bg1]}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 100,
            opacity: 0.9,
          }}
        />
        <Btn kind="us" onPress={handleSaveChanges}>
          Save changes
        </Btn>
      </View>

      {/* Camera toast */}
      {showCameraToast && (
        <Toast msg="Camera roll, pick a photo" />
      )}

      {/* Save toast */}
      {showSaveToast && (
        <Toast msg="Changes saved" />
      )}
    </View>
  );
}
