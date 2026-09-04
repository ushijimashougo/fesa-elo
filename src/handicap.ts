import { roundToNearestEven } from "./math.js";
import type { FesaHandicap } from "./types.js";

const HANDICAP_GRADE_EFFECT: Record<FesaHandicap, number> = {
  SENTE: 0.2,
  LANCE: 0.6,
  BISHOP: 1.5,
  ROOK: 2.1,
  ROOK_LANCE: 2.7,
  TWO_PIECES: 3.6,
  FOUR_PIECES: 5.0,
  FIVE_PIECES: 6.5,
  SIX_PIECES: 8.0,
};

// FESA lower-bound scale. Values above 5 Dan are retained from the
// reference implementation because the fractional-grade conversion needs
// continuation points for high-rated handicap givers.
const DAN_LB = [0, 1680, 1800, 1920, 2080, 2240, 2440, 2640, 2880, 3120, 9999];
const KYU_LB = [
  0,
  1560,
  1460,
  1360,
  1280,
  1200,
  1120,
  1040,
  960,
  880,
  800,
  720,
  640,
  560,
  480,
  400,
  320,
  240,
  160,
  80,
  0,
];

function partOf(value: number, lower: number, upper: number): number {
  return (value - lower) / (upper - lower);
}

export function ratingToFractionalGrade(rating: number): number {
  if (!Number.isFinite(rating) || rating < 1) {
    throw new Error(`Invalid rating for handicap conversion: ${rating}`);
  }

  if (rating > DAN_LB[1]!) {
    const mainIndex = DAN_LB.slice(1).findIndex((bound) => rating < bound);
    if (mainIndex < 0) {
      throw new Error(`Rating is outside supported handicap scale: ${rating}`);
    }

    return (
      14 +
      mainIndex +
      partOf(rating, DAN_LB[mainIndex]!, DAN_LB[mainIndex + 1]!)
    );
  }

  if (rating > KYU_LB[1]!) {
    return 14 + partOf(rating, KYU_LB[1]!, DAN_LB[1]!);
  }

  const mainIndex = KYU_LB.slice(1).findIndex((bound) => rating > bound);
  if (mainIndex < 0) return 0;

  return (
    14 -
    mainIndex +
    partOf(
      rating,
      KYU_LB[mainIndex + 1]!,
      KYU_LB[mainIndex]!,
    )
  );
}

function valueOf(part: number, lower: number, upper: number): number {
  return lower + part * (upper - lower);
}

export function fractionalGradeToRating(grade: number): number {
  const main = Math.floor(grade);
  const part = grade - main;

  if (main >= 15) {
    const lowerIndex = main - 14;
    const upperIndex = main - 13;
    const lower = DAN_LB[lowerIndex];
    const upper = DAN_LB[upperIndex];

    if (lower === undefined || upper === undefined) {
      throw new Error(`Fractional grade is outside supported scale: ${grade}`);
    }

    return roundToNearestEven(valueOf(part, lower, upper));
  }

  if (main === 14) {
    return roundToNearestEven(valueOf(part, KYU_LB[1]!, DAN_LB[1]!));
  }

  if (main >= -5) {
    const lower = KYU_LB[15 - main];
    const upper = KYU_LB[14 - main];

    if (lower === undefined || upper === undefined) {
      throw new Error(`Fractional grade is outside supported scale: ${grade}`);
    }

    return roundToNearestEven(valueOf(part, lower, upper));
  }

  return 1;
}

export function handicapGradeEffect(type: FesaHandicap): number {
  return HANDICAP_GRADE_EFFECT[type];
}

export function handicapAdjustedRating(
  giverRating: number,
  type: FesaHandicap,
): number {
  return fractionalGradeToRating(
    ratingToFractionalGrade(giverRating) - handicapGradeEffect(type),
  );
}

export function handicapRatingEffect(
  giverRating: number,
  type: FesaHandicap,
): number {
  return giverRating - handicapAdjustedRating(giverRating, type);
}
