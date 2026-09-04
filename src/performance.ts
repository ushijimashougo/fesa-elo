import { getGradeInfo } from "./grade.js";
import { HARD_RATING_FLOOR, OPPONENT_RATING_FLOOR, resultScore } from "./math.js";
import type { FesaGrade, FesaResult, PriorRatedGame } from "./types.js";

export type PerformanceGame = {
  opponentRating: number;
  result: FesaResult;
};

export function shouldUsePerformanceRating(args: {
  priorRatedGamesCount: number;
  syntheticPriorGradeGames: number;
  currentRatedGames: number;
  priorResults: FesaResult[];
}): boolean {
  const totalGames =
    args.priorRatedGamesCount +
    args.syntheticPriorGradeGames +
    args.currentRatedGames;

  if (args.priorRatedGamesCount === 0) return true;
  if (totalGames < 9) return true;

  if (args.priorResults.length > 0) {
    const allWins = args.priorResults.every((result) => result === "WIN");
    const allLosses = args.priorResults.every((result) => result === "LOSS");
    if (allWins || allLosses) return true;
  }

  return false;
}

export function priorGradeGames(priorGrade?: FesaGrade): PerformanceGame[] {
  if (priorGrade === undefined) return [];

  const opponentRating = getGradeInfo(priorGrade).midpoint;
  return [
    { opponentRating, result: "WIN" },
    { opponentRating, result: "LOSS" },
  ];
}

function performanceBalance(rating: number, games: PerformanceGame[]): number {
  return games.reduce((sum, game) => {
    const opponent = Math.max(OPPONENT_RATING_FLOOR, game.opponentRating);
    const expected = 1 / (1 + 10 ** ((opponent - rating) / 400));
    return sum + resultScore(game.result) - expected;
  }, 0);
}

export function calculatePerformanceRating(
  games: PerformanceGame[],
): number {
  if (games.length === 0) {
    throw new Error("Performance rating requires at least one rated game");
  }

  const allLosses = games.every((game) => game.result === "LOSS");
  if (allLosses) return HARD_RATING_FLOOR;

  const calculationGames = [...games];
  const allWins = calculationGames.every((game) => game.result === "WIN");

  if (allWins) {
    const highestOpponent = Math.max(
      ...calculationGames.map((game) => game.opponentRating),
    );
    calculationGames.push({
      opponentRating: highestOpponent,
      result: "DRAW",
    });
  }

  let low = HARD_RATING_FLOOR;
  let high = Math.max(
    4000,
    ...calculationGames.map((game) => game.opponentRating + 2000),
  );

  while (performanceBalance(high, calculationGames) > 0 && high < 100000) {
    high *= 2;
  }

  for (let i = 0; i < 100; i += 1) {
    const middle = (low + high) / 2;
    if (performanceBalance(middle, calculationGames) > 0) {
      low = middle;
    } else {
      high = middle;
    }
  }

  return Math.max(HARD_RATING_FLOOR, Math.round((low + high) / 2));
}

export function toPersistedPriorGames(
  games: PerformanceGame[],
): PriorRatedGame[] {
  return games.map((game) => ({
    opponentRating: game.opponentRating,
    result: game.result,
  }));
}
