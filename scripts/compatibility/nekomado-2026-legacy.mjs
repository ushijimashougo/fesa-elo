import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";
import { calculateTournament } from "../../dist/index.js";

const args = parseArgs(process.argv.slice(2));
const fixturePath = path.resolve(required(args.fixture, "--fixture"));
const legacyDir = path.resolve(required(args.legacyDir, "--legacy-dir"));
const year = Number(args.year ?? 2026);

const replay = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
const replayCase = replay.cases.find((item) => item.case_id === `nekomado-${year}`);
if (!replayCase) throw new Error(`Missing nekomado-${year} case`);

const legacyTmp = path.join(legacyDir, "tmp");
fs.rmSync(legacyTmp, { recursive: true, force: true });
fs.mkdirSync(legacyTmp, { recursive: true });

const tsStates = new Map();
for (const seed of replayCase.rating_seeds) {
  const id = String(seed.r_id);
  const rating = Number(seed.start_rating);
  if (seed.provisional) {
    const priorGrade = inferPriorGrade(rating);
    if (!priorGrade) {
      throw new Error(`Cannot infer prior grade for provisional R${id}: ${rating}`);
    }
    tsStates.set(id, {
      name: seed.name,
      state: { ratedGames: 0, bonusGamesUsed: 0, priorRatedGames: [] },
      priorGrade,
    });
  } else {
    tsStates.set(id, {
      name: seed.name,
      state: { rating, ratedGames: 9, bonusGamesUsed: 100 },
    });
  }
}

writeInitialLegacyState(
  path.join(legacyTmp, "ratingliste.pre"),
  replayCase.rating_seeds,
  year,
);
fs.writeFileSync(path.join(legacyTmp, "nye-spillere"), "()\n", "latin1");

const report = [];
for (const tournament of replayCase.tournaments) {
  const orderedIds = participantOrder(tournament);
  if (orderedIds.length === 0) continue;

  const games = (tournament.matches ?? []).map((game) => ({
    id: String(game.game_id),
    playerAId: String(game.player_a_r_id),
    playerBId: String(game.player_b_r_id),
    result:
      game.result_for_player_a === "W"
        ? "A_WIN"
        : game.result_for_player_a === "L"
          ? "B_WIN"
          : "DRAW",
    rated: true,
  }));

  const tsPlayers = orderedIds.map((id) => {
    const current = tsStates.get(id);
    if (!current) throw new Error(`Missing TypeScript state R${id}`);
    return {
      id,
      state: current.state,
      ...(current.priorGrade ? { priorGrade: current.priorGrade } : {}),
    };
  });

  writeTurnering(
    path.join(legacyTmp, "turnering.txt"),
    tournament,
    orderedIds,
    year,
  );

  execFileSync("clisp", ["turnering.lisp"], {
    cwd: legacyDir,
    stdio: ["ignore", "pipe", "pipe"],
  });

  const legacyStates = parseLegacyState(
    fs.readFileSync(path.join(legacyTmp, "ratingliste.post"), "latin1"),
  );
  const tsResult = calculateTournament({ players: tsPlayers, games });
  const tsById = new Map(tsResult.players.map((player) => [String(player.id), player]));

  const diffs = [];
  for (const id of orderedIds) {
    const legacy = legacyStates.get(id);
    const calculated = tsById.get(id);
    if (!legacy || !calculated) {
      diffs.push({ id, issue: !legacy ? "missing legacy result" : "missing fesa-elo result" });
      continue;
    }

    const tsState = {
      rating: calculated.ratingAfter ?? null,
      ratedGames: calculated.ratedGamesAfter,
      bonusGamesUsed: calculated.bonusGamesUsedAfter,
      provisional: calculated.priorRatedGames !== undefined,
    };
    const legacyComparable = {
      rating: legacy.rating,
      ratedGames: legacy.ratedGames,
      bonusGamesUsed: legacy.bonusGamesUsed,
      provisional: legacy.provisional,
    };

    if (
      tsState.rating !== legacyComparable.rating ||
      tsState.ratedGames !== legacyComparable.ratedGames ||
      tsState.bonusGamesUsed !== legacyComparable.bonusGamesUsed ||
      tsState.provisional !== legacyComparable.provisional
    ) {
      diffs.push({ id, name: tsStates.get(id)?.name, fesaElo: tsState, legacy: legacyComparable });
    }

    tsStates.set(id, {
      name: tsStates.get(id)?.name,
      state: {
        ...(calculated.ratingAfter !== undefined ? { rating: calculated.ratingAfter } : {}),
        ratedGames: calculated.ratedGamesAfter,
        bonusGamesUsed: calculated.bonusGamesUsedAfter,
        ...(calculated.priorRatedGames !== undefined
          ? { priorRatedGames: calculated.priorRatedGames }
          : {}),
      },
    });
  }

  fs.copyFileSync(
    path.join(legacyTmp, "ratingliste.post"),
    path.join(legacyTmp, "ratingliste.pre"),
  );

  report.push({
    tournament: tournament.tournament_id,
    participants: orderedIds.length,
    games: games.length,
    exact: diffs.length === 0,
    differences: diffs,
  });

  console.log(
    `${tournament.tournament_id}: participants=${orderedIds.length}, games=${games.length}, differences=${diffs.length}`,
  );
  if (diffs.length > 0) console.table(diffs);
}

