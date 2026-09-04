import {
  HARD_RATING_FLOOR,
  roundToNearestEven,
  standardGameChange,
} from "./math.js";
import { handicapRatingEffect } from "./handicap.js";
import {
  calculatePerformanceRating,
  priorGradeGames,
  shouldUsePerformanceRating,
  toPersistedPriorGames,
  type PerformanceGame,
} from "./performance.js";
import type {
  FesaGame,
  FesaPlayer,
  FesaPlayerResult,
  FesaResult,
  FesaTournamentInput,
  FesaTournamentResult,
} from "./types.js";

const MAX_ITERATIONS = 1000;

function playerRelativeResult(
  game: FesaGame,
  playerId: string,
): FesaResult {
  if (game.result === "DRAW") return "DRAW";

  if (game.playerAId === playerId) {
    return game.result === "A_WIN" ? "WIN" : "LOSS";
  }

  if (game.playerBId === playerId) {
    return game.result === "B_WIN" ? "WIN" : "LOSS";
  }

  throw new Error(`Player ${playerId} does not participate in game ${game.id}`);
}

function validateInput(input: FesaTournamentInput): void {
  const playerIds = new Set<string>();
  for (const player of input.players) {
    if (playerIds.has(player.id)) {
      throw new Error(`Duplicate player id: ${player.id}`);
    }
    playerIds.add(player.id);

    if (player.state.rating !== undefined && player.state.rating < 1) {
      throw new Error(`Invalid rating for player ${player.id}`);
    }
    if (player.state.ratedGames < 0 || !Number.isInteger(player.state.ratedGames)) {
      throw new Error(`Invalid ratedGames for player ${player.id}`);
    }
    if (
      player.state.bonusGamesUsed < 0 ||
      player.state.bonusGamesUsed > 100 ||
      !Number.isInteger(player.state.bonusGamesUsed)
    ) {
      throw new Error(`Invalid bonusGamesUsed for player ${player.id}`);
    }

    if (
      player.state.priorRatedGames?.some(
        (game) =>
          !Number.isFinite(game.opponentRating) ||
          game.opponentRating < 1,
      )
    ) {
      throw new Error(`Invalid prior rated game for player ${player.id}`);
    }
  }

  const gameIds = new Set<string>();
  for (const game of input.games) {
    if (gameIds.has(game.id)) {
      throw new Error(`Duplicate game id: ${game.id}`);
    }
    gameIds.add(game.id);

    if (game.playerAId === game.playerBId) {
      throw new Error(`Game ${game.id} has the same player on both sides`);
    }
    if (!playerIds.has(game.playerAId) || !playerIds.has(game.playerBId)) {
      throw new Error(`Game ${game.id} references an unknown player`);
    }

    if (
      game.handicap !== undefined &&
      game.handicap.giverId !== game.playerAId &&
      game.handicap.giverId !== game.playerBId
    ) {
      throw new Error(
        `Handicap giver ${game.handicap.giverId} does not participate in game ${game.id}`,
      );
    }
  }
}


function effectiveOpponentRating(args: {
  game: FesaGame;
  player: FesaPlayer;
  opponentRating: number;
  iterationRatings: Map<string, number>;
}): number {
  const { game, player, opponentRating } = args;

  if (game.handicap === undefined) {
    return opponentRating;
  }

  const playerIsGiver = game.handicap.giverId === player.id;

  if (playerIsGiver) {
    const giverRating =
      player.state.rating ??
      args.iterationRatings.get(player.id);

    if (giverRating === undefined) {
      throw new Error(
        `Missing handicap giver rating for player ${player.id}`,
      );
    }

    return (
      opponentRating +
      handicapRatingEffect(giverRating, game.handicap.type)
    );
  }

  // The opponent is the handicap giver. FESA defines the handicap effect
  // from the giver's rating, and the opponent rating here is the current
  // post-event rating estimate used by the tournament-wide iteration.
  return (
    opponentRating -
    handicapRatingEffect(opponentRating, game.handicap.type)
  );
}

function ratedGamesForPlayer(
  games: FesaGame[],
  playerId: string,
): FesaGame[] {
  return games.filter(
    (game) =>
      game.rated &&
      (game.playerAId === playerId || game.playerBId === playerId),
  );
}

function initialGuess(player: FesaPlayer): number {
  if (player.state.rating !== undefined) return player.state.rating;
  if (player.priorGrade !== undefined) {
    return priorGradeGames(player.priorGrade)[0]?.opponentRating ?? 1;
  }
  return 1;
}

