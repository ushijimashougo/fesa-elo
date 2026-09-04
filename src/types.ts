export type FesaResult = "WIN" | "LOSS" | "DRAW";

export type FesaCalculationMethod = "STANDARD" | "PERFORMANCE" | "UNCHANGED";

export type PriorRatedGame = {
  opponentRating: number;
  result: FesaResult;
};

export type FesaRatingState = {
  rating?: number;
  ratedGames: number;
  bonusGamesUsed: number;
  priorRatedGames?: PriorRatedGame[];
};

export type FesaPlayer = {
  id: string;
  state: FesaRatingState;
  priorGrade?: FesaGrade;
};

export type FesaGame = {
  id: string;
  playerAId: string;
  playerBId: string;
  result: "A_WIN" | "B_WIN" | "DRAW";
  rated: boolean;
  handicap?: {
    type: FesaHandicap;
    giverId: string;
  };
};

export type FesaTournamentInput = {
  players: FesaPlayer[];
  games: FesaGame[];
};

export type FesaPlayerResult = {
  id: string;
  ratingBefore?: number;
  ratingAfter?: number;
  ratingChange?: number;
  ratedGamesBefore: number;
  ratedGamesAfter: number;
  bonusGamesUsedBefore: number;
  bonusGamesUsedAfter: number;
  calculationMethod: FesaCalculationMethod;
  priorRatedGames?: PriorRatedGame[];
};

export type FesaTournamentResult = {
  players: FesaPlayerResult[];
};

export type FesaHandicap =
  | "SENTE"
  | "LANCE"
  | "BISHOP"
  | "ROOK"
  | "ROOK_LANCE"
  | "TWO_PIECES"
  | "FOUR_PIECES"
  | "FIVE_PIECES"
  | "SIX_PIECES";

export type FesaGrade =
  | "5_DAN"
  | "4_DAN"
  | "3_DAN"
  | "2_DAN"
  | "1_DAN"
  | "1_KYU"
  | "2_KYU"
  | "3_KYU"
  | "4_KYU"
  | "5_KYU"
  | "6_KYU"
  | "7_KYU"
  | "8_KYU"
  | "9_KYU"
  | "10_KYU"
  | "11_KYU"
  | "12_KYU"
  | "13_KYU"
  | "14_KYU"
  | "15_KYU"
  | "16_KYU"
  | "17_KYU"
  | "18_KYU"
  | "19_KYU"
  | "20_KYU";

export type FesaGradeInfo = {
  midpoint: number;
};
