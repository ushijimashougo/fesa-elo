import { describe, expect, it } from "vitest";
import { calculateTournament } from "../../src/calculateTournament.js";
import type { FesaGrade, FesaRatingState, FesaResult } from "../../src/types.js";

type Case = {
  label: string;
  id: string;
  priorGrade?: FesaGrade;
  state: FesaRatingState;
  games: Array<{ opponent: string; opponentPostRating: number; result: FesaResult }>;
  expected: number;
  tolerance?: number;
};

const cases: Case[] = [
  {
    "label": "1st",
    "id": "N13",
    "priorGrade": "3_KYU",
    "state": {
      "ratedGames": 0,
      "bonusGamesUsed": 0
    },
    "games": [
      {
        "opponent": "N17",
        "result": "LOSS",
        "opponentPostRating": 1531
      },
      {
        "opponent": "N7",
        "result": "LOSS",
        "opponentPostRating": 1336
      },
      {
        "opponent": "N3",
        "result": "LOSS",
        "opponentPostRating": 1793
      }
    ],
    "expected": 1215
  },
  {
    "label": "1st",
    "id": "N14",
    "priorGrade": "4_KYU",
    "state": {
      "ratedGames": 0,
      "bonusGamesUsed": 0
    },
    "games": [
      {
        "opponent": "N7",
        "result": "WIN",
        "opponentPostRating": 1336
      },
      {
        "opponent": "N16",
        "result": "WIN",
        "opponentPostRating": 1242
      },
      {
        "opponent": "N12",
        "result": "LOSS",
        "opponentPostRating": 2016
      }
    ],
    "expected": 1487
  },
  {
    "label": "1st",
    "id": "N16",
    "priorGrade": "7_KYU",
    "state": {
      "ratedGames": 0,
      "bonusGamesUsed": 0
    },
    "games": [
      {
        "opponent": "N8",
        "result": "WIN",
        "opponentPostRating": 1012
      },
      {
        "opponent": "N14",
        "result": "LOSS",
        "opponentPostRating": 1487
      },
      {
        "opponent": "N9",
        "result": "WIN",
        "opponentPostRating": 1187
      }
    ],
    "expected": 1242
  },
  {
    "label": "1st",
    "id": "N17",
    "priorGrade": "4_KYU",
    "state": {
      "ratedGames": 0,
      "bonusGamesUsed": 0
    },
    "games": [
      {
        "opponent": "N13",
        "result": "WIN",
        "opponentPostRating": 1215
      },
      {
        "opponent": "N15",
        "result": "WIN",
        "opponentPostRating": 1531
      },
      {
        "opponent": "N6",
        "result": "LOSS",
        "opponentPostRating": 1921
      }
    ],
    "expected": 1531
  },
  {
    "label": "2nd",
    "id": "N13",
    "state": {
      "rating": 1215,
      "ratedGames": 5,
      "bonusGamesUsed": 0,
      "priorRatedGames": [
        {
          "opponentRating": 1410,
          "result": "LOSS"
        },
        {
          "opponentRating": 1410,
          "result": "WIN"
        },
        {
          "opponentRating": 1531,
          "result": "LOSS"
        },
        {
          "opponentRating": 1336,
          "result": "LOSS"
        },
        {
          "opponentRating": 1793,
          "result": "LOSS"
        }
      ]
    },
    "games": [
      {
        "opponent": "N15",
        "result": "LOSS",
        "opponentPostRating": 1550
      },
      {
        "opponent": "N16",
        "result": "WIN",
        "opponentPostRating": 1165
      },
      {
        "opponent": "N20",
        "result": "WIN",
        "opponentPostRating": 1316
      }
    ],
    "expected": 1327
  },
  {
    "label": "2nd",
    "id": "N16",
    "state": {
      "rating": 1242,
      "ratedGames": 5,
      "bonusGamesUsed": 0,
      "priorRatedGames": [
        {
          "opponentRating": 1080,
          "result": "LOSS"
        },
        {
          "opponentRating": 1080,
          "result": "WIN"
        },
        {
          "opponentRating": 1012,
          "result": "WIN"
        },
        {
          "opponentRating": 1487,
          "result": "LOSS"
        },
        {
          "opponentRating": 1187,
          "result": "WIN"
        }
      ]
    },
    "games": [
      {
        "opponent": "N17",
        "result": "LOSS",
        "opponentPostRating": 1679
      },
      {
        "opponent": "N13",
        "result": "LOSS",
        "opponentPostRating": 1327
      },
      {
        "opponent": "N102",
        "result": "LOSS",
        "opponentPostRating": 1518
      }
    ],
    "expected": 1165
  },
  {
    "label": "2nd",
    "id": "N17",
    "state": {
      "rating": 1531,
      "ratedGames": 5,
      "bonusGamesUsed": 0,
      "priorRatedGames": [
        {
          "opponentRating": 1320,
          "result": "LOSS"
        },
        {
          "opponentRating": 1320,
          "result": "WIN"
        },
        {
          "opponentRating": 1215,
          "result": "WIN"
        },
        {
          "opponentRating": 1531,
          "result": "WIN"
        },
        {
          "opponentRating": 1921,
          "result": "LOSS"
        }
      ]
    },
    "games": [
      {
        "opponent": "N16",
        "result": "WIN",
        "opponentPostRating": 1165
      },
      {
        "opponent": "N19",
        "result": "WIN",
        "opponentPostRating": 1463
      },
      {
        "opponent": "N22",
        "result": "WIN",
        "opponentPostRating": 1563
      }
    ],
    "expected": 1679
  },
  {
    "label": "2nd",
    "id": "N24",
    "priorGrade": "4_DAN",
    "state": {
      "ratedGames": 0,
      "bonusGamesUsed": 0
    },
    "games": [
      {
        "opponent": "N23",
        "result": "WIN",
        "opponentPostRating": 1714
      },
      {
        "opponent": "N103",
        "result": "LOSS",
        "opponentPostRating": 2308
      },
      {
        "opponent": "N2",
        "result": "WIN",
        "opponentPostRating": 2205
      }
    ],
    "expected": 2217
  },
  {
    "label": "3rd",
    "id": "N13",
    "state": {
      "rating": 1327,
      "ratedGames": 8,
      "bonusGamesUsed": 0,
      "priorRatedGames": [
        {
          "opponentRating": 1793,
          "result": "LOSS"
        },
        {
          "opponentRating": 1336,
          "result": "LOSS"
        },
        {
          "opponentRating": 1531,
          "result": "LOSS"
        },
        {
          "opponentRating": 1410,
          "result": "WIN"
        },
        {
          "opponentRating": 1410,
          "result": "LOSS"
        },
        {
          "opponentRating": 1550,
          "result": "LOSS"
        },
        {
          "opponentRating": 1165,
          "result": "WIN"
        },
        {
          "opponentRating": 1316,
          "result": "WIN"
        }
      ]
    },
    "games": [
      {
        "opponent": "N30",
        "result": "LOSS",
        "opponentPostRating": 1695
      },
      {
        "opponent": "N31",
        "result": "LOSS",
        "opponentPostRating": 1368
      },
      {
        "opponent": "N17",
        "result": "WIN",
        "opponentPostRating": 1647
      }
    ],
    "expected": 1377
  },
  {
    "label": "3rd",
    "id": "N14",
    "state": {
      "rating": 1487,
      "ratedGames": 5,
      "bonusGamesUsed": 0,
      "priorRatedGames": [
        {
          "opponentRating": 1320,
          "result": "LOSS"
        },
        {
          "opponentRating": 1320,
          "result": "WIN"
        },
        {
          "opponentRating": 1336,
          "result": "WIN"
        },
        {
          "opponentRating": 1242,
          "result": "WIN"
        },
        {
          "opponentRating": 2016,
          "result": "LOSS"
        }
      ]
    },
    "games": [
      {
        "opponent": "N31",
        "result": "WIN",
        "opponentPostRating": 1368
      },
      {
        "opponent": "N8",
        "result": "WIN",
        "opponentPostRating": 996
      },
      {
        "opponent": "N16",
        "result": "LOSS",
        "opponentPostRating": 1232
      }
    ],
    "expected": 1431
  },
  {
    "label": "3rd",
    "id": "N16",
    "state": {
      "rating": 1165,
      "ratedGames": 8,
      "bonusGamesUsed": 0,
      "priorRatedGames": [
        {
          "opponentRating": 1187,
          "result": "WIN"
        },
        {
          "opponentRating": 1487,
          "result": "LOSS"
        },
        {
          "opponentRating": 1012,
          "result": "WIN"
        },
        {
          "opponentRating": 1080,
          "result": "WIN"
        },
        {
          "opponentRating": 1080,
          "result": "LOSS"
        },
        {
          "opponentRating": 1679,
          "result": "LOSS"
        },
        {
          "opponentRating": 1327,
          "result": "LOSS"
        },
        {
          "opponentRating": 1518,
          "result": "LOSS"
        }
      ]
    },
    "games": [
      {
        "opponent": "N8",
        "result": "WIN",
        "opponentPostRating": 996
      },
      {
        "opponent": "N17",
        "result": "LOSS",
        "opponentPostRating": 1647
      },
      {
        "opponent": "N14",
        "result": "WIN",
        "opponentPostRating": 1431
      }
    ],
    "expected": 1232,
    "tolerance": 1
  },
  {
    "label": "3rd",
    "id": "N17",
    "state": {
      "rating": 1679,
      "ratedGames": 8,
      "bonusGamesUsed": 0,
      "priorRatedGames": [
        {
          "opponentRating": 1921,
          "result": "LOSS"
        },
        {
          "opponentRating": 1531,
          "result": "WIN"
        },
        {
          "opponentRating": 1215,
          "result": "WIN"
        },
        {
          "opponentRating": 1320,
          "result": "WIN"
        },
        {
          "opponentRating": 1320,
          "result": "LOSS"
        },
        {
          "opponentRating": 1165,
          "result": "WIN"
        },
        {
          "opponentRating": 1463,
          "result": "WIN"
        },
        {
          "opponentRating": 1563,
          "result": "WIN"
        }
      ]
    },
    "games": [
      {
        "opponent": "N15",
        "result": "LOSS",
        "opponentPostRating": 1573
      },
      {
        "opponent": "N16",
        "result": "WIN",
        "opponentPostRating": 1232
      },
      {
        "opponent": "N13",
        "result": "LOSS",
        "opponentPostRating": 1377
      }
    ],
    "expected": 1647,
    "tolerance": 1
  },
  {
    "label": "3rd",
    "id": "N24",
    "state": {
      "rating": 2217,
      "ratedGames": 5,
      "bonusGamesUsed": 0,
      "priorRatedGames": [
        {
          "opponentRating": 2160,
          "result": "LOSS"
        },
        {
          "opponentRating": 2160,
          "result": "WIN"
        },
        {
          "opponentRating": 1714,
          "result": "WIN"
        },
        {
          "opponentRating": 2308,
          "result": "LOSS"
        },
        {
          "opponentRating": 2205,
          "result": "WIN"
        }
      ]
    },
    "games": [
      {
        "opponent": "N29",
        "result": "WIN",
        "opponentPostRating": 1866
      },
      {
        "opponent": "N32",
        "result": "LOSS",
        "opponentPostRating": 2446
      },
      {
        "opponent": "N21",
        "result": "WIN",
        "opponentPostRating": 1918
      }
    ],
    "expected": 2224
  },
  {
    "label": "3rd",
    "id": "N30",
    "priorGrade": "3_KYU",
    "state": {
      "ratedGames": 0,
      "bonusGamesUsed": 0
    },
    "games": [
      {
        "opponent": "N13",
        "result": "WIN",
        "opponentPostRating": 1377
      },
      {
        "opponent": "N15",
        "result": "WIN",
        "opponentPostRating": 1573
      },
      {
        "opponent": "N25",
        "result": "WIN",
        "opponentPostRating": 1462
      }
    ],
    "expected": 1695
  },
  {
    "label": "4th",
    "id": "N14",
    "state": {
      "rating": 1431,
      "ratedGames": 8,
      "bonusGamesUsed": 0,
      "priorRatedGames": [
        {
          "opponentRating": 2016,
          "result": "LOSS"
        },
        {
          "opponentRating": 1242,
          "result": "WIN"
        },
        {
          "opponentRating": 1336,
          "result": "WIN"
        },
        {
          "opponentRating": 1320,
          "result": "WIN"
        },
        {
          "opponentRating": 1320,
          "result": "LOSS"
        },
        {
          "opponentRating": 1368,
          "result": "WIN"
        },
        {
          "opponentRating": 996,
          "result": "WIN"
        },
        {
          "opponentRating": 1232,
          "result": "LOSS"
        }
      ]
    },
    "games": [
      {
        "opponent": "N33",
        "result": "WIN",
        "opponentPostRating": 1328
      },
      {
        "opponent": "N17",
        "result": "LOSS",
        "opponentPostRating": 1640
      },
      {
        "opponent": "N27",
        "result": "LOSS",
        "opponentPostRating": 1846
      }
    ],
    "expected": 1437
  },
  {
    "label": "4th",
    "id": "N17",
    "state": {
      "rating": 1647,
      "ratedGames": 11,
      "bonusGamesUsed": 3
    },
    "games": [
      {
        "opponent": "N34",
        "result": "WIN",
        "opponentPostRating": 1249
      },
      {
        "opponent": "N14",
        "result": "WIN",
        "opponentPostRating": 1437
      },
      {
        "opponent": "N31",
        "result": "LOSS",
        "opponentPostRating": 1490
      }
    ],
    "expected": 1640
  },
  {
    "label": "4th",
    "id": "N24",
    "state": {
      "rating": 2224,
      "ratedGames": 8,
      "bonusGamesUsed": 0,
      "priorRatedGames": [
        {
          "opponentRating": 2205,
          "result": "WIN"
        },
        {
          "opponentRating": 2308,
          "result": "LOSS"
        },
        {
          "opponentRating": 1714,
          "result": "WIN"
        },
        {
          "opponentRating": 2160,
          "result": "WIN"
        },
        {
          "opponentRating": 2160,
          "result": "LOSS"
        },
        {
          "opponentRating": 1866,
          "result": "WIN"
        },
        {
          "opponentRating": 2446,
          "result": "LOSS"
        },
        {
          "opponentRating": 1918,
          "result": "WIN"
        }
      ]
    },
    "games": [
      {
        "opponent": "N32",
        "result": "LOSS",
        "opponentPostRating": 2500
      },
      {
        "opponent": "N2",
        "result": "LOSS",
        "opponentPostRating": 2276
      },
      {
        "opponent": "N30",
        "result": "WIN",
        "opponentPostRating": 1789
      }
    ],
    "expected": 2214
  },
  {
    "label": "4th",
    "id": "N30",
    "state": {
      "rating": 1695,
      "ratedGames": 5,
      "bonusGamesUsed": 0,
      "priorRatedGames": [
        {
          "opponentRating": 1410,
          "result": "LOSS"
        },
        {
          "opponentRating": 1410,
          "result": "WIN"
        },
        {
          "opponentRating": 1377,
          "result": "WIN"
        },
        {
          "opponentRating": 1573,
          "result": "WIN"
        },
        {
          "opponentRating": 1462,
          "result": "WIN"
        }
      ]
    },
    "games": [
      {
        "opponent": "N31",
        "result": "WIN",
        "opponentPostRating": 1490
      },
      {
        "opponent": "N26",
        "result": "WIN",
        "opponentPostRating": 1630
      },
      {
        "opponent": "N24",
        "result": "LOSS",
        "opponentPostRating": 2214
      }
    ],
    "expected": 1789,
    "tolerance": 1
  },
  {
    "label": "5th",
    "id": "N17",
    "state": {
      "rating": 1640,
      "ratedGames": 14,
      "bonusGamesUsed": 6
    },
    "games": [
      {
        "opponent": "N26",
        "result": "LOSS",
        "opponentPostRating": 1643
      },
      {
        "opponent": "N36",
        "result": "LOSS",
        "opponentPostRating": 1650
      },
      {
        "opponent": "N35",
        "result": "LOSS",
        "opponentPostRating": 1676
      }
    ],
    "expected": 1609
  },
  {
    "label": "5th",
    "id": "N24",
    "state": {
      "rating": 2214,
      "ratedGames": 11,
      "bonusGamesUsed": 3
    },
    "games": [
      {
        "opponent": "N37",
        "result": "LOSS",
        "opponentPostRating": 2580
      },
      {
        "opponent": "N27",
        "result": "WIN",
        "opponentPostRating": 1736
      },
      {
        "opponent": "N30",
        "result": "WIN",
        "opponentPostRating": 1794
      }
    ],
    "expected": 2215
  },
  {
    "label": "5th",
    "id": "N30",
    "state": {
      "rating": 1789,
      "ratedGames": 8,
      "bonusGamesUsed": 0,
      "priorRatedGames": [
        {
          "opponentRating": 1462,
          "result": "WIN"
        },
        {
          "opponentRating": 1573,
          "result": "WIN"
        },
        {
          "opponentRating": 1377,
          "result": "WIN"
        },
        {
          "opponentRating": 1410,
          "result": "WIN"
        },
        {
          "opponentRating": 1410,
          "result": "LOSS"
        },
        {
          "opponentRating": 1490,
          "result": "WIN"
        },
        {
          "opponentRating": 1630,
          "result": "WIN"
        },
        {
          "opponentRating": 2214,
          "result": "LOSS"
        }
      ]
    },
    "games": [
      {
        "opponent": "N2",
        "result": "LOSS",
        "opponentPostRating": 2277
      },
      {
        "opponent": "N35",
        "result": "WIN",
        "opponentPostRating": 1676
      },
      {
        "opponent": "N24",
        "result": "LOSS",
        "opponentPostRating": 2215
      }
    ],
    "expected": 1794
  }
] as Case[];

