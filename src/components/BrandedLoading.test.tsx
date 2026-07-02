import React from 'react';
import { processColor } from 'react-native';
import { render } from '@testing-library/react-native';
import { BrandedLoading } from './BrandedLoading';
import { gradients } from '../design/tokens';

// Depth-first walk of the rendered JSON tree.
const collectTypes = (node: unknown, acc: string[] = []): string[] => {
  if (!node || typeof node !== 'object') return acc;
  if (Array.isArray(node)) {
    node.forEach((child) => collectTypes(child, acc));
    return acc;
  }
  const el = node as { type?: string; children?: unknown };
  if (el.type) acc.push(el.type);
  collectTypes(el.children ?? null, acc);
  return acc;
};

describe('BrandedLoading', () => {
  it('renders the dawn-gradient branded container, not a blank frame', async () => {
    const { getByTestId, toJSON } = await render(<BrandedLoading />);

    const container = getByTestId('branded-loading');
    // expo-linear-gradient processes the hex colors to native ints.
    expect(container.props.colors).toEqual(
      gradients.dawn.colors.map((c) => processColor(c))
    );
    expect(toJSON()).not.toBeNull();
  });

  it('is font-free: no Text is rendered while fonts may still be loading', async () => {
    const { toJSON } = await render(<BrandedLoading />);
    expect(collectTypes(toJSON())).not.toContain('Text');
  });
});
