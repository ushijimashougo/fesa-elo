export const HARD_RATING_FLOOR = 1;
export const OPPONENT_RATING_FLOOR = 400;
export const DEVELOPMENT_BONUS_LIMIT = 100;
export const DEVELOPMENT_BONUS_RATING_LIMIT = 1800;

export function roundToNearestEven(value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error("Cannot round a non-finite rating value");
  }

  const lower = Math.floor(value);
  const fraction = value - lower;
  const epsilon = 1e-12;

  if (fraction < 0.5 - epsilon) return lower;
  if (fraction > 0.5 + epsilon) return lower + 1;

  return lower % 2 === 0 ? lower : lower + 1;
}

export function expectedScore(playerRating: number, opponentRating: number): number {
  const effectiveOpponent = Math.max(OPPONENT_RATING_FLOOR, opponentRating);
  return 1 / (1 + 10 ** ((effectiveOpponent - playerRating) / 400));
}

export function kFactor(rating: number): number {
  if (rating >= 2240) return 16;
  if (rating >= 1920) return 20;
  if (rating >= 1560) return 24;
  if (rating >= 1280) return 28;
  if (rating >= 1040) return 32;
  if (rating >= 720) return 36;
  return 40;
}

export function resultScore(result: "WIN" | "LOSS" | "DRAW"): number {
  switch (result) {
    case "WIN": return 1;
    case "DRAW": return 0.5;
    case "LOSS": return 0;
  }
}

export function normalGameChange(
  playerRating: number,
  opponentRating: number,
  result: "WIN" | "LOSS" | "DRAW",
): number {
  return kFactor(playerRating) * (
    resultScore(result) - expectedScore(playerRating, opponentRating)
  );
}

export function upsetGameChange(
  playerRating: number,
  opponentRating: number,
  result: "WIN" | "LOSS" | "DRAW",
): number | undefined {
  if (result !== "WIN" || opponentRating <= playerRating) return undefined;
  return kFactor(playerRating) * (opponentRating - playerRating) / 160;
}

export function developmentBonus(
  playerRating: number,
  bonusGamesUsed: number,
): number {
  if (bonusGamesUsed >= DEVELOPMENT_BONUS_LIMIT) return 0;
  if (playerRating >= DEVELOPMENT_BONUS_RATING_LIMIT) return 0;
  return (DEVELOPMENT_BONUS_RATING_LIMIT - playerRating) / 200;
}

export function standardGameChange(args: {
  playerRating: number;
  opponentRating: number;
  result: "WIN" | "LOSS" | "DRAW";
  bonusGamesUsed: number;
}): { change: number; bonusGamesUsedAfter: number } {
  const normal = normalGameChange(args.playerRating, args.opponentRating, args.result);
  const upset = upsetGameChange(args.playerRating, args.opponentRating, args.result);
  const base = upset !== undefined && upset > normal ? upset : normal;
  const bonus = developmentBonus(args.playerRating, args.bonusGamesUsed);

  return {
    change: base + bonus,
    bonusGamesUsedAfter: Math.min(
      DEVELOPMENT_BONUS_LIMIT,
      args.bonusGamesUsed + 1,
    ),
  };
}
