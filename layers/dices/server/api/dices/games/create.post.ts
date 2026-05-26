import crypto from 'node:crypto';

export default defineAuthenticatedHandler(async (event) => {
  const {
    db,
    games: gamesTable,
    gameParticipants: gameParticipantsTable,
    users: usersTable,
    characters: charactersTable,
  } = useDb();

  const validGame = await validateCreateBody(event, db, {
    users: usersTable,
    characters: charactersTable,
  });

  const game = await db.transaction(async (tx) => {
    const [createdGame] = await tx
      .insert(gamesTable)
      .values({
        id: crypto.randomUUID(),
        mode: validGame.mode,
        comment: validGame.comment ?? null,
        date: validGame.date,
        time: validGame.time,
        updatedAt: new Date().toISOString(),
      })
      .returning();

    if (!createdGame) {
      tx.rollback();
      return null;
    }

    const participantValues = validGame.participants.map((participant) => ({
      id: crypto.randomUUID(),
      gameId: createdGame.id,
      userId: participant.userId ?? null,
      playerName: participant.playerName,
      characterId: participant.characterId,
      winner: participant.winner,
      teamIndex: participant.teamIndex,
      updatedAt: new Date().toISOString(),
    }));

    await tx.insert(gameParticipantsTable).values(participantValues);

    return createdGame;
  });

  if (!game) {
    throw createError({
      status: 500,
      statusMessage: 'Failed to create game',
    });
  }

  setResponseStatus(event, 201);

  return { data: game };
});
