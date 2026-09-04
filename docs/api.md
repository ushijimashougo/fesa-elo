# Library API

This document describes the proposed public TypeScript interface.

The API is intentionally small. Consumers should calculate a complete tournament rather than calling low-level Elo functions directly.

## Primary API

```ts
export function calculateTournament(
  input: FesaTournamentInput
): FesaTournamentResult
```

An optional tracing API may be exposed separately:

```ts
export function calculateTournamentWithTrace(
  input: FesaTournamentInput
): FesaTournamentTraceResult
```

Tracing is intended for specification verification and debugging, not as the normal integration path.

## Input

```ts
export type FesaTournamentInput = {
  players: FesaPlayer[]
  games: FesaGame[]
}
```

### Player

```ts
export type FesaPlayer = {
  id: string
  state: FesaRatingState
  priorGrade?: FesaGrade
}
```

`id` is opaque. The library must not assume UUIDs, numeric IDs, R-numbers, account IDs, or any particular storage scheme.

### Rating state

Proposed initial state:

```ts
export type FesaRatingState = {
  rating?: number

  ratedGames: number

  bonusGamesUsed: number

  priorRatedGames?: PriorRatedGame[]
}
```

Interpretation:

- `rating`: rating before the current tournament; absent for a genuinely unrated player.
- `ratedGames`: count of prior rated games represented by the state.
- `bonusGamesUsed`: progress toward the 100-game under-1800 bonus limit.
- `priorRatedGames`: historical games required when performance rating still needs prior results.

The exact final state shape should remain provisional until compatibility tests establish whether additional legacy state is required.

### Historical rated game

```ts
export type PriorRatedGame = {
  opponentRating: number
  result: FesaResult
}
```

`opponentRating` means the opponent's **post-event rating for that historical event**, not the opponent's current rating today.

The caller is responsible for storing and supplying these snapshots.

The history may be arbitrarily long when an all-win or all-loss player remains under performance-rating rules.

### Current tournament game

```ts
export type FesaGame = {
  id: string

  playerAId: string
  playerBId: string

  result: "A_WIN" | "B_WIN" | "DRAW"

  rated?: boolean

  handicap?: FesaHandicap
}
```

A game with `rated: false` does not affect rating.

Whether the default should be `true` or whether `rated` should be mandatory should be decided before `1.0.0`. Requiring it is safer for integrations where standings and rating eligibility differ.

### Generic result representation

Internally, player-relative results should use:

```ts
export type FesaResult =
  | "WIN"
  | "LOSS"
  | "DRAW"
```

## Output

```ts
export type FesaTournamentResult = {
  players: FesaPlayerResult[]
}
```

```ts
export type FesaPlayerResult = {
  id: string

  ratingBefore?: number
  ratingAfter?: number

  ratingChange?: number

  ratedGamesBefore: number
  ratedGamesAfter: number

  bonusGamesUsedBefore: number
  bonusGamesUsedAfter: number

  calculationMethod:
    | "STANDARD"
    | "PERFORMANCE"
    | "UNCHANGED"

  priorRatedGames?: PriorRatedGame[]
}
```

The result should contain enough state for a caller to persist the post-tournament state and pass it into the next tournament without reconstructing internal FESA state from scratch.

For an unrated player, `ratingChange` may be omitted because there is no meaningful numeric pre-rating delta.

If a participant has no rated games in the current tournament, the library returns `calculationMethod: "UNCHANGED"`. An already-rated player keeps the same `ratingAfter`; a player who was unrated remains without a `ratingAfter`.

## Trace output

A trace API is useful because compatibility failures can otherwise be difficult to diagnose.

Possible shape:

```ts
export type FesaTournamentTraceResult = {
  result: FesaTournamentResult

  trace: {
    iterations: FesaIterationTrace[]
    players: Record<string, FesaPlayerTrace>
  }
}
```

Trace information may include:

- iteration count,
- opponent effective ratings per iteration,
- K factors,
- normal gain,
- upset-gain replacement,
- under-1800 bonus,
- performance-rating solver iterations,
- soft lower-limit application,
- handicap adjustment,
- final rounding.

Trace types are diagnostic and should not be treated as stable persistence contracts.

## Grade utilities

Grade conversion belongs to the FESA domain and may be exported separately:

```ts
export function getGradeInfo(
  grade: FesaGrade
): FesaGradeInfo
```

Possible shape:

```ts
export type FesaGradeInfo = {
  lowerBound: number
  midpoint: number
  upperBound: number
}
```

Automatic grade/promotion calculation should remain separate from numeric tournament rating calculation.

## APIs that should not be public initially

Avoid exposing low-level functions such as:

```ts
calculateGame(...)
expectedScore(...)
getKFactor(...)
calculateBonus(...)
solvePerformanceRating(...)
```

as the primary integration surface.

They may be exported later if there is a concrete use case, but exposing them early encourages consumers to reproduce an incorrect game-by-game workflow that bypasses tournament-level iteration.

## Example

```ts
import {
  calculateTournament,
  type FesaTournamentInput,
} from "@nanamemichi/fesa-elo"

const input: FesaTournamentInput = {
  players: [
    {
      id: "player-a",
      state: {
        rating: 1620,
        ratedGames: 24,
        bonusGamesUsed: 24,
      },
    },
    {
      id: "player-b",
      state: {
        rating: 1510,
        ratedGames: 7,
        bonusGamesUsed: 7,
        priorRatedGames: [
          { opponentRating: 1484, result: "WIN" },
          { opponentRating: 1562, result: "LOSS" },
        ],
      },
    },
  ],
  games: [
    {
      id: "game-1",
      playerAId: "player-a",
      playerBId: "player-b",
      result: "A_WIN",
      rated: true,
    },
  ],
}

const result = calculateTournament(input)
```

## Consumer responsibility

The consuming application must:

1. identify which games are FESA-rated,
2. load each player's persisted FESA rating state,
3. provide any required prior rated-game snapshots,
4. call `calculateTournament`,
5. atomically persist the returned state,
6. retain its own tournament/game records for audit and possible future recalculation.

The library must not retrieve those records itself.