const totalDiffs = report.reduce((sum, row) => sum + row.differences.length, 0);
const output = {
  year,
  fixture: fixturePath,
  legacyRepository: "kota/elo_rating",
  legacyAssumption:
    "Established seeds use ratedGames=9 and bonusGamesUsed=100, matching table-hub migration baseline; provisional seeds start from inferred prior grade.",
  tournaments: report,
  totalDifferences: totalDiffs,
};
const outputPath = path.resolve(args.output ?? ".compatibility/nekomado-2026-legacy-report.json");
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2) + "\n");

if (totalDiffs > 0) {
  console.error(`Compatibility FAILED: ${totalDiffs} player-state differences`);
  process.exitCode = 1;
} else {
  console.log(`Compatibility PASSED: all ${report.length} tournaments matched exactly`);
}

function participantOrder(tournament) {
  const out = [];
  const seen = new Set();
  const add = (value) => {
    const id = String(value);
    if (!seen.has(id)) {
      seen.add(id);
      out.push(id);
    }
  };
  for (const row of tournament.expected_ratings ?? []) add(row.r_id);
  for (const game of tournament.matches ?? []) {
    add(game.player_a_r_id);
    add(game.player_b_r_id);
  }
  return out.filter((id) =>
    (tournament.matches ?? []).some(
      (game) => String(game.player_a_r_id) === id || String(game.player_b_r_id) === id,
    ),
  );
}

function writeTurnering(file, tournament, orderedIds, year) {
  const seat = new Map(orderedIds.map((id, index) => [id, index + 1]));
  const rounds = Math.max(0, ...(tournament.matches ?? []).map((game) => Number(game.round)));
  const perPlayer = new Map(orderedIds.map((id) => [id, Array(rounds).fill("0-")]));

  for (const game of tournament.matches ?? []) {
    const a = String(game.player_a_r_id);
    const b = String(game.player_b_r_id);
    const round = Number(game.round) - 1;
    const resultA =
      game.result_for_player_a === "W" ? "+" :
      game.result_for_player_a === "L" ? "-" : "=";
    const resultB = resultA === "+" ? "-" : resultA === "-" ? "+" : "=";
    perPlayer.get(a)[round] = `${seat.get(b)}${resultA}`;
    perPlayer.get(b)[round] = `${seat.get(a)}${resultB}`;
  }

  const month = String(tournament.month).padStart(2, "0");
  const day = String(tournament.day ?? 1).padStart(2, "0");
  const lines = [
    `[Nekomado ${year}-${month}]`,
    `[${year}-${month}-${day}]`,
    ...orderedIds.map(
      (id, index) => `${index + 1} [N${id}] [] [${perPlayer.get(id).join(" ")}]`,
    ),
  ];
  fs.writeFileSync(file, lines.join("\n") + "\n", "latin1");
}

function writeInitialLegacyState(file, seeds, year) {
  const rows = seeds.map((seed) => {
    const id = String(seed.r_id);
    const rating = Number(seed.start_rating);
    if (seed.provisional) {
      const grade = legacyGrade(rating);
      if (!grade) throw new Error(`Unsupported provisional start rating R${id}: ${rating}`);
      return playerStruct({
        id,
        nsrLevel: grade.level,
        nsrName: grade.name,
        rating: 0,
        games: "NIL",
        bonusCount: 0,
        lastPlayed: `${year - 1}-12-31`,
      });
    }
    return playerStruct({
      id,
      nsrLevel: 0,
      nsrName: "",
      rating,
      games: "9",
      bonusCount: 100,
      lastPlayed: `${year - 1}-12-31`,
    });
  });
  fs.writeFileSync(file, "(" + rows.join("\n") + ")\n", "latin1");
}

