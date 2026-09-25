/**
 * The salon's service families: what the services section, the /services
 * index and each family's detail page render. The concrete menu with prices
 * comes from the database and is attached to a family through `categories`
 * (Service.category values). Copy here is marketing content owned by the
 * salon; images are editorial placeholders from Pexels until the salon
 * supplies its own photography.
 */
export interface ServiceFamily {
  slug: string;
  title: string;
  /** One line under the tile and on the index. */
  description: string;
  /** Opening paragraph on the detail page. */
  intro: string;
  /** Numbered "what's included" rows. */
  includes: { title: string; body: string }[];
  /** "Before you come" notes. */
  prep: string[];
  /** Service.category values whose styles belong to this family. */
  categories: string[];
  img: string;
  featured?: boolean;
}

export const serviceFamilies: ServiceFamily[] = [
  {
    slug: 'wig-care',
    title: 'Wig Care',
    description:
      'Deep cleanse, condition, restyle and maintenance so your wig always looks freshly installed.',
    intro:
      'A good unit deserves a good routine. We wash, condition and restyle human-hair and premium synthetic wigs, revive lace and hairlines, and install frontals and closures so they sit flat, natural and secure.',
    includes: [
      {
        title: 'Cleanse and condition',
        body: 'Sulphate-free wash, deep conditioning and a cool rinse to bring back shine and movement without stripping the fibre.',
      },
      {
        title: 'Lace and hairline work',
        body: 'Lace tinting, plucking and baby-hair styling so the install reads as your own scalp, not a wig line.',
      },
      {
        title: 'Install and lay',
        body: 'Frontal or closure install with a clean, secure hold, laid and styled to the look you want.',
      },
      {
        title: 'Restyle and set',
        body: 'Straighten, curl or set the unit so it leaves the chair ready to wear.',
      },
    ],
    prep: [
      'Bring the unit clean of glue residue if you can; if not, allow extra time and let us know when booking.',
      'Arrive with your natural hair braided down or ready to be braided; cornrow prep is available as an add-on.',
      'Tell us the density and lace type in your booking notes so the right products are ready.',
    ],
    categories: ['Press & Wigs'],
    img: 'https://images.pexels.com/photos/14730865/pexels-photo-14730865.jpeg',
    featured: true,
  },
  {
    slug: 'hair-styling',
    title: 'Hair Styling',
    description: 'Silk presses, protective braids, cuts and shaping tailored to your texture.',
    intro:
      'From knotless braids to a glass-smooth silk press, every style starts with your texture, your scalp and how you actually live. We take the time to section properly, protect your edges and finish so it lasts.',
    includes: [
      {
        title: 'Consultation',
        body: 'A few minutes on your hair history, scalp and the look you want, so we choose the right size, tension and products.',
      },
      {
        title: 'Prep',
        body: 'Cleanse, detangle and, where the style needs it, blow-dry or stretch before we start.',
      },
      {
        title: 'The style',
        body: 'Braids, twists, locs, natural sets, cuts or a press, done with attention to parting, tension and edges.',
      },
      {
        title: 'Finish and aftercare',
        body: 'Sealed ends, edges laid, and a short aftercare rundown so the style lasts as long as it should.',
      },
    ],
    prep: [
      'Come with hair washed and detangled unless you have booked a wash; it saves time on the chair.',
      'For braids and twists, bring your preferred hair if you have a brand you love; otherwise we supply it.',
      'Long installs run three to six hours. Eat beforehand and bring a charger.',
    ],
    categories: ['Braids', 'Locs & Twists', 'Natural', 'Press & Wigs'],
    img: 'https://images.pexels.com/photos/7446913/pexels-photo-7446913.jpeg',
  },
  {
    slug: 'nail-art',
    title: 'Nail Art',
    description: 'Manicures, gel overlays and hand-painted designs that last.',
    intro:
      'Clean shaping, healthy cuticles and colour that stays put. From a classic gel manicure to hand-painted art and chrome, we build on properly prepped nails so the finish holds for weeks, not days.',
    includes: [
      {
        title: 'Prep and shaping',
        body: 'Shape, cuticle care and a gentle buff so product bonds cleanly and the nail stays healthy underneath.',
      },
      {
        title: 'Gel or overlay',
        body: 'Gel polish, builder gel or acrylic overlay depending on the strength and length you want.',
      },
      {
        title: 'Art',
        body: 'Hand-painted designs, French tips, chrome, ombré and embellishments; bring a reference or let us design.',
      },
      {
        title: 'Finish',
        body: 'Sealed top coat and cuticle oil, with removal and rebalance available on your next visit.',
      },
    ],
    prep: [
      'If you are wearing product from another salon, book a removal with your service.',
      'Send reference pictures in your booking notes for art so the colours are ready.',
    ],
    categories: ['Nails'],
    img: 'https://images.pexels.com/photos/14016180/pexels-photo-14016180.jpeg',
  },
  {
    slug: 'makeup',
    title: 'Makeup',
    description: 'Soft glam to full glam for events, shoots and evenings out.',
    intro:
      'Makeup that photographs the way it looks in the mirror. We work with your undertone and skin, from a soft everyday face to full glam for a shoot or a wedding, and set it to last the whole night.',
    includes: [
      {
        title: 'Skin prep',
        body: 'Cleanse, hydrate and prime for your skin type so the base sits smooth and lasts.',
      },
      {
        title: 'Base and sculpt',
        body: 'Colour-matched foundation, concealing, contour and highlight tuned to your features and the lighting you will be in.',
      },
      {
        title: 'Eyes and lips',
        body: 'Soft or dramatic eyes, lashes on request, and a lip finish to match the occasion.',
      },
      {
        title: 'Set',
        body: 'Setting spray and touch-up tips so the look holds through the event.',
      },
    ],
    prep: [
      'Arrive with a clean, moisturised face and no makeup.',
      'Bring or describe your outfit and the event lighting so we can match intensity.',
      'Tell us about allergies or sensitive skin in your booking notes.',
    ],
    categories: ['Makeup'],
    img: 'https://images.pexels.com/photos/10698022/pexels-photo-10698022.jpeg',
  },
  {
    slug: 'matric-farewell',
    title: 'Matric Farewell',
    description: 'Hair, nails and makeup planned together so your farewell look is complete.',
    intro:
      'One night, one look, no scrambling between three salons. We plan your hair, nails and makeup together, schedule them so nothing clashes, and have you photo-ready with time to spare.',
    includes: [
      {
        title: 'Look planning',
        body: 'A short consultation with your dress and references to decide the hair, nail and makeup combination.',
      },
      {
        title: 'Hair',
        body: 'Install or style booked a day or two before, so the night itself is just finishing touches.',
      },
      {
        title: 'Nails',
        body: 'Gel or art to match the dress, done in the days before so they are set and strong.',
      },
      {
        title: 'Makeup on the day',
        body: 'Long-wear glam timed to your pick-up, with lashes and a touch-up kit if you want them.',
      },
    ],
    prep: [
      'Book early; farewell season fills weeks in advance.',
      'A parent or guardian holds the account and makes the booking for anyone under 18.',
      'Bring a photo of the dress and any references to the planning session.',
    ],
    categories: ['Braids', 'Locs & Twists', 'Natural', 'Press & Wigs', 'Nails', 'Makeup'],
    img: 'https://images.pexels.com/photos/30482416/pexels-photo-30482416.jpeg',
  },
];

export function getServiceFamily(slug: string): ServiceFamily | undefined {
  return serviceFamilies.find((family) => family.slug === slug);
}
