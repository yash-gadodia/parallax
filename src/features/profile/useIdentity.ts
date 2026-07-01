import { useProfile, GENERIC_PARTNER_NAME } from './useProfile';

export { GENERIC_PARTNER_NAME };

export interface Person {
  name: string;
  initial: string;
}

function toInitial(name: string, fallback: string): string {
  const c = name.trim().charAt(0);
  return c ? c.toUpperCase() : fallback;
}

// Single source of truth for the two people in the app: the current user ("me")
// and their partner. Screens use this instead of hardcoding YOU={initial:'Y'} /
// PAR={initial:'D'} / the literal "Dani". Real names when signed in + paired; a
// generic partner label while pending; the demo persona only when unauthenticated
// (useProfile's DEMO fallback, where the sim partner genuinely is "Dani").
export function useIdentity(): {
  me: Person;
  partner: Person & { hasPartner: boolean };
  loading: boolean;
} {
  const { name, partnerName, loading } = useProfile();
  const hasPartner = !!partnerName && partnerName !== GENERIC_PARTNER_NAME;
  return {
    me: { name, initial: toInitial(name, 'Y') },
    partner: {
      name: partnerName,
      initial: hasPartner ? toInitial(partnerName, '·') : '·',
      hasPartner,
    },
    loading,
  };
}
