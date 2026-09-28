export type LoyaltyTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

interface TierBand {
  tier: LoyaltyTier;
  min: number;
}

export const TIER_BANDS: readonly TierBand[] = [
  { tier: 'Bronze', min: 0 },
  { tier: 'Silver', min: 500 },
  { tier: 'Gold', min: 1500 },
  { tier: 'Platinum', min: 4000 },
];

export function computeBalance(entries: ReadonlyArray<{ delta: number }>): number {
  return entries.reduce((sum, e) => sum + e.delta, 0);
}

export interface LoyaltyStanding {
  points: number;
  tier: LoyaltyTier;
  nextTier: LoyaltyTier | null;
  pointsToNext: number | null;
  progressPercent: number;
}

export function standingForPoints(points: number): LoyaltyStanding {
  const safePoints = Math.max(0, Math.floor(points));

  let currentIndex = 0;
  for (let i = 0; i < TIER_BANDS.length; i += 1) {
    if (safePoints >= TIER_BANDS[i].min) currentIndex = i;
  }

  const current = TIER_BANDS[currentIndex];
  const next = TIER_BANDS[currentIndex + 1] ?? null;

  if (!next) {
    return {
      points: safePoints,
      tier: current.tier,
      nextTier: null,
      pointsToNext: null,
      progressPercent: 100,
    };
  }

  const span = next.min - current.min;
  const into = safePoints - current.min;
  return {
    points: safePoints,
    tier: current.tier,
    nextTier: next.tier,
    pointsToNext: next.min - safePoints,
    progressPercent: Math.min(100, Math.round((into / span) * 100)),
  };
}
