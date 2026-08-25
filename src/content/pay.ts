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
    emoji: '🧠',
    title: 'A mediator that knows you',
    desc: 'It reads what you two have already worked out before it answers',
  },
  {
    emoji: '🪢',
    title: 'Your patterns, surfaced',
    desc: 'What keeps coming up, and what actually settles it',
  },
  {
    emoji: '📖',
    title: 'Your whole record',
    desc: 'Every repair you came through, kept for both of you',
  },
  {
    emoji: '🤍',
    title: 'One purchase, both of you',
    desc: 'Never paywalled mid-repair. The hard moment is always free',
  },
];
