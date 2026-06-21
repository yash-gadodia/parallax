import { ViewStyle, ColorValue } from 'react-native';

export const colors = {
  bg0: '#FBF1F2',
  bg1: '#F1ECFB',
  surface: '#FFFDFD',
  surfaceSoft: 'rgba(255,255,255,0.62)',
  sunken: '#F4ECF4',
  line: 'rgba(58,51,64,0.09)',
  ink: '#3A3340',
  inkSoft: '#8B8398',
  inkMute: '#B7B0C2',
  p1: '#FF8E7A',
  p1Deep: '#EF6A53',
  p2: '#9D95F5',
  p2Deep: '#7064E6',
  match: '#54C2A0',
  matchDeep: '#2E9C7C',
  usSoft: 'rgba(218, 202, 245, 0.6)',
};

export const gradients = {
  us: {
    colors: ['#FF8E7A', '#C387C9', '#9D95F5'] as const satisfies readonly [ColorValue, ColorValue, ...ColorValue[]],
    locations: [0, 0.48, 1] as const satisfies readonly number[],
  },
  usSoft: {
    colors: ['rgba(255,142,122,0.16)', 'rgba(157,149,245,0.16)'] as const satisfies readonly [ColorValue, ColorValue, ...ColorValue[]],
    locations: [0, 1] as const satisfies readonly number[],
  },
  dawn: {
    colors: ['#FCEFF0', '#F6EDF6', '#EEEDFB'] as const satisfies readonly [ColorValue, ColorValue, ...ColorValue[]],
    locations: [0, 0.42, 1] as const satisfies readonly number[],
  },
} as const;

export const shadows = {
  shadow: {
    shadowColor: 'rgba(112,100,230,0.13)',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 1,
    shadowRadius: 22,
    elevation: 16,
  },
  shadowSoft: {
    shadowColor: 'rgba(112,100,230,0.10)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 10,
  },
  shadowPop: {
    shadowColor: 'rgba(58,40,70,0.18)',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 1,
    shadowRadius: 22,
    elevation: 16,
  },
} as const satisfies Record<string, ViewStyle>;

export const radius = {
  pill: 999,
  card: 26,
  cardLg: 30,
  tile: 14,
  cardMd: 22,
  cardSm: 20,
  cardXs: 18,
  input: 16,
  sm: 12,
};

export const space = {
  gutter: 20,
  cardPad: 16,
  gap: 12,
};
