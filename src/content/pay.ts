// Parallax Plus: subscription plans and perks
// Ported from design_handoff_parallax/design_files/couples-pay.jsx

export interface Plan {
  price: string;
  per: string;
  mo: string;
  tag: string;
  badge: string;
}

export interface PlanMap {
  year: Plan;
  month: Plan;
  life: Plan;
}

export const PLANS: PlanMap = {
  year: {
    price: '$39.99',
    per: '/yr',
    mo: '$3.33/mo',
    tag: 'save 33%',
    badge: 'BEST VALUE',
  },
  month: {
    price: '$4.99',
    per: '/mo',
    mo: 'billed monthly',
    tag: '',
    badge: '',
  },
  life: {
    price: '$79.99',
    per: ' once',
    mo: 'one price covers you both',
    tag: '',
    badge: 'LIFETIME',
  },
};

export interface Perk {
  emoji: string;
  title: string;
  desc: string;
}

export const PERKS: Perk[] = [
  {
    emoji: '🎁',
    title: 'Every themed pack',
    desc: 'After dark, Chaos hour, Rewind & more',
  },
  {
    emoji: '♾️',
    title: 'Unlimited drops',
    desc: 'Send each other questions any time',
  },
  {
    emoji: '📈',
    title: 'Full wavelength history',
    desc: 'Every reveal & couple type, kept forever',
  },
  {
    emoji: '🧊',
    title: 'Streak freezes',
    desc: 'Forgiveness when life happens, for both of you',
  },
];
