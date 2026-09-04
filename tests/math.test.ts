import { describe, expect, it } from "vitest";
import {
  developmentBonus,
  expectedScore,
  kFactor,
  normalGameChange,
  standardGameChange,
} from "../src/math.js";

describe("core FESA Elo math", () => {
  it("uses the standard 400-point Elo expectation", () => {
    expect(expectedScore(1600, 1600)).toBeCloseTo(0.5, 12);
    expect(expectedScore(1600, 2000)).toBeCloseTo(1 / 11, 12);
  });

  it("applies the soft opponent rating floor of 400", () => {
    expect(expectedScore(800, 200)).toBeCloseTo(expectedScore(800, 400), 12);
  });

  it.each([
    [2240, 16],
    [2239, 20],
    [1920, 20],
    [1919, 24],
    [1560, 24],
    [1559, 28],
    [1280, 28],
    [1279, 32],
    [1040, 32],
    [1039, 36],
    [720, 36],
    [719, 40],
  ])("uses K=%i at rating %i", (rating, expected) => {
    expect(kFactor(rating)).toBe(expected);
  });

  it("calculates normal Elo change", () => {
    expect(normalGameChange(1600, 1600, "WIN")).toBeCloseTo(12, 12);
    expect(normalGameChange(1600, 1600, "LOSS")).toBeCloseTo(-12, 12);
  });

  it("applies the under-1800 development bonus before 100 games", () => {
    expect(developmentBonus(1600, 99)).toBe(1);
    expect(developmentBonus(1600, 100)).toBe(0);
    expect(developmentBonus(1800, 0)).toBe(0);
  });

  it("uses upset gain when it exceeds normal gain", () => {
    const result = standardGameChange({
      playerRating: 1200,
      opponentRating: 1800,
      result: "WIN",
      bonusGamesUsed: 100,
    });

    expect(result.change).toBeCloseTo(120, 12);
  });
});