function calculatePlayer(args: {
  player: FesaPlayer;
  games: FesaGame[];
  opponentRatings: Map<string, number>;
}): FesaPlayerResult {
  const { player } = args;
  const currentGames = ratedGamesForPlayer(args.games, player.id);
  const priorGames = player.state.priorRatedGames ?? [];

  if (currentGames.length === 0) {
    return {
      id: player.id,
      ...(player.state.rating !== undefined
        ? {
            ratingBefore: player.state.rating,
            ratingAfter: player.state.rating,
            ratingChange: 0,
          }
        : {}),
      ratedGamesBefore: player.state.ratedGames,
      ratedGamesAfter: player.state.ratedGames,
      bonusGamesUsedBefore: player.state.bonusGamesUsed,
      bonusGamesUsedAfter: player.state.bonusGamesUsed,
      calculationMethod: "UNCHANGED",
      ...(player.state.priorRatedGames !== undefined
        ? { priorRatedGames: player.state.priorRatedGames }
        : {}),
    };
  }

  const gradeGames =
    player.state.ratedGames === 0
      ? priorGradeGames(player.priorGrade)
      : [];

  const usePerformance = shouldUsePerformanceRating({
    priorRatedGamesCount: player.state.ratedGames,
    syntheticPriorGradeGames: gradeGames.length,
    currentRatedGames: currentGames.length,
    priorResults: priorGames.map((game) => game.result),
  });

  if (
    usePerformance &&
    player.state.ratedGames > 0 &&
    priorGames.length !== player.state.ratedGames
  ) {
    throw new Error(
      `Player ${player.id} requires complete priorRatedGames while performance rating is active`,
    );
  }

  const ratedGamesBefore = player.state.ratedGames;
  const ratedGamesAfter =
    ratedGamesBefore + gradeGames.length + currentGames.length;

  if (usePerformance) {
    const currentPerformanceGames: PerformanceGame[] = currentGames.map((game) => {
      const opponentId =
        game.playerAId === player.id ? game.playerBId : game.playerAId;
      const opponentRating = args.opponentRatings.get(opponentId);
      if (opponentRating === undefined) {
        throw new Error(`Missing opponent rating for ${opponentId}`);
      }
      return {
        opponentRating: effectiveOpponentRating({
          game,
          player,
          opponentRating,
          iterationRatings: args.opponentRatings,
        }),
        result: playerRelativeResult(game, player.id),
      };
    });

    const allGames: PerformanceGame[] = [
      ...gradeGames,
      ...priorGames,
      ...currentPerformanceGames,
    ];

    const ratingAfter = calculatePerformanceRating(allGames);
    const allResults = allGames.map((game) => game.result);
    const remainsPerformance =
      ratedGamesAfter < 9 ||
      allResults.every((result) => result === "WIN") ||
      allResults.every((result) => result === "LOSS");

    return {
      id: player.id,
      ...(player.state.rating !== undefined
        ? { ratingBefore: player.state.rating }
        : {}),
      ratingAfter,
      ...(player.state.rating !== undefined
        ? { ratingChange: ratingAfter - player.state.rating }
        : {}),
      ratedGamesBefore,
      ratedGamesAfter,
      bonusGamesUsedBefore: player.state.bonusGamesUsed,
      bonusGamesUsedAfter: player.state.bonusGamesUsed,
      calculationMethod: "PERFORMANCE",
      ...(remainsPerformance
        ? { priorRatedGames: toPersistedPriorGames(allGames) }
        : {}),
    };
  }

  if (player.state.rating === undefined) {
    throw new Error(
      `Established calculation requires a rating for player ${player.id}`,
    );
  }

  let runningRating = player.state.rating;
  let accumulatedChange = 0;
  let bonusGamesUsed = player.state.bonusGamesUsed;

  for (const game of currentGames) {
    const opponentId =
      game.playerAId === player.id ? game.playerBId : game.playerAId;
    const opponentRating = args.opponentRatings.get(opponentId);
    if (opponentRating === undefined) {
      throw new Error(`Missing opponent rating for ${opponentId}`);
    }

    const gameResult = standardGameChange({
      playerRating: runningRating,
      opponentRating: effectiveOpponentRating({
        game,
        player,
        opponentRating,
        iterationRatings: args.opponentRatings,
      }),
      result: playerRelativeResult(game, player.id),
      bonusGamesUsed,
    });

    accumulatedChange += gameResult.change;
    runningRating = player.state.rating + accumulatedChange;
    bonusGamesUsed = gameResult.bonusGamesUsedAfter;
  }

  const roundedChange = roundToNearestEven(accumulatedChange);
  const ratingAfter = Math.max(
    HARD_RATING_FLOOR,
    player.state.rating + roundedChange,
  );

  return {
    id: player.id,
    ratingBefore: player.state.rating,
    ratingAfter,
    ratingChange: ratingAfter - player.state.rating,
    ratedGamesBefore,
    ratedGamesAfter,
    bonusGamesUsedBefore: player.state.bonusGamesUsed,
    bonusGamesUsedAfter: bonusGamesUsed,
    calculationMethod: "STANDARD",
  };
}

export function calculateTournament(
  input: FesaTournamentInput,
): FesaTournamentResult {
  validateInput(input);

  if (input.players.length === 0) {
    return { players: [] };
  }

  let opponentRatings = new Map(
    input.players.map((player) => [player.id, initialGuess(player)]),
  );

  let previousResults: FesaPlayerResult[] | undefined;

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration += 1) {
    const workingRatings = new Map(opponentRatings);
    const results: FesaPlayerResult[] = [];

    // Legacy turnering.lisp updates players sequentially within each
    // tournament iteration. Later players therefore see already-updated
    // post-event estimates for earlier players (Gauss-Seidel style),
    // rather than every player reading the same previous-iteration snapshot.
    for (const player of input.players) {
      const result = calculatePlayer({
        player,
        games: input.games,
        opponentRatings: workingRatings,
      });

      results.push(result);
      workingRatings.set(
        result.id,
        result.ratingAfter ?? initialGuess(player),
      );
    }

    const priorIteration = previousResults;
    if (
      priorIteration !== undefined &&
      results.every(
        (result, index) =>
          result.ratingAfter === priorIteration[index]?.ratingAfter,
      )
    ) {
      return { players: results };
    }

    previousResults = results;
    opponentRatings = workingRatings;
  }

  throw new Error(
    `FESA Elo calculation did not converge after ${MAX_ITERATIONS} iterations`,
  );
}
