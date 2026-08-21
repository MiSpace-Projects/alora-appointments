export const heroCopy = {
  title: 'Alora',
  label: 'Premium Beauty and Hair Services',
  description:
    'Wig care, nails, makeup & matric farewell looks — crafted with precision. Earn loyalty rewards with every visit.',
} as const;

export const heroActions = [
  { label: 'Book Now', href: '/book', variant: 'primaryButton', protected: true },
  { label: 'Our Services', href: '/#services', variant: 'secondaryButton', protected: false },
] as const;
