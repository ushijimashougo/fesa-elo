# fesa-elo

TypeScript implementation of the FESA Pan-Atlantic Elo rating system for shogi.

## Purpose

`fesa-elo` provides rating calculation as a standalone library.

The library is intentionally independent from tournament-management applications, databases, player-account systems, and storage formats. A caller supplies the players' rating state, the prior rated-game information required by the FESA algorithm, and the games from the current tournament. The library returns the calculated post-tournament rating state.

## Specification sources

The implementation should be based primarily on the published FESA rules:

- FESA Elo system: https://fesashogi.eu/elo-system/
- FESA Laws of Shogi / game rating: https://fesashogi.eu/rules/

The existing repository `kota/elo_rating` is used as a **legacy reference implementation** and compatibility oracle where useful:

- https://github.com/kota/elo_rating

It must not be treated as the sole normative specification. If the published FESA rules and the legacy implementation differ, the difference should be documented and resolved explicitly.

See:

- [Calculation specification](docs/specification.md)
- [Library API](docs/api.md)
- [Legacy reference and compatibility policy](docs/legacy-reference.md)

## Design principles

- Tournament-level calculation is the primary API.
- No database or network access inside the library.
- Player identifiers are opaque strings.
- The caller owns persistence and supplies historical rating state.
- FESA-specific rules such as performance rating, bonuses, lower limits, prior grades, iterative convergence, and handicap adjustment belong in this library.
- Tournament-management concepts such as standings, rounds, tables, registration, participant profiles, or organization-specific rules do not belong in this library.
- Calculation behavior must be covered by specification tests and legacy compatibility fixtures.

## Planned package name

```
@nanamemichi/fesa-elo
```

The package does not need to be published to npm initially. It can be consumed from GitHub or a workspace while the API and compatibility behavior are stabilized.
