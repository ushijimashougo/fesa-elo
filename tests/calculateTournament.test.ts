import { describe, expect, it } from "vitest";
import { calculateTournament } from "../src/calculateTournament.js";

describe("calculateTournament", () => {
  it("calculates a complete tournament and iterates opponent post-event ratings", () => {
    const result = calculateTournament({
      players: [
        {
          id: "a",
          state: { rating: 1600, ratedGames: 20, bonusGamesUsed: 100 },
        },
        {
          id: "b",
          state: { rating: 1600, ratedGames: 20, bonusGamesUsed: 100 },
        },
      ],
      games: [
        {
          id: "g1",
          playerAId: "a",
          playerBId: "b",
          result: "A_WIN",
          rated: true,
        },
      ],
    });

    const a = result.players.find((player) => player.id === "a");
    const b = result.players.find((player) => player.id === "b");

    expect(a?.calculationMethod).toBe("STANDARD");
    expect(b?.calculationMethod).toBe("STANDARD");
    expect(a?.ratingAfter).toBeGreaterThan(1600);
    expect(b?.ratingAfter).toBeLessThan(1600);
  });

  it("ignores unrated games", () => {
    const result = calculateTournament({
      players: [
        {
          id: "a",
          state: { rating: 1600, ratedGames: 20, bonusGamesUsed: 20 },
        },
        {
          id: "b",
          state: { rating: 1600, ratedGames: 20, bonusGamesUsed: 20 },
        },
      ],
      games: [
        {
          id: "g1",
          playerAId: "a",
          playerBId: "b",
          result: "A_WIN",
          rated: false,
        },
      ],
    });

    expect(result.players[0]?.ratingAfter).toBe(1600);
    expect(result.players[0]?.calculationMethod).toBe("UNCHANGED");
    expect(result.players[1]?.ratingAfter).toBe(1600);
  });

  it("keeps an unrated non-playing participant unrated", () => {
    const result = calculateTournament({
      players: [
        {
          id: "a",
          state: { ratedGames: 0, bonusGamesUsed: 0 },
        },
      ],
      games: [],
    });

    expect(result.players[0]?.ratingAfter).toBeUndefined();
    expect(result.players[0]?.calculationMethod).toBe("UNCHANGED");
  });

  it("creates a performance rating for a first tournament", () => {
    const result = calculateTournament({
      players: [
        {
          id: "new",
          state: { ratedGames: 0, bonusGamesUsed: 0 },
          priorGrade: "3_KYU",
        },
        {
          id: "opponent",
          state: { rating: 1500, ratedGames: 20, bonusGamesUsed: 100 },
        },
      ],
      games: [
        {
          id: "g1",
          playerAId: "new",
          playerBId: "opponent",
          result: "A_WIN",
          rated: true,
        },
      ],
    });

    const player = result.players.find((item) => item.id === "new");

    expect(player?.calculationMethod).toBe("PERFORMANCE");
    expect(player?.ratingAfter).toBeDefined();
    expect(player?.ratedGamesAfter).toBe(3);
  });
});
