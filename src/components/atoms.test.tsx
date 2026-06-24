import { render, fireEvent } from '@testing-library/react-native';
import Btn from './Btn';
import Chip from './Chip';
import TabBar from './TabBar';

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

  // Guards the Press refactor (Animated.createAnimatedComponent(Pressable)):
  // the gradient kind='us' CTA - the app's primary button - must stay pressable.
  test('gradient (kind="us") Btn fires onPress', async () => {
    const onPress = jest.fn();
    const { getByTestId } = await render(
      <Btn kind="us" onPress={onPress} testID="test-btn-us">
        Start free trial
      </Btn>
    );
    fireEvent.press(getByTestId('test-btn-us'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test('Btn has accessibilityRole button', async () => {
    const { getByRole } = await render(
      <Btn onPress={() => {}} testID="test-btn-role">
        Go
      </Btn>
    );
    expect(getByRole('button')).toBeTruthy();
  });

  test('Btn derives accessibilityLabel from children and sub text', async () => {
    const { getByLabelText } = await render(
      <Btn onPress={() => {}} sub="about 90 seconds" testID="test-btn-label">
        Play today's three
      </Btn>
    );
    expect(getByLabelText("Play today's three, about 90 seconds")).toBeTruthy();
  });

  test('disabled Btn has accessibilityState disabled', async () => {
    const { getByTestId } = await render(
      <Btn onPress={() => {}} disabled testID="test-btn-a11y-disabled">
        Nope
      </Btn>
    );
    const el = getByTestId('test-btn-a11y-disabled');
    expect(el.props.accessibilityState).toMatchObject({ disabled: true });
  });

  test('Btn accepts explicit accessibilityLabel override', async () => {
    const { getByLabelText } = await render(
      <Btn onPress={() => {}} accessibilityLabel="Custom label" testID="test-btn-custom-label">
        Inner text
      </Btn>
    );
    expect(getByLabelText('Custom label')).toBeTruthy();
  });
});

describe('Chip', () => {
  test('selected Chip has accessibilityState.selected true', async () => {
    const { getByRole } = await render(
      <Chip selected={true} accessibilityLabel="Option A">
        Option A
      </Chip>
    );
    const chip = getByRole('button');
    expect(chip.props.accessibilityState).toMatchObject({ selected: true });
  });

  test('unselected Chip has accessibilityState.selected false', async () => {
    const { getByRole } = await render(
      <Chip selected={false} accessibilityLabel="Option B">
        Option B
      </Chip>
    );
    const chip = getByRole('button');
    expect(chip.props.accessibilityState).toMatchObject({ selected: false });
  });

  test('Chip without selected/onPress is not interactive (no role)', async () => {
    const { queryByRole } = await render(
      <Chip>just a label</Chip>
    );
    expect(queryByRole('button')).toBeNull();
  });
});

describe('TabBar', () => {
  test('each tab has accessibilityRole tab with correct label and selected state', async () => {
    const go = jest.fn();
    const { getAllByRole, getByLabelText } = await render(
      <TabBar active="home" go={go} />
    );
    const tabs = getAllByRole('tab');
    expect(tabs).toHaveLength(3);

    const todayTab = getByLabelText('Today');
    expect(todayTab.props.accessibilityState).toMatchObject({ selected: true });

    const refocusTab = getByLabelText('Refocus');
    expect(refocusTab.props.accessibilityState).toMatchObject({ selected: false });

    const usTab = getByLabelText('Us');
    expect(usTab.props.accessibilityState).toMatchObject({ selected: false });
  });

  test('TabBar fires go callback when a tab is pressed', async () => {
    const go = jest.fn();
    const { getByLabelText } = await render(
      <TabBar active="home" go={go} />
    );
    fireEvent.press(getByLabelText('Us'));
    expect(go).toHaveBeenCalledWith('us');
  });
});
