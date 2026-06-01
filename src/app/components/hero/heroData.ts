export const heroCopy = {
  title: 'Alora',
  label: 'Premium Beauty and Hair Services',
  description:
    'Wig care, nails, makeup & matric farewell looks — crafted with precision. Earn loyalty rewards with every visit.',
};

export const heroActions = [
  { label: 'Book Now', href: '/BookNow', variant: 'primaryButton' },
  { label: 'Our Services', href: '/services', variant: 'secondaryButton' },
] as const;

export const heroStats = [
  { value: '50+', label: 'Clients' },
  { value: '4.9★', label: 'Rating' },
  { value: '10+', label: 'Bookings' },
] as const;
