import { describe, expect, it } from "vitest";
import { calculateTournament } from "../../src/calculateTournament.js";

describe("1st Nekomadoken 2016-04-29", () => {
  it("matches all published post-event ratings", () => {
    const expected: Record<string, number> = {
      "2": 2262, "3": 1793, "4": 1926, "5": 1398, "6": 1921,
      "7": 1336, "8": 1012, "9": 1187, "10": 2259, "11": 2101,
      "12": 2016, "13": 1215, "14": 1487, "15": 1531, "16": 1242,
      "17": 1531, "18": 2411,
    };

    const players = [
      ["2", "5_DAN"], ["3", "2_DAN"], ["4", "2_DAN"], ["5", "2_KYU"],
      ["6", "3_DAN"], ["7", "3_KYU"], ["8", "5_KYU"], ["9", "5_KYU"],
      ["10", "3_DAN"], ["11", "4_DAN"], ["12", "3_DAN"], ["13", "3_KYU"],
      ["14", "4_KYU"], ["15", "2_KYU"], ["16", "7_KYU"], ["17", "4_KYU"],
      ["18", "5_DAN"],
    ] as const;

    const games = [
      ["2-10","2","10","B_WIN"], ["2-11","2","11","A_WIN"],
      ["3-4","3","4","B_WIN"], ["3-5","3","5","A_WIN"], ["3-13","3","13","A_WIN"],
      ["4-10","4","10","B_WIN"], ["5-8","5","8","A_WIN"], ["5-15","5","15","B_WIN"],
      ["6-11","6","11","B_WIN"], ["6-17","6","17","A_WIN"], ["6-18","6","18","B_WIN"],
      ["7-13","7","13","A_WIN"], ["7-14","7","14","B_WIN"], ["7-15","7","15","B_WIN"],
      ["8-9","8","9","B_WIN"], ["8-16","8","16","B_WIN"], ["9-16","9","16","B_WIN"],
      ["11-18","11","18","B_WIN"], ["12-14","12","14","A_WIN"],
      ["13-17","13","17","B_WIN"], ["14-16","14","16","A_WIN"], ["15-17","15","17","B_WIN"],
    ] as const;

    const result = calculateTournament({
      players: players.map(([id, priorGrade]) => ({
        id,
        state: { ratedGames: 0, bonusGamesUsed: 0 },
        priorGrade,
      })),
      games: games.map(([id, playerAId, playerBId, gameResult]) => ({
        id,
        playerAId,
        playerBId,
        result: gameResult,
        rated: true,
      })),
    });

    expect(
      Object.fromEntries(result.players.map((p) => [p.id, p.ratingAfter])),
    ).toEqual(expected);
  });
});
