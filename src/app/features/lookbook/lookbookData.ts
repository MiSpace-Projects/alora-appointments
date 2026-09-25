/**
 * Editorial gallery images. Each photo keeps its own background, which blends
 * into the page: light-background shots show only in light mode, dark ones only
 * in dark mode, so the gallery always matches the active theme.
 */
export interface LookbookImage {
  src: string;
  alt: string;
  theme: 'light' | 'dark';
}

export const lookbookImages: LookbookImage[] = [
  // The single light-background portrait (face-art) leads the light-mode hero,
  // so the gallery is the dark studio edit. Add light-background shots here as
  // they arrive and the gallery fills in for light mode automatically.
  {
    src: '/lookbook/headwrap-afro.webp',
    alt: 'Natural afro with a patterned head wrap',
    theme: 'dark',
  },
  {
    src: '/lookbook/ombre-braids.webp',
    alt: 'Long ombré box braids under coloured studio light',
    theme: 'dark',
  },
  {
    src: '/lookbook/raised-arm.webp',
    alt: 'Natural afro, arm raised, editorial studio portrait',
    theme: 'dark',
  },
  {
    src: '/lookbook/gold-skirt.webp',
    alt: 'Tapered natural cut, styled in a gold skirt',
    theme: 'dark',
  },
];
