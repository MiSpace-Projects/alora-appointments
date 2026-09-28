import { formatPrice, formatZar, formatDuration } from '@/lib/format';

describe('formatZar', () => {
  it('converts integer cents to whole rands with an R prefix', () => {
    expect(formatZar(95000)).toBe('R950');
    expect(formatZar(12300)).toBe('R123');
  });

  it('rounds to the nearest rand', () => {
    expect(formatZar(12999)).toBe('R130');
    expect(formatZar(12345)).toBe('R123');
  });
});

describe('formatPrice', () => {
  it('renders a fixed price as a single amount', () => {
    expect(formatPrice({ priceCents: 25000, priceType: 'FIXED', priceMaxCents: null })).toBe(
      'R250',
    );
  });

  it('prefixes a "from" price', () => {
    expect(formatPrice({ priceCents: 10000, priceType: 'FROM', priceMaxCents: null })).toBe(
      'From R100',
    );
  });

  it('renders a range with both bounds', () => {
    expect(formatPrice({ priceCents: 30000, priceType: 'RANGE', priceMaxCents: 35000 })).toBe(
      'R300–R350',
    );
  });

  it('falls back to the low amount when a range has no upper bound', () => {
    expect(formatPrice({ priceCents: 30000, priceType: 'RANGE', priceMaxCents: null })).toBe(
      'R300',
    );
  });
});

describe('formatDuration', () => {
  it('formats minutes, whole hours and mixed durations', () => {
    expect(formatDuration(45)).toBe('45 min');
    expect(formatDuration(60)).toBe('1 hr');
    expect(formatDuration(90)).toBe('1 hr 30 min');
    expect(formatDuration(120)).toBe('2 hrs');
  });
});
