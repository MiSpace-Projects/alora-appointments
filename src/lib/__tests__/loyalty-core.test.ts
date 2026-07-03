import { computeBalance, standingForPoints } from '@/lib/loyalty-core';

describe('computeBalance', () => {
  it('sums ledger deltas including redemptions', () => {
    expect(computeBalance([{ delta: 35 }, { delta: 500 }, { delta: -100 }])).toBe(435);
  });

  it('is zero for an empty ledger', () => {
    expect(computeBalance([])).toBe(0);
  });
});

describe('standingForPoints', () => {
  it('places a new member in Bronze with progress toward Silver', () => {
    const s = standingForPoints(35);
    expect(s.tier).toBe('Bronze');
    expect(s.nextTier).toBe('Silver');
    expect(s.pointsToNext).toBe(465);
    expect(s.progressPercent).toBe(7);
  });

  it('promotes at the threshold', () => {
    expect(standingForPoints(500).tier).toBe('Silver');
    expect(standingForPoints(1500).tier).toBe('Gold');
  });

  it('caps at the top tier with no next', () => {
    const s = standingForPoints(9999);
    expect(s.tier).toBe('Platinum');
    expect(s.nextTier).toBeNull();
    expect(s.pointsToNext).toBeNull();
    expect(s.progressPercent).toBe(100);
  });

  it('never returns negative points', () => {
    expect(standingForPoints(-50).points).toBe(0);
  });
});
