import { describe, expect, it } from "vitest";
import {
  fractionalGradeToRating,
  handicapAdjustedRating,
  handicapGradeEffect,
  handicapRatingEffect,
  ratingToFractionalGrade,
} from "../src/handicap.js";

describe("FESA handicap conversion", () => {
  it("uses the official handicap grade-equivalent values", () => {
    expect(handicapGradeEffect("SENTE")).toBe(0.2);
    expect(handicapGradeEffect("LANCE")).toBe(0.6);
    expect(handicapGradeEffect("BISHOP")).toBe(1.5);
    expect(handicapGradeEffect("ROOK")).toBe(2.1);
    expect(handicapGradeEffect("ROOK_LANCE")).toBe(2.7);
    expect(handicapGradeEffect("TWO_PIECES")).toBe(3.6);
    expect(handicapGradeEffect("FOUR_PIECES")).toBe(5);
    expect(handicapGradeEffect("FIVE_PIECES")).toBe(6.5);
    expect(handicapGradeEffect("SIX_PIECES")).toBe(8);
  });

  it("round-trips ratings through the fractional grade scale", () => {
    for (const rating of [400, 800, 1500, 1600, 1800, 2000, 2500]) {
      expect(fractionalGradeToRating(ratingToFractionalGrade(rating))).toBe(rating);
    }
  });

  it("matches the legacy FESA conversion for rook handicap at 1800", () => {
    expect(handicapAdjustedRating(1800, "ROOK")).toBe(1550);
    expect(handicapRatingEffect(1800, "ROOK")).toBe(250);
  });

  it("produces rating-dependent handicap effects", () => {
    expect(handicapRatingEffect(800, "ROOK")).toBe(168);
    expect(handicapRatingEffect(1600, "ROOK")).toBe(217);
    expect(handicapRatingEffect(2000, "ROOK")).toBe(272);
  });

  it("applies the hard low-end behavior of the reference scale", () => {
    expect(handicapAdjustedRating(80, "SIX_PIECES")).toBe(1);
  });
});
