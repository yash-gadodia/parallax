import { TextStyle } from 'react-native';
import { colors } from './tokens';

export const fontFamily = {
  disp: 'InstrumentSerif_400Regular',
  ui: 'HankenGrotesk_400Regular',
  mono: 'SpaceMono_400Regular',
} as const;

export const kickStyle: TextStyle = {
  fontFamily: fontFamily.mono,
  fontSize: 10,
  lineHeight: 12,
  includeFontPadding: false,
  letterSpacing: 1.8,
  textTransform: 'uppercase',
  color: colors.inkMute,
};

export const serifStyle: TextStyle = {
  fontFamily: fontFamily.disp,
};
