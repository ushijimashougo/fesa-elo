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
  it("matches an established-player result from the 8th Nekomadoken archive", () => {
    // N17 in archives/8th_nekomadoken:
    // pre: 1555, games 23, bonus-count 15
    // current rated games, using opponents' post-event ratings:
    //   WIN  vs N43 (1651)
    //   WIN  vs N48 (1461)
    //   LOSS vs N46 (1566)
    // legacy post: 1572, games 26, bonus-count 18
    //
    // Opponent states below are intentionally set up so they remain unchanged
    // while still providing the legacy post-event ratings used by the player.
    const result = calculateTournament({
      players: [
        {
          id: "N17",
          state: {
            rating: 1555,
            ratedGames: 23,
            bonusGamesUsed: 15,
          },
        },
        {
          id: "N43",
          state: {
            rating: 1651,
            ratedGames: 20,
            bonusGamesUsed: 100,
          },
        },
        {
          id: "N48",
          state: {
            rating: 1461,
            ratedGames: 20,
            bonusGamesUsed: 100,
          },
        },
        {
          id: "N46",
          state: {
            rating: 1566,
            ratedGames: 20,
            bonusGamesUsed: 100,
          },
        },
      ],
      games: [
        {
          id: "n17-r1",
          playerAId: "N17",
          playerBId: "N43",
          result: "A_WIN",
          rated: true,
        },
        {
          id: "n17-r2",
          playerAId: "N17",
          playerBId: "N48",
          result: "A_WIN",
          rated: true,
        },
        {
          id: "n17-r3",
          playerAId: "N17",
          playerBId: "N46",
          result: "B_WIN",
          rated: true,
        },
      ],
    });

    const n17 = result.players.find((player) => player.id === "N17");

    expect(n17).toMatchObject({
      ratingBefore: 1555,
      ratingAfter: 1572,
      ratedGamesBefore: 23,
      ratedGamesAfter: 26,
      bonusGamesUsedBefore: 15,
      bonusGamesUsedAfter: 18,
      calculationMethod: "STANDARD",
    });
  });

});
