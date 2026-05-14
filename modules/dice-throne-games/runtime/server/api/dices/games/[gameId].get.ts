import * as v from 'valibot';
import { eq } from 'drizzle-orm';
import {
  games as gamesTable,
  gameParticipants as gameParticipantsTable,
  characters as charactersTable,
  users as usersTable,
} from '#server/db/schema/schema.js';

const paramsSchema = v.object({
  gameId: v.pipe(v.string(), v.minLength(1)),
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

  const { gameId } = await getValidatedRouterParams(event, (data) =>
    v.parse(paramsSchema, data),
  );

  const [game] = await db
    .select()
    .from(gamesTable)
    .where(eq(gamesTable.id, gameId))
    .limit(1);

  if (!game) {
    throw createError({
      status: 404,
      statusMessage: 'Game not found',
    });
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
    })
    .from(gameParticipantsTable)
    .leftJoin(
      charactersTable,
      eq(gameParticipantsTable.characterId, charactersTable.id),
    )
    .leftJoin(usersTable, eq(gameParticipantsTable.userId, usersTable.id))
    .where(eq(gameParticipantsTable.gameId, gameId));

  const teams = groupParticipantsByTeam(participants);

  return {
    data: {
      game: {
        ...game,
        teams,
      },
      teams,
    },
  };
});
