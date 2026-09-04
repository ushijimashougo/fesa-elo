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

  it("applies handicap effects to both giver and receiver", () => {
    const players = [
      {
        id: "a",
        state: { rating: 1800, ratedGames: 20, bonusGamesUsed: 100 },
      },
      {
        id: "b",
        state: { rating: 1800, ratedGames: 20, bonusGamesUsed: 100 },
      },
    ];

    const flat = calculateTournament({
      players,
      games: [
        {
          id: "flat",
          playerAId: "a",
          playerBId: "b",
          result: "A_WIN",
          rated: true,
        },
      ],
    });

    const handicap = calculateTournament({
      players,
      games: [
        {
          id: "rook",
          playerAId: "a",
          playerBId: "b",
          result: "A_WIN",
          rated: true,
          handicap: {
            type: "ROOK",
            giverId: "a",
          },
        },
      ],
    });

    const flatA = flat.players.find((player) => player.id === "a")!;
    const flatB = flat.players.find((player) => player.id === "b")!;
    const handicapA = handicap.players.find((player) => player.id === "a")!;
    const handicapB = handicap.players.find((player) => player.id === "b")!;

    expect(handicapA.ratingAfter!).toBeGreaterThan(flatA.ratingAfter!);
    expect(handicapB.ratingAfter!).toBeLessThan(flatB.ratingAfter!);
  });

  it("rejects a handicap giver who is not in the game", () => {
    expect(() => calculateTournament({
      players: [
        {
          id: "a",
          state: { rating: 1800, ratedGames: 20, bonusGamesUsed: 100 },
        },
        {
          id: "b",
          state: { rating: 1800, ratedGames: 20, bonusGamesUsed: 100 },
        },
      ],
      games: [
        {
          id: "g1",
          playerAId: "a",
          playerBId: "b",
          result: "A_WIN",
          rated: true,
          handicap: {
            type: "ROOK",
            giverId: "c",
          },
        },
      ],
    })).toThrow(/does not participate/);
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

  it("rejects incomplete history while performance rating is active", () => {
    expect(() => calculateTournament({
      players: [
        {
          id: "a",
          state: { rating: 1500, ratedGames: 5, bonusGamesUsed: 0 },
        },
        {
          id: "b",
          state: { rating: 1500, ratedGames: 20, bonusGamesUsed: 100 },
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
    })).toThrow(/requires complete priorRatedGames/);
  });

  it("allows an established imported baseline without historical games", () => {
    const result = calculateTournament({
      players: [
        {
          id: "a",
          state: { rating: 1500, ratedGames: 20, bonusGamesUsed: 20 },
        },
        {
          id: "b",
          state: { rating: 1500, ratedGames: 20, bonusGamesUsed: 20 },
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

    expect(result.players[0]?.calculationMethod).toBe("STANDARD");
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
