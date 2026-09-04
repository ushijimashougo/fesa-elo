import { describe, expect, it } from "vitest";
import { calculateTournament } from "../../src/calculateTournament.js";

describe("kota/elo_rating legacy compatibility", () => {
  it("matches the bundled Nekomado-ken sample", () => {
    const result = calculateTournament({
      players: [
        {
          id: "Ishikawa",
          state: {
            rating: 1766,
            ratedGames: 5,
            bonusGamesUsed: 0,
            priorRatedGames: [
              { opponentRating: 1740, result: "LOSS" },
              { opponentRating: 1740, result: "WIN" },
              { opponentRating: 1315, result: "WIN" },
              { opponentRating: 400, result: "WIN" },
              { opponentRating: 850, result: "WIN" },
            ],
          },
        },
        {
          id: "Ould Ahmed",
          state: {
            rating: 1315,
            ratedGames: 3,
            bonusGamesUsed: 0,
            priorRatedGames: [
              { opponentRating: 1766, result: "LOSS" },
              { opponentRating: 850, result: "WIN" },
              { opponentRating: 400, result: "WIN" },
            ],
          },
        },
        {
          id: "Hebert",
          state: {
            rating: 850,
            ratedGames: 3,
            bonusGamesUsed: 0,
            priorRatedGames: [
              { opponentRating: 400, result: "WIN" },
              { opponentRating: 1315, result: "LOSS" },
              { opponentRating: 1766, result: "LOSS" },
            ],
          },
        },
        {
          id: "Mazouzi",
          state: {
            rating: 1,
            ratedGames: 3,
            bonusGamesUsed: 0,
            priorRatedGames: [
              { opponentRating: 850, result: "LOSS" },
              { opponentRating: 1766, result: "LOSS" },
              { opponentRating: 1315, result: "LOSS" },
            ],
          },
        },
      ],
      games: [
        {
          id: "r1-1",
          playerAId: "Ishikawa",
          playerBId: "Ould Ahmed",
          result: "A_WIN",
          rated: true,
        },
        {
          id: "r1-2",
          playerAId: "Hebert",
          playerBId: "Mazouzi",
          result: "A_WIN",
          rated: true,
        },
        {
          id: "r2-1",
          playerAId: "Ishikawa",
          playerBId: "Mazouzi",
          result: "A_WIN",
          rated: true,
        },
        {
          id: "r2-2",
          playerAId: "Ould Ahmed",
          playerBId: "Hebert",
          result: "A_WIN",
          rated: true,
        },
        {
          id: "r3-1",
          playerAId: "Ishikawa",
          playerBId: "Hebert",
          result: "A_WIN",
          rated: true,
        },
        {
          id: "r3-2",
          playerAId: "Ould Ahmed",
          playerBId: "Mazouzi",
          result: "A_WIN",
          rated: true,
        },
      ],
    });

    expect(
      Object.fromEntries(
        result.players.map((player) => [player.id, player.ratingAfter]),
      ),
    ).toEqual({
      Ishikawa: 1787,
      "Ould Ahmed": 1321,
      Hebert: 852,
      Mazouzi: 1,
    });
  });
});
