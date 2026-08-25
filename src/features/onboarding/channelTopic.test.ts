import { nextOnboardingChannelTopic } from './channelTopic';

describe('nextOnboardingChannelTopic', () => {
  it('never repeats a topic for the same couple', () => {
    const a = nextOnboardingChannelTopic('couple-1');
    const b = nextOnboardingChannelTopic('couple-1');
    const c = nextOnboardingChannelTopic('couple-1');

    expect(new Set([a, b, c]).size).toBe(3);
  });

  it('carries the couple id and a numeric suffix', () => {
    expect(nextOnboardingChannelTopic('couple-9')).toMatch(
      /^onboarding-couple-couple-9-\d+$/
    );
  });

  it('keeps counting across different couples', () => {
    const first = nextOnboardingChannelTopic('couple-a');
    const second = nextOnboardingChannelTopic('couple-b');

    const suffix = (t: string) => Number(t.slice(t.lastIndexOf('-') + 1));
    expect(suffix(second)).toBe(suffix(first) + 1);
  });
});
