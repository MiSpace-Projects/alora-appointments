export interface ServiceFamily {
  slug: string;
  title: string;
  description: string;
  intro: string;
  includes: { title: string; body: string }[];
  prep: string[];
  categories: string[];
  img: string;
  featured?: boolean;
  addOns?: { label: string; price: string }[];
}

export const serviceFamilies: ServiceFamily[] = [
  {
    slug: 'wig-care',
    title: 'Wig Care',
    description:
      'Washes and treatments that keep human-hair and premium units soft, clean and lasting.',
    intro:
      'A good unit deserves a good routine. We deep-cleanse, condition and treat human-hair and premium synthetic wigs so they keep their movement, shine and lifespan. Standard turnaround is 24 to 48 hours; same-day express is available on weekends at an additional charge.',
    includes: [
      {
        title: 'Basic wash',
        body: 'Sulphate-free cleanse, conditioning and a cool rinse that lifts product and oil without stripping the fibre.',
      },
      {
        title: 'Moisture treatment',
        body: 'A deep moisture mask for dry or ageing hair, restoring softness and slip to tired units.',
      },
      {
        title: 'Keratin treatment',
        body: 'A smoothing keratin service that tames frizz and brings back a sleek, manageable finish.',
      },
    ],
    prep: [
      'Drop the unit off in a hygienic condition; excessively tangled or matted wigs may attract an additional fee.',
      'Tell us the hair type and density in your booking notes so the right products are ready.',
      'Allow 24 to 48 hours for standard turnaround, or ask about weekend express.',
    ],
    categories: ['Wig Care'],
    img: 'https://images.pexels.com/photos/14730865/pexels-photo-14730865.jpeg',
    featured: true,
  },
  {
    slug: 'customization-styling',
    title: 'Customization & Styling',
    description:
      'Plucking, tinting, baby hairs, colour and frontal work so a unit reads as your own scalp.',
    intro:
      'A unit is only as good as its customization. We pluck, tint and lay lace, add baby hairs, colour and style, and replace or customize frontals and closures so the install sits flat, natural and secure. Most customization is priced on consultation because it depends on the unit and the look.',
    includes: [
      {
        title: 'Basic customization',
        body: 'Plucking and baby hairs to soften a dense, factory hairline into something natural.',
      },
      {
        title: 'Advanced customization',
        body: 'Plucking, baby hairs and a lace tint matched to your scalp for a seamless melt.',
      },
      {
        title: 'Full and glueless customization',
        body: 'Plucking, tint, baby hairs and styling, with an optional elastic, band and adjustments for a secure glueless fit.',
      },
      {
        title: 'Colour, styling and frontal work',
        body: 'Curls or straightening, colouring, and frontal or closure replacement and customization on request.',
      },
    ],
    prep: [
      'Bring the unit clean of glue residue if you can; if not, allow extra time and let us know when booking.',
      'Share references in your booking notes so the parting, colour and style are ready.',
      'Ranges are quoted at consultation and settled at the salon; deposits may be required for premium or custom work.',
    ],
    categories: ['Customization & Styling'],
    img: 'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg',
  },
  {
    slug: 'nail-art',
    title: 'Nail Art',
    description: 'Gel-X sets, soak-offs and hand-painted designs that last.',
    intro:
      'Clean shaping, healthy nails and colour that stays put. From a plain Gel-X set to hand-painted art, we build on properly prepped nails so the finish holds for weeks, not days.',
    includes: [
      {
        title: 'Prep and shaping',
        body: 'Shape, cuticle care and a gentle buff so product bonds cleanly and the nail stays healthy underneath.',
      },
      {
        title: 'Gel-X application',
        body: 'Short, medium or long Gel-X extensions applied plain, ready for colour or art.',
      },
      {
        title: 'Art and finish',
        body: 'French, simple or detailed hand-painted designs, sealed with a top coat and cuticle oil.',
      },
      {
        title: 'Soak-off and repair',
        body: 'Gentle removal of an Alora or other-salon set, refills, and single-nail repairs when you need them.',
      },
    ],
    prep: [
      'If you are wearing product from another salon, add a soak-off to your booking.',
      'Send reference pictures in your booking notes for art so the colours are ready.',
    ],
    categories: ['Nails'],
    img: 'https://images.pexels.com/photos/14016180/pexels-photo-14016180.jpeg',
    addOns: [
      { label: 'French or simple design', price: '+R50' },
      { label: 'Detailed nail art', price: '+R80 to R150' },
    ],
  },
  {
    slug: 'makeup',
    title: 'Makeup',
    description: 'Soft glam to full glam for events, shoots, weddings and matric farewells.',
    intro:
      'Makeup that photographs the way it looks in the mirror. We work with your undertone and skin, from a soft everyday face to full bridal glam, and set it to last the whole day. Strip lashes are included with every glam.',
    includes: [
      {
        title: 'Skin prep',
        body: 'Cleanse, hydrate and prime for your skin type so the base sits smooth and lasts.',
      },
      {
        title: 'Soft or full glam',
        body: 'A natural soft glam or a sculpted full glam, colour-matched and tuned to your lighting.',
      },
      {
        title: 'Bridal and party',
        body: 'Bridal and bridesmaid makeup for the whole party, with lashes included on every look.',
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
    addOns: [
      { label: 'Strip lashes with any glam', price: 'Included' },
      { label: 'Early-morning surcharge', price: '+R100' },
      { label: 'Travel or mobile makeup', price: 'From R150' },
    ],
  },
  {
    slug: 'matric-farewell',
    title: 'Matric Farewell',
    description:
      'Hair and makeup planned together as one package so your farewell look is complete.',
    intro:
      'One night, one look, no scrambling between salons. Our matric package brings hair and makeup together: wig customization, installation and styling, plus full glam and lashes, planned and timed so you are photo-ready with time to spare.',
    includes: [
      {
        title: 'Look planning',
        body: 'A short consultation with your dress and references to decide the hair and makeup combination.',
      },
      {
        title: 'Hair',
        body: 'Wig customization, installation and styling booked so the night itself is just finishing touches.',
      },
      {
        title: 'Makeup on the day',
        body: 'Full glam timed to your pick-up, with lashes included.',
      },
      {
        title: 'One package',
        body: 'Hair and makeup quoted together so there are no surprises on the day.',
      },
    ],
    prep: [
      'Book early; farewell season fills weeks in advance.',
      'A parent or guardian holds the account and makes the booking for anyone under 18.',
      'Bring a photo of the dress and any references to the planning session.',
    ],
    categories: ['Matric'],
    img: 'https://images.pexels.com/photos/30482416/pexels-photo-30482416.jpeg',
  },
];

export function getServiceFamily(slug: string): ServiceFamily | undefined {
  return serviceFamilies.find((family) => family.slug === slug);
}

export function familyForCategory(
  category: string | null | undefined,
  families: ServiceFamily[] = serviceFamilies,
): ServiceFamily | undefined {
  if (!category) return undefined;
  return families.find((family) => family.categories.includes(category));
}

export interface FamilyGroup<T> {
  family: ServiceFamily;
  items: T[];
}

export function groupByFamily<T extends { category: string | null }>(
  items: T[],
  families: ServiceFamily[] = serviceFamilies,
): FamilyGroup<T>[] {
  return families
    .map((family) => ({
      family,
      items: items.filter(
        (item) => item.category !== null && family.categories.includes(item.category),
      ),
    }))
    .filter((group) => group.items.length > 0);
}
