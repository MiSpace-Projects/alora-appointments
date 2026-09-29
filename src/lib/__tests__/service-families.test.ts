import {
  familyForCategory,
  groupByFamily,
  serviceFamilies,
} from '@/app/features/servicesSection/servicesData';

const item = (slug: string, category: string | null) => ({ slug, category });

describe('groupByFamily', () => {
  it('never mixes families inside a group', () => {
    const groups = groupByFamily([
      item('gelx', 'Nails'),
      item('wash', 'Wig Care'),
      item('glam', 'Makeup'),
      item('soak', 'Nails'),
    ]);
    for (const group of groups) {
      for (const entry of group.items) {
        expect(group.family.categories).toContain(entry.category);
      }
    }
    expect(groups.find((g) => g.family.slug === 'nail-art')?.items.map((i) => i.slug)).toEqual([
      'gelx',
      'soak',
    ]);
  });

  it('follows the family order and drops empty families', () => {
    const groups = groupByFamily([item('glam', 'Makeup'), item('wash', 'Wig Care')]);
    expect(groups.map((g) => g.family.slug)).toEqual(['wig-care', 'makeup']);
  });

  it('drops services whose category belongs to no family (e.g. retired placeholders)', () => {
    const groups = groupByFamily([item('braids', 'Braids'), item('none', null)]);
    expect(groups).toEqual([]);
  });
});

describe('familyForCategory', () => {
  it('maps a category to its single owning family', () => {
    expect(familyForCategory('Customization & Styling')?.slug).toBe('customization-styling');
    expect(familyForCategory('Braids')).toBeUndefined();
    expect(familyForCategory(null)).toBeUndefined();
  });

  it('keeps every category in exactly one family', () => {
    const categories = serviceFamilies.flatMap((family) => family.categories);
    expect(new Set(categories).size).toBe(categories.length);
  });
});
