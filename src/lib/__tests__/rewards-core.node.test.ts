import {
  arePointsExpired,
  computeBalance,
  isValidRedemption,
  maxRedeemablePoints,
  pointsEarned,
  pointsValueCents,
  tierForSpend,
  tierWindowStart,
} from '@/lib/rewards-core';

describe('tierForSpend', () => {
  it('starts everyone as a Member at 1x', () => {
    expect(tierForSpend(0)).toEqual({
      tier: 'Member',
      multiplierTenths: 10,
      spendCents: 0,
      nextTier: 'Silver',
      spendToNextCents: 250_000,
      progressPercent: 0,
    });
  });

  it('moves to Silver at R2,500 and Gold at R5,000 of spend', () => {
    expect(tierForSpend(249_999).tier).toBe('Member');
    expect(tierForSpend(250_000)).toMatchObject({ tier: 'Silver', multiplierTenths: 12 });
    expect(tierForSpend(375_000)).toMatchObject({ spendToNextCents: 125_000, progressPercent: 50 });
    expect(tierForSpend(500_000)).toMatchObject({
      tier: 'Gold',
      multiplierTenths: 15,
      nextTier: null,
      spendToNextCents: null,
      progressPercent: 100,
    });
  });

  it('treats negative spend as zero', () => {
    expect(tierForSpend(-100).spendCents).toBe(0);
  });

  it('looks back 365 days', () => {
    expect(tierWindowStart(new Date('2026-12-01T00:00:00Z')).toISOString()).toBe(
      '2025-12-01T00:00:00.000Z',
    );
  });
});

describe('point value and redemption', () => {
  it('values 100 points at R50', () => {
    expect(pointsValueCents(100)).toBe(5_000);
    expect(pointsValueCents(-5)).toBe(0);
  });

  it('caps redemption at half the price and the balance, in steps of 100', () => {
    expect(maxRedeemablePoints(1_000, 25_000)).toBe(200);
    expect(maxRedeemablePoints(150, 25_000)).toBe(100);
    expect(maxRedeemablePoints(99, 25_000)).toBe(0);
    expect(maxRedeemablePoints(5_000, 85_000)).toBe(800);
    expect(maxRedeemablePoints(500, 15_000)).toBe(100);
    expect(maxRedeemablePoints(500, 5_000)).toBe(0);
  });

  it('accepts only whole steps within the cap', () => {
    expect(isValidRedemption(0, 0, 25_000)).toBe(true);
    expect(isValidRedemption(200, 1_000, 25_000)).toBe(true);
    expect(isValidRedemption(300, 1_000, 25_000)).toBe(false);
    expect(isValidRedemption(150, 1_000, 25_000)).toBe(false);
    expect(isValidRedemption(-100, 1_000, 25_000)).toBe(false);
    expect(isValidRedemption(100.5, 1_000, 25_000)).toBe(false);
  });
});

describe('pointsEarned', () => {
  it('gives 1 point per R10 at Member level', () => {
    expect(
      pointsEarned({ basePoints: 25, priceCents: 25_000, discountCents: 0, multiplierTenths: 10 }),
    ).toBe(25);
  });

  it('applies the tier multiplier with whole points only', () => {
    expect(
      pointsEarned({ basePoints: 25, priceCents: 25_000, discountCents: 0, multiplierTenths: 12 }),
    ).toBe(30);
    expect(
      pointsEarned({ basePoints: 25, priceCents: 25_000, discountCents: 0, multiplierTenths: 15 }),
    ).toBe(37);
  });

  it('earns only on the part paid in money', () => {
    expect(
      pointsEarned({
        basePoints: 25,
        priceCents: 25_000,
        discountCents: 10_000,
        multiplierTenths: 10,
      }),
    ).toBe(15);
  });

  it('earns nothing on free or zero-point services', () => {
    expect(
      pointsEarned({ basePoints: 25, priceCents: 0, discountCents: 0, multiplierTenths: 15 }),
    ).toBe(0);
    expect(
      pointsEarned({ basePoints: 0, priceCents: 25_000, discountCents: 0, multiplierTenths: 15 }),
    ).toBe(0);
  });
});

describe('expiry', () => {
  it('expires points 36 months after the last visit', () => {
    const lastVisit = new Date('2026-01-15T09:00:00Z');
    expect(arePointsExpired(lastVisit, new Date('2029-01-15T08:59:59Z'))).toBe(false);
    expect(arePointsExpired(lastVisit, new Date('2029-01-15T09:00:00Z'))).toBe(true);
    expect(arePointsExpired(null, new Date('2040-01-01T00:00:00Z'))).toBe(false);
  });
});

describe('computeBalance', () => {
  it('sums the ledger', () => {
    expect(computeBalance([{ delta: 35 }, { delta: 500 }, { delta: -100 }])).toBe(435);
    expect(computeBalance([])).toBe(0);
  });
});

describe('programme economics', () => {
  it('returns 5%, 6% and 7.5% of money paid as value', () => {
    for (const [multiplierTenths, percent] of [
      [10, 5],
      [12, 6],
      [15, 7.5],
    ] as const) {
      const earned = pointsEarned({
        basePoints: 100,
        priceCents: 100_000,
        discountCents: 0,
        multiplierTenths,
      });
      expect((pointsValueCents(earned) / 100_000) * 100).toBe(percent);
    }
  });
});
