import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
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

  const containerStyle: ViewStyle = {
    position: 'absolute',
    top: insets.top,
    left: 0,
    right: 0,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
    zIndex: 30,
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
