import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { useIdentity } from '../useIdentity';
import { GENERIC_PARTNER_NAME } from '../useProfile';

// Drive useIdentity off a mocked useProfile so we can assert the derivation logic
// (real name → initial; generic partner → hasPartner=false) without the network.
const mockProfile = {
  name: 'Yash',
  partnerName: 'Sam',
  spiceLevel: 'Flirty',
  notifyTime: null,
  togetherSince: null,
  streak: 0,
  loading: false,
  updateProfile: jest.fn(),
  updateSpiceLevel: jest.fn(),
};
jest.mock('../useProfile', () => ({
  GENERIC_PARTNER_NAME: 'your partner',
  useProfile: () => mockProfile,
}));

function Probe() {
  const { me, partner } = useIdentity();
  return React.createElement(
    Text,
    null,
    `${me.name}/${me.initial}|${partner.name}/${partner.initial}/${String(partner.hasPartner)}`
  );
}

describe('useIdentity', () => {
  it('derives real names and uppercase initials for a paired couple', async () => {
    mockProfile.name = 'Yash';
    mockProfile.partnerName = 'Sam';
    const { getByText } = await render(React.createElement(Probe));
    expect(getByText('Yash/Y|Sam/S/true')).toBeTruthy();
  });

  it('marks the partner as absent (no leaked name) while pending', async () => {
    mockProfile.name = 'Yash';
    mockProfile.partnerName = GENERIC_PARTNER_NAME;
    const { getByText } = await render(React.createElement(Probe));
    expect(getByText(`Yash/Y|${GENERIC_PARTNER_NAME}/·/false`)).toBeTruthy();
  });
});
