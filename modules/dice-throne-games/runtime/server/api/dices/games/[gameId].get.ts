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
    .leftJoin(
      usersTable,
      eq(gameParticipantsTable.userId, usersTable.id),
    )
    .where(eq(gameParticipantsTable.gameId, gameId));

  return {
    data: {
      game: {
        ...game,
        participants,
      },
      participants,
    },
  };
});
