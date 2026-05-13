import * as v from 'valibot';
import { eq, and, ilike, inArray } from 'drizzle-orm';
import {
  games as gamesTable,
  gameParticipants as gameParticipantsTable,
  characters as charactersTable,
  users as usersTable,
  gameModeEnum,
} from '#server/db/schema/schema.js';
import type { SQL } from 'drizzle-orm';

const querySchema = v.object({
  page: v.optional(
    v.pipe(v.string(), v.toNumber(), v.number(), v.integer(), v.minValue(1)),
    '1',
  ),
  perPage: v.optional(
    v.pipe(
      v.string(),
      v.toNumber(),
      v.number(),
      v.integer(),
      v.minValue(1),
      v.maxValue(100),
    ),
    '20',
  ),
  mode: v.optional(v.picklist(gameModeEnum.enumValues)),
  id: v.optional(v.pipe(v.string(), v.minLength(1))),
  search: v.optional(v.pipe(v.string(), v.minLength(1))),
  characterIds: v.optional(v.pipe(v.string(), v.minLength(1))),
});

interface Participant {
  id: string;
  playerName: string | null;
  winner: boolean;
  teamIndex: number;
  characterId: string;
  characterName: string | null;
  characterKey: string | null;
  userId: string | null;
  userEmail: string | null;
  userFirstName: string | null;
  userLastName: string | null;
  userMiddleName: string | null;
  gameId: string;
}

function groupParticipantsByTeam(participants: Participant[]) {
  const byTeam = new Map<number, Participant[]>();

  for (const participant of participants) {
    const list = byTeam.get(participant.teamIndex);
    if (list) {
      list.push(participant);
    } else {
      byTeam.set(participant.teamIndex, [participant]);
    }
  }

  return Array.from(byTeam.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([teamIndex, teamParticipants]) => ({
      teamIndex,
      winner: teamParticipants.some((p) => p.winner),
      participants: teamParticipants,
    }));
}

export default defineEventHandler(async (event) => {
  const db = useDb();
  await requireUserSession(event);

  const { page, perPage, mode, id, search, characterIds: characterIdsRaw } = await getValidatedQuery(
    event,
    (data) => v.parse(querySchema, data),
  );

  const filters: SQL[] = [];

  if (mode) {
    filters.push(eq(gamesTable.mode, mode));
  }
  if (id) {
    filters.push(eq(gamesTable.id, id));
  }
  if (search) {
    const searchFilter = ilike(gamesTable.comment, `%${search}%`);

    if (searchFilter) {
      filters.push(searchFilter);
    }
  }

  if (characterIdsRaw) {
    const characterIds = characterIdsRaw.split(',');

    const gamesWithCharacters = await db
      .selectDistinct({ gameId: gameParticipantsTable.gameId })
      .from(gameParticipantsTable)
      .where(inArray(gameParticipantsTable.characterId, characterIds));

    const gameIds = gamesWithCharacters.map((g) => g.gameId);

    if (gameIds.length === 0) {
      return { data: [] };
    }

    filters.push(inArray(gamesTable.id, gameIds));
  }

  const games = await db
    .select()
    .from(gamesTable)
    .limit(perPage)
    .offset((page - 1) * perPage)
    .where(and(...filters));

  const gameIds = games.map((game) => game.id);

  if (gameIds.length === 0) {
    return { data: [] };
  }

  const participants = await db
    .select({
      id: gameParticipantsTable.id,
      playerName: gameParticipantsTable.playerName,
      winner: gameParticipantsTable.winner,
      teamIndex: gameParticipantsTable.teamIndex,
      characterId: gameParticipantsTable.characterId,
      characterName: charactersTable.name,
      characterKey: charactersTable.key,
      userId: gameParticipantsTable.userId,
      userEmail: usersTable.email,
      userFirstName: usersTable.firstName,
      userLastName: usersTable.lastName,
      userMiddleName: usersTable.middleName,
      gameId: gameParticipantsTable.gameId,
    })
    .from(gameParticipantsTable)
    .leftJoin(
      charactersTable,
      eq(gameParticipantsTable.characterId, charactersTable.id),
    )
    .leftJoin(
      usersTable,
      eq(gameParticipantsTable.userId, usersTable.id),
    )
    .where(inArray(gameParticipantsTable.gameId, gameIds));

  const participantsByGameId = new Map<string, Participant[]>();
  for (const participant of participants) {
    const list = participantsByGameId.get(participant.gameId);
    if (list) {
      list.push(participant);
    } else {
      participantsByGameId.set(participant.gameId, [participant]);
    }
  }

  const data = games.map((game) => {
    const gameParticipants = participantsByGameId.get(game.id) ?? [];
    return {
      ...game,
      teams: groupParticipantsByTeam(gameParticipants),
    };
  });

  return { data };
});
