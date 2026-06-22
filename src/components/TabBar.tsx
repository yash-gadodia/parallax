import React from 'react';
import { View, Text, ViewStyle, Dimensions } from 'react-native';
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
  const screenWidth = Dimensions.get('window').width;

  const containerStyle: ViewStyle = {
    position: 'absolute',
    left: 20,
    width: screenWidth - 40,
    bottom: 18 + (insets.bottom || 0),
    height: 62,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 253, 253, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    ...shadows.shadow,
  };

  return (
    <View style={containerStyle}>
      {tabs.map(([tabName, label, iconKey]) => {
        const isActive = tabName === active;
        const isRefocus = tabName === 'refocus';
        const iconColor = isRefocus || isActive ? colors.p1Deep : colors.inkMute;
        const labelWeight = isActive || isRefocus ? ('600' as const) : ('400' as const);

        return (
          <Press
            key={tabName}
            onPress={() => go(tabName)}
            scale={false}
            style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
          >
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                paddingVertical: 6,
                paddingHorizontal: 14,
                borderRadius: 16,
                // The active tab gets a soft pill so "selected" reads clearly even
                // though the Refocus heart is always coral.
                backgroundColor: isActive ? 'rgba(255,142,122,0.16)' : 'transparent',
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
