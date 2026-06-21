import { render, fireEvent } from '@testing-library/react-native';
import Btn from './Btn';

describe('Btn', () => {
  test('Btn fires onPress when enabled', async () => {
    const onPress = jest.fn();
    const { getByTestId } = await render(
      <Btn onPress={onPress} testID="test-btn-enabled">
        Play today's three
      </Btn>
    );
    fireEvent.press(getByTestId('test-btn-enabled'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test('Btn does not fire when disabled', async () => {
    const onPress = jest.fn();
    const { getByTestId } = await render(
      <Btn onPress={onPress} disabled testID="test-btn-disabled">
        Nope
      </Btn>
    );
    fireEvent.press(getByTestId('test-btn-disabled'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
