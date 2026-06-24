import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../design/tokens';

export const ICONS = {
  spark: 'M10 2.5c.4 3 1.5 4.1 4.5 4.5-3 .4-4.1 1.5-4.5 4.5-.4-3-1.5-4.1-4.5-4.5 3-.4 4.1-1.5 4.5-4.5z',
  home: 'M3.5 9.5L10 4l6.5 5.5M5 8.5V16h10V8.5',
  cards: 'M3 6.5l6.2-2.2a1 1 0 011.3.6l3.4 9.2M5.5 8h9a1 1 0 011 1v6a1 1 0 01-1 1h-9a1 1 0 01-1-1V9a1 1 0 011-1z',
  us: 'M7.2 12.5a3.3 3.3 0 100-6.5 3.3 3.3 0 000 6.5zM12.8 12.5a3.3 3.3 0 100-6.5',
  back: 'M12 4l-5 6 5 6',
  fwd: 'M8 4l5 6-5 6',
  chevR: 'M8 5l5 5-5 5',
  check: 'M4.5 10.5l3.2 3.2L15.5 6',
  cross: 'M5.5 5.5l9 9M14.5 5.5l-9 9',
  share: 'M10 13V3.5m0 0L7 6.5m3-3l3 3M5 10.5V15a1 1 0 001 1h8a1 1 0 001-1v-4.5',
  flame: 'M10 2.5c0 3.5 3.5 4.5 3.5 8a3.5 3.5 0 01-7 0c0-1.8 1-2.8 1.8-3.6.7.7.7 1.6.7 2.4 1-1 1-2.6 0-4.3 0-1.2.5-2 1-2.9z',
  lock: 'M6 9V7a4 4 0 018 0v2M5 9h10v6a1 1 0 01-1 1H6a1 1 0 01-1-1V9z',
  heart: 'M10 16S3.5 12 3.5 7.7A3.2 3.2 0 0110 6a3.2 3.2 0 016.5 1.7C16.5 12 10 16 10 16z',
  copy: 'M7.5 7.5h7v7h-7zM5 12.5H4V4h9v1',
  close: 'M5 5l10 10M15 5L5 15',
  bell: 'M10 3a3.4 3.4 0 00-3.4 3.4c0 3.9-1.4 4.9-1.4 4.9h9.6s-1.4-1-1.4-4.9A3.4 3.4 0 0010 3zM8.5 14.5a1.5 1.5 0 003 0',
  gear: 'M3 6.5h8M15 6.5h2M3 13.5h2M9 13.5h8M12 4.5v4M6 11.5v4',
  plus: 'M10 4.5v11M4.5 10h11',
  send: 'M16.5 3.5L8 12M16.5 3.5l-5.5 13-2.8-6.2L2 7.5l14.5-4z',
  chat: 'M4 5.5h12a1 1 0 011 1v6a1 1 0 01-1 1H9l-3.5 3v-3H4a1 1 0 01-1-1v-6a1 1 0 011-1z',
  pencil: 'M13.3 4.4l2.3 2.3M4 16l1-3.6 8.3-8.3 2.6 2.6L7.6 15 4 16z',
  bolt: 'M11 2.5L5 11h4l-1 6.5L15 9h-4l1-6.5z',
  link: 'M8.4 11.6l3.2-3.2M10.5 6.3l1-1a2.8 2.8 0 014 4l-1 1M9.5 13.7l-1 1a2.8 2.8 0 01-4-4l1-1',
  logout: 'M8 5.5V4a1 1 0 011-1h6a1 1 0 011 1v12a1 1 0 01-1 1H9a1 1 0 01-1-1v-1.5M11 10H3m0 0l3-3m-3 3l3 3',
  grid: 'M4 4h5v5H4zM11 4h5v5h-5zM4 11h5v5H4zM11 11h5v5h-5z',
  stack: 'M10 3l7 3.5-7 3.5-7-3.5L10 3zM3 11l7 3.5 7-3.5M3 14.5l7 3.5 7-3.5',
  apple: 'M13.6 10.6c0-1.7 1.4-2.5 1.5-2.6-.8-1.2-2.1-1.3-2.5-1.4-1.1-.1-2.1.6-2.6.6-.5 0-1.4-.6-2.3-.6-1.2 0-2.3.7-2.9 1.8-1.2 2.1-.3 5.3.9 7 .6.8 1.3 1.8 2.2 1.7.9 0 1.2-.6 2.3-.6 1.1 0 1.3.6 2.3.6.9 0 1.5-.8 2.1-1.7.7-1 .9-1.9.9-2-.1 0-1.8-.7-1.9-2.8zM11.9 5.5c.5-.6.8-1.4.7-2.2-.7 0-1.5.5-2 1.1-.4.5-.8 1.3-.7 2.1.8 0 1.6-.4 2-1z',
  card: 'M3 6h14a1 1 0 011 1v6a1 1 0 01-1 1H3a1 1 0 01-1-1V7a1 1 0 011-1zM2 9h16M5 12.5h3',
  star: 'M10 2.8l2.1 4.5 4.9.5-3.7 3.3 1.1 4.8L10 13.9 5.6 16l1.1-4.8L3 7.8l4.9-.5z',
};

interface IconProps {
  d: string;
  size?: number;
  color?: string;
  sw?: number;
  fill?: string;
  style?: object;
  accessibilityLabel?: string;
}

export function Icon({
  d,
  size = 20,
  color = colors.ink,
  sw = 1.6,
  fill = 'none',
  style,
  accessibilityLabel,
}: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill={fill}
      style={style}
      accessibilityLabel={accessibilityLabel}
      accessible={!!accessibilityLabel}
    >
      <Path
        d={d}
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
