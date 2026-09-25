/**
 * Marketing categories shown in the services section. These are the salon's
 * service families; the concrete menu with prices comes from the database
 * (see the price list section). Images are editorial placeholders from Pexels
 * until the salon supplies its own photography.
 */
export interface ServiceCategory {
  title: string;
  description: string;
  img: string;
}

export const featuredCategory: ServiceCategory = {
  title: 'Wig Care',
  description:
    'Deep cleanse, condition, restyle and maintenance so your wig always looks freshly installed.',
  img: 'https://images.pexels.com/photos/14730865/pexels-photo-14730865.jpeg',
};

export const serviceCategories: ServiceCategory[] = [
  {
    title: 'Hair Styling',
    description: 'Silk presses, protective braids, cuts and shaping tailored to your texture.',
    img: 'https://images.pexels.com/photos/7446913/pexels-photo-7446913.jpeg',
  },
  {
    title: 'Nail Art',
    description: 'Manicures, gel overlays and hand-painted designs that last.',
    img: 'https://images.pexels.com/photos/14016180/pexels-photo-14016180.jpeg',
  },
  {
    title: 'Makeup',
    description: 'Soft glam to full glam for events, shoots and evenings out.',
    img: 'https://images.pexels.com/photos/10698022/pexels-photo-10698022.jpeg',
  },
  {
    title: 'Matric Farewell',
    description: 'Hair, nails and makeup planned together so your farewell look is complete.',
    img: 'https://images.pexels.com/photos/30482416/pexels-photo-30482416.jpeg',
  },
];