function playerStruct({ id, nsrLevel, nsrName, rating, games, bonusCount, lastPlayed }) {
  return `#S(PLAYER :LAST-NAME "N${id}" :FIRST-NAME "" :NATIONALITY-LIST (#S(HOME :LIST #\\E :NATIONALITY "JP" :RESIDENS "JP" :LAST "${lastPlayed}")) :GRADE-LEVEL 0 :GRADE-NAME "" :NSR-GRADE-LEVEL ${nsrLevel} :NSR-GRADE-NAME "${nsrName}" :ELO-NUMBER ${rating} :GAMES ${games} :LAST-PLAYED "${lastPlayed}" :LB-COUNT NIL :MP-COUNT NIL :BONUS-COUNT ${bonusCount})`;
}

function parseLegacyState(text) {
  const states = new Map();
  const starts = [...text.matchAll(/#S\(PLAYER :LAST-NAME "N(\d+)"/g)];
  for (let index = 0; index < starts.length; index += 1) {
    const match = starts[index];
    const chunk = text.slice(match.index, starts[index + 1]?.index ?? text.length);
    const id = match[1];
    const rating = Number(chunk.match(/:ELO-NUMBER\s+(-?\d+)/)?.[1]);
    const bonusGamesUsed = Number(chunk.match(/:BONUS-COUNT\s+(\d+)/)?.[1] ?? 0);
    const gamesRaw = chunk.match(/:GAMES\s+([\s\S]*?)\s+:LAST-PLAYED/)?.[1]?.trim() ?? "0";
    const provisional = gamesRaw.startsWith("(") || gamesRaw === "NIL";
    const ratedGames = provisional
      ? (gamesRaw.match(/\(-?\d+\s+(?:0|1|1\/2)\s+[^)]+\)/g) ?? []).length
      : Number(gamesRaw);
    states.set(id, { rating, ratedGames, bonusGamesUsed, provisional });
  }
  return states;
}

function legacyGrade(rating) {
  const map = new Map([
    [3000, { level: 8, name: "Dan" }], [2760, { level: 7, name: "Dan" }],
    [2540, { level: 6, name: "Dan" }], [2340, { level: 5, name: "Dan" }],
    [2160, { level: 4, name: "Dan" }], [2000, { level: 3, name: "Dan" }],
    [1860, { level: 2, name: "Dan" }], [1740, { level: 1, name: "Dan" }],
    [1620, { level: 1, name: "Kyu" }], [1510, { level: 2, name: "Kyu" }],
    [1410, { level: 3, name: "Kyu" }], [1320, { level: 4, name: "Kyu" }],
    [1240, { level: 5, name: "Kyu" }], [1160, { level: 6, name: "Kyu" }],
    [1080, { level: 7, name: "Kyu" }], [1000, { level: 8, name: "Kyu" }],
    [920, { level: 9, name: "Kyu" }], [840, { level: 10, name: "Kyu" }],
    [760, { level: 11, name: "Kyu" }], [680, { level: 12, name: "Kyu" }],
    [600, { level: 13, name: "Kyu" }], [520, { level: 14, name: "Kyu" }],
    [440, { level: 15, name: "Kyu" }],
  ]);
  return map.get(rating);
}

function inferPriorGrade(rating) {
  const grade = legacyGrade(rating);
  if (!grade) return undefined;
  return `${grade.level}_${grade.name.toUpperCase()}`;
}

function parseArgs(values) {
  const out = {};
  for (let i = 0; i < values.length; i += 1) {
    const value = values[i];
    if (!value.startsWith("--")) continue;
    const eq = value.indexOf("=");
    if (eq >= 0) out[value.slice(2, eq)] = value.slice(eq + 1);
    else out[value.slice(2)] = values[i + 1] && !values[i + 1].startsWith("--")
      ? values[++i]
      : true;
  }
  return out;
}

function required(value, name) {
  if (!value || value === true) throw new Error(`${name} is required`);
  return String(value);
}
