import React from 'react';
import { View, Text, ViewStyle, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Press from './Press';
import { Icon, ICONS } from './Icon';
import { colors } from '../design/tokens';
import { fontFamily } from '../design/typography';

interface TopBarProps {
  title: string;
  onBack: () => void;
  right?: React.ReactNode;
}

export default function TopBar({ title, onBack, right }: TopBarProps) {
  const insets = useSafeAreaInsets();

  // Spans the status bar + bar height with a frosted backdrop so scrolling
  // content never bleeds through the header (it's a transparent absolute overlay).
  const containerStyle: ViewStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: insets.top + 52,
    paddingTop: insets.top,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
    zIndex: 30,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  };

  const backButtonStyle: ViewStyle = {
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.line,
    justifyContent: 'center',
    alignItems: 'center',
  };

  const titleStyle = {
    flex: 1,
    textAlign: 'center' as const,
    fontFamily: fontFamily.mono,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
    color: colors.inkSoft,
  };

  const rightSlotStyle: ViewStyle = {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  };

  return (
    <View style={containerStyle}>
      <BlurView
        experimentalBlurMethod="dimezisBlurView"
        intensity={32}
        tint="light"
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: 'rgba(255,255,255,0.55)' },
        ]}
      />
      <Press
        onPress={onBack}
        scale={false}
        testID="topbar-back"
        style={backButtonStyle}
      >
        <Icon d={ICONS.back} size={20} color={colors.ink} />
      </Press>
      <Text style={titleStyle}>{title}</Text>
      <View style={rightSlotStyle}>{right}</View>
    </View>
  );
}