function toTournamentResult(result: FesaResult): "A_WIN" | "B_WIN" | "DRAW" {
  if (result === "DRAW") return "DRAW";
  return result === "WIN" ? "A_WIN" : "B_WIN";
}

describe("legacy Nekomadoken provisional-to-established compatibility", () => {
  for (const testCase of cases) {
    it(`${testCase.label} ${testCase.id} stays compatible with legacy kota/elo_rating`, () => {
      const opponents = [...new Map(
        testCase.games.map((game) => [
          game.opponent,
          { id: game.opponent, rating: game.opponentPostRating },
        ]),
      ).values()];

      const result = calculateTournament({
        players: [
          {
            id: testCase.id,
            state: testCase.state,
            ...(testCase.priorGrade ? { priorGrade: testCase.priorGrade } : {}),
          },
          ...opponents.map((opponent) => ({
            id: opponent.id,
            state: {
              rating: opponent.rating,
              ratedGames: 9,
              bonusGamesUsed: 100,
            },
          })),
        ],
        games: testCase.games.map((game, index) => ({
          id: `${testCase.label}-${testCase.id}-${index + 1}`,
          playerAId: testCase.id,
          playerBId: game.opponent,
          result: toTournamentResult(game.result),
          rated: true,
        })),
      });

      const actual = result.players.find((player) => player.id === testCase.id)?.ratingAfter;
      expect(actual).toBeDefined();
      expect(Math.abs((actual ?? 0) - testCase.expected)).toBeLessThanOrEqual(
        testCase.tolerance ?? 0,
      );
    });
  }
});
