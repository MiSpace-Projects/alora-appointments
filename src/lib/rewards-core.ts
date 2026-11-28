export type RewardTier = 'Member' | 'Silver' | 'Gold';

export interface RewardTierRule {
  tier: RewardTier;
  minSpendCents: number;
  multiplierTenths: number;
}

export const POINT_VALUE_CENTS = 50;
export const REDEEM_STEP_POINTS = 100;
export const MAX_REDEEM_SHARE_PERCENT = 50;
export const TIER_WINDOW_DAYS = 365;
export const POINTS_EXPIRY_MONTHS = 36;

export const REWARD_TIERS: readonly RewardTierRule[] = [
  { tier: 'Member', minSpendCents: 0, multiplierTenths: 10 },
  { tier: 'Silver', minSpendCents: 250_000, multiplierTenths: 12 },
  { tier: 'Gold', minSpendCents: 500_000, multiplierTenths: 15 },
];

export interface TierStanding {
  tier: RewardTier;
  multiplierTenths: number;
  spendCents: number;
  nextTier: RewardTier | null;
  spendToNextCents: number | null;
  progressPercent: number;
}

export function tierForSpend(spendCents: number): TierStanding {
  const spend = Math.max(0, Math.floor(spendCents));
  let index = 0;
  for (let i = 0; i < REWARD_TIERS.length; i += 1) {
    if (spend >= REWARD_TIERS[i].minSpendCents) index = i;
  }
  const current = REWARD_TIERS[index];
  const next = REWARD_TIERS[index + 1] ?? null;
  if (!next) {
    return {
      tier: current.tier,
      multiplierTenths: current.multiplierTenths,
      spendCents: spend,
      nextTier: null,
      spendToNextCents: null,
      progressPercent: 100,
    };
  }
  const span = next.minSpendCents - current.minSpendCents;
  return {
    tier: current.tier,
    multiplierTenths: current.multiplierTenths,
    spendCents: spend,
    nextTier: next.tier,
    spendToNextCents: next.minSpendCents - spend,
    progressPercent: Math.min(100, Math.floor(((spend - current.minSpendCents) / span) * 100)),
  };
}

export function tierWindowStart(now: Date): Date {
  return new Date(now.getTime() - TIER_WINDOW_DAYS * 24 * 60 * 60 * 1000);
}

export function pointsValueCents(points: number): number {
  return Math.max(0, Math.floor(points)) * POINT_VALUE_CENTS;
}

export function maxRedeemablePoints(balance: number, priceCents: number): number {
  const byBalance = Math.max(0, Math.floor(balance));
  const byPrice = Math.floor(
    (Math.max(0, priceCents) * MAX_REDEEM_SHARE_PERCENT) / 100 / POINT_VALUE_CENTS,
  );
  const cap = Math.min(byBalance, byPrice);
  return cap - (cap % REDEEM_STEP_POINTS);
}

export function isValidRedemption(points: number, balance: number, priceCents: number): boolean {
  return (
    Number.isInteger(points) &&
    points >= 0 &&
    points % REDEEM_STEP_POINTS === 0 &&
    points <= maxRedeemablePoints(balance, priceCents)
  );
}

export function pointsEarned(input: {
  basePoints: number;
  priceCents: number;
  discountCents: number;
  multiplierTenths: number;
}): number {
  if (input.priceCents <= 0 || input.basePoints <= 0) return 0;
  const paidCents = Math.max(0, input.priceCents - input.discountCents);
  return Math.floor(
    (input.basePoints * paidCents * input.multiplierTenths) / (input.priceCents * 10),
  );
}

export function pointsExpireAt(lastVisitAt: Date): Date {
  const expires = new Date(lastVisitAt.getTime());
  expires.setUTCMonth(expires.getUTCMonth() + POINTS_EXPIRY_MONTHS);
  return expires;
}

export function arePointsExpired(lastVisitAt: Date | null, now: Date): boolean {
  if (!lastVisitAt) return false;
  return pointsExpireAt(lastVisitAt).getTime() <= now.getTime();
}

export function computeBalance(entries: ReadonlyArray<{ delta: number }>): number {
  return entries.reduce((sum, entry) => sum + entry.delta, 0);
}
