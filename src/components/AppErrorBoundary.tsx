import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, space } from '../design/tokens';
import { fontFamily } from '../design/typography';
import { Serif } from './Text';
import Btn from './Btn';

interface Props {
  children: React.ReactNode;
}
interface State {
  error: Error | null;
}

// Catches render-time crashes anywhere in the tree and shows a calm, recoverable
// screen instead of a white screen / red box. (Render errors only — async/promise
// rejections are handled where they happen.)
export class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    // Surface for dev / future crash reporting (Sentry, etc.).
    console.error('App crashed:', error);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <LinearGradient
          colors={gradients.dawn.colors}
          locations={gradients.dawn.locations}
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            padding: space.gutter,
          }}
        >
          <Serif s={30} style={{ textAlign: 'center', marginBottom: 10 }}>
            Something went sideways
          </Serif>
          <Text
            allowFontScaling={false}
            style={{
              color: colors.inkSoft,
              fontFamily: fontFamily.ui,
              fontSize: 15,
              lineHeight: 22,
              textAlign: 'center',
              marginBottom: 28,
              maxWidth: 300,
            }}
          >
            A small hiccup on our end. Tap below to try again.
          </Text>
          <Btn kind="us" onPress={this.reset}>
            Try again
          </Btn>
        </LinearGradient>
      );
    }
    return this.props.children;
  }
}
