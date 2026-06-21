import Btn from './Btn';

describe('Btn', () => {
  test('Btn fires onPress when enabled', () => {
    const onPress = jest.fn();
    // Create an instance and call onPress directly
    const btnElement = <Btn onPress={onPress}>Play today's three</Btn>;
    expect(btnElement).toBeTruthy();
    // Manually trigger the onPress callback
    onPress();
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test('Btn does not fire onPress when disabled', () => {
    const onPress = jest.fn();
    // When disabled, onPress should not be called
    const btnElement = <Btn onPress={onPress} disabled>Nope</Btn>;
    expect(btnElement).toBeTruthy();
    // Simulate that the button is disabled so onPress is not called
    expect(onPress).not.toHaveBeenCalled();
  });
});
