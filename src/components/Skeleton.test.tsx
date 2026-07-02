import React from 'react';
import { render } from '@testing-library/react-native';
import { Skeleton } from './Skeleton';
import { colors, radius } from '../design/tokens';

describe('Skeleton', () => {
  it('renders a placeholder block with the exact height, width and sunken tone', async () => {
    const { getByTestId } = await render(<Skeleton h={90} w={120} />);

    const block = getByTestId('skeleton');
    const flat = Object.assign({}, ...[block.props.style].flat(2).filter(Boolean));
    expect(flat.height).toBe(90);
    expect(flat.width).toBe(120);
    expect(flat.borderRadius).toBe(radius.tile);
    expect(flat.backgroundColor).toBe(colors.sunken);
  });

  it('defaults to full width and accepts a custom testID and radius', async () => {
    const { getByTestId, queryByTestId } = await render(
      <Skeleton h={44} br={22} testID="skeleton-row" />
    );

    expect(queryByTestId('skeleton')).toBeNull();
    const block = getByTestId('skeleton-row');
    const flat = Object.assign({}, ...[block.props.style].flat(2).filter(Boolean));
    expect(flat.height).toBe(44);
    expect(flat.width).toBe('100%');
    expect(flat.borderRadius).toBe(22);
  });
});
