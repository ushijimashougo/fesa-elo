import { describe, expect, it } from "vitest";
import {
  calculatePerformanceRating,
  shouldUsePerformanceRating,
} from "../src/performance.js";

describe("performance rating", () => {
  it("returns 1 for an all-loss record", () => {
    expect(calculatePerformanceRating([
      { opponentRating: 1500, result: "LOSS" },
      { opponentRating: 1600, result: "LOSS" },
    ])).toBe(1);
  });

  it("adds the all-win correction and produces a finite rating", () => {
    const rating = calculatePerformanceRating([
      { opponentRating: 1500, result: "WIN" },
      { opponentRating: 1600, result: "WIN" },
    ]);

    expect(rating).toBeGreaterThan(1600);
    expect(Number.isFinite(rating)).toBe(true);
  });

  it("uses performance rating below nine total games", () => {
    expect(shouldUsePerformanceRating({
      priorRatedGamesCount: 5,
      syntheticPriorGradeGames: 0,
      currentRatedGames: 3,
      priorResults: ["WIN", "LOSS", "WIN", "LOSS", "WIN"],
    })).toBe(true);
  });

  it("keeps all-win players on performance rating after nine games", () => {
    expect(shouldUsePerformanceRating({
      priorRatedGamesCount: 9,
      syntheticPriorGradeGames: 0,
      currentRatedGames: 3,
      priorResults: Array.from({ length: 9 }, () => "WIN" as const),
    })).toBe(true);
  });

  it("uses standard calculation after nine games with mixed prior results", () => {
    expect(shouldUsePerformanceRating({
      priorRatedGamesCount: 9,
      syntheticPriorGradeGames: 0,
      currentRatedGames: 3,
      priorResults: ["WIN", "LOSS", "WIN", "LOSS", "WIN", "LOSS", "WIN", "LOSS", "WIN"],
    })).toBe(false);
  });
});
