import React from 'react';
import { View, Text, ViewStyle, useWindowDimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Press from './Press';
import { Icon, ICONS } from './Icon';
import { colors, shadows } from '../design/tokens';
import { fontFamily } from '../design/typography';

type TabName = 'home' | 'refocus' | 'us';

interface TabBarProps {
  active: TabName;
  go: (name: TabName) => void;
}

const tabs: Array<[TabName, string, string]> = [
  ['home', 'Today', 'home'],
  ['refocus', 'Refocus', 'heart'],
  ['us', 'Us', 'us'],
];

export default function TabBar({ active, go }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const containerStyle: ViewStyle = {
    position: 'absolute',
    left: 20,
    width: width - 40,
    bottom: 18 + insets.bottom,
    height: 62,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    zIndex: 40,
    ...shadows.shadow,
  };

  const blurContainerStyle: ViewStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 253, 253, 0.66)',
  };

  return (
    <View style={containerStyle}>
      <BlurView intensity={80} tint="light" style={blurContainerStyle} />
      {tabs.map((tabData) => {
        const [tabName, label, iconKey] = tabData;
        const isActive = tabName === active;
        const isRefocus = tabName === 'refocus';
        const iconColor = isRefocus || isActive ? colors.p1Deep : colors.inkMute;
        const labelWeight = isActive || isRefocus ? (600 as const) : (400 as const);

        return (
          <Press
            key={tabName}
            onPress={() => go(tabName)}
            scale={false}
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 10,
            }}
          >
            <View
              style={{
                justifyContent: 'center',
                alignItems: 'center',
                gap: 3,
              }}
            >
              <Icon
                d={ICONS[iconKey as keyof typeof ICONS]}
                size={isRefocus ? 22 : 21}
                color={iconColor}
                sw={isRefocus ? 1.5 : isActive ? 2 : 1.6}
                fill={isRefocus ? colors.p1 : 'none'}
              />
              <Text
                style={{
                  fontFamily: fontFamily.mono,
                  fontSize: 9,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  fontWeight: labelWeight,
                  color: iconColor,
                }}
              >
                {label}
              </Text>
            </View>
          </Press>
        );
      })}
    </View>
  );
}
