import * as v from 'valibot';
import crypto from 'node:crypto';
import { inArray } from 'drizzle-orm';
import { gameModeEnum } from '#db/schema/schema.js';

type GameMode = (typeof gameModeEnum.enumValues)[number];

const modeParticipantsCount: Record<GameMode, { min: number; max: number }> = {
  one_vs_one: { min: 2, max: 2 },
  two_vs_two: { min: 4, max: 4 },
  three_vs_three: { min: 6, max: 6 },
  two_vs_two_vs_two: { min: 6, max: 6 },
  king_of_the_hill: { min: 3, max: 6 },
};

const modeTeamCount: Record<GameMode, number> = {
  one_vs_one: 2,
  two_vs_two: 2,
  three_vs_three: 2,
  two_vs_two_vs_two: 3,
  king_of_the_hill: 6,
};

const bodySchema = v.object({
  date: v.pipe(v.string(), v.minLength(1)),
  time: v.union([v.pipe(v.string(), v.minLength(1)), v.null()]),
  comment: v.optional(v.string()),
  mode: v.picklist(gameModeEnum.enumValues),
  participants: v.pipe(
    v.array(
      v.object({
        playerName: v.pipe(v.string(), v.minLength(1)),
        userId: v.optional(v.pipe(v.string(), v.minLength(1))),
        characterId: v.pipe(v.string(), v.minLength(1)),
        winner: v.boolean(),
        teamIndex: v.pipe(v.number(), v.integer(), v.minValue(0)),
      }),
    ),
    v.maxLength(6),
  ),
});

export default defineAuthenticatedHandler(async (event) => {
  const {
    db,
    games: gamesTable,
    gameParticipants: gameParticipantsTable,
    users: usersTable,
    characters: charactersTable,
  } = useDb();

  const {
    date,
    time,
    comment,
    mode,
    participants: bodyParticipants,
  } = await readValidatedBody(event, (data) => v.parse(bodySchema, data));

  const userIds: string[] = [];
  for (const participant of bodyParticipants) {
    if (participant.userId) {
      userIds.push(participant.userId);
    }
  }

  if (userIds.length > 0) {
    const usersById = await db
      .select({ id: usersTable.id, email: usersTable.email })
      .from(usersTable)
      .where(inArray(usersTable.id, userIds));

    const userIdToEmail = new Map<string, string>();
    for (const user of usersById) {
      userIdToEmail.set(user.id, user.email);
    }

    for (const participant of bodyParticipants) {
      if (!participant.userId) {
        continue;
      }

      const expectedEmail = userIdToEmail.get(participant.userId);
      if (!expectedEmail) {
        throw createError({
          status: 400,
          statusMessage: `User with id "${participant.userId}" does not exist`,
        });
      }

      if (expectedEmail !== participant.playerName) {
        throw createError({
          status: 400,
          statusMessage: `User email mismatch for userId "${participant.userId}"`,
        });
      }
    }
  }

  if (new Date(date) > new Date()) {
    throw createError({
      status: 422,
      statusMessage: 'Game date cannot be in the future',
    });
  }

  const { min, max } = modeParticipantsCount[mode];
  if (bodyParticipants.length < min || bodyParticipants.length > max) {
    throw createError({
      status: 422,
      statusMessage: `Game mode "${mode}" requires ${min === max ? min : `${min}-${max}`} participants`,
    });
  }

  const expectedTeamCount = modeTeamCount[mode];
  const teamIndexCounts = new Map<number, number>();

  for (const participant of bodyParticipants) {
    if (
      participant.teamIndex < 0 ||
      participant.teamIndex >= expectedTeamCount
    ) {
      throw createError({
        status: 400,
        statusMessage: `Invalid team index ${participant.teamIndex} for mode "${mode}". Valid range: 0-${expectedTeamCount - 1}`,
      });
    }
    teamIndexCounts.set(
      participant.teamIndex,
      (teamIndexCounts.get(participant.teamIndex) || 0) + 1,
    );
  }

  if (mode === 'one_vs_one') {
    for (let i = 0; i < 2; i++) {
      if (teamIndexCounts.get(i) !== 1) {
        throw createError({
          status: 400,
          statusMessage:
            'Mode "one_vs_one" requires exactly 1 participant per team',
        });
      }
    }
  } else if (mode === 'two_vs_two') {
    for (let i = 0; i < 2; i++) {
      if (teamIndexCounts.get(i) !== 2) {
        throw createError({
          status: 400,
          statusMessage:
            'Mode "two_vs_two" requires exactly 2 participants per team',
        });
      }
    }
  } else if (mode === 'three_vs_three') {
    for (let i = 0; i < 2; i++) {
      if (teamIndexCounts.get(i) !== 3) {
        throw createError({
          status: 400,
          statusMessage:
            'Mode "three_vs_three" requires exactly 3 participants per team',
        });
      }
    }
  } else if (mode === 'two_vs_two_vs_two') {
    for (let i = 0; i < 3; i++) {
      if (teamIndexCounts.get(i) !== 2) {
        throw createError({
          status: 400,
          statusMessage:
            'Mode "two_vs_two_vs_two" requires exactly 2 participants per team',
        });
      }
    }
  } else if (mode === 'king_of_the_hill') {
    for (let i = 0; i < bodyParticipants.length; i++) {
      if (teamIndexCounts.get(i) !== 1) {
        throw createError({
          status: 400,
          statusMessage: `Mode "king_of_the_hill" requires unique team index for each participant (0-${bodyParticipants.length - 1})`,
        });
      }
    }
  }

  const winnerCount = bodyParticipants.filter((p) => p.winner).length;
  if (winnerCount === 0) {
    throw createError({
      status: 400,
      statusMessage: 'At least one participant must be a winner',
    });
  }

  if (mode !== 'king_of_the_hill') {
    const participantsByTeam = new Map<number, typeof bodyParticipants>();
    for (const participant of bodyParticipants) {
      const team = participantsByTeam.get(participant.teamIndex) || [];
      team.push(participant);
      participantsByTeam.set(participant.teamIndex, team);
    }

    for (const [teamIndex, teamParticipants] of participantsByTeam) {
      const teamWinnerCount = teamParticipants.filter((p) => p.winner).length;
      const allWinners = teamWinnerCount === teamParticipants.length;
      const noWinners = teamWinnerCount === 0;

      if (!allWinners && !noWinners) {
        throw createError({
          status: 400,
          statusMessage:
            `In team mode, all members of team ${teamIndex} must be winners or none. ` +
            `Found ${teamWinnerCount} winners out of ${teamParticipants.length} team members.`,
        });
      }
    }
  }

  const userIdsSet = new Set<string>();
  for (const participant of bodyParticipants) {
    if (participant.userId) {
      if (userIdsSet.has(participant.userId)) {
        throw createError({
          status: 400,
          statusMessage: `Duplicate userId "${participant.userId}" in participants. Each user can participate only once per game.`,
        });
      }
      userIdsSet.add(participant.userId);
    }
  }

  const characterIdsSet = new Set<string>();
  for (const participant of bodyParticipants) {
    if (characterIdsSet.has(participant.characterId)) {
      throw createError({
        status: 400,
        statusMessage: `Duplicate characterId "${participant.characterId}" in participants. Each character can be used only once per game.`,
      });
    }
    characterIdsSet.add(participant.characterId);
  }

  const characterIds = bodyParticipants.map((p) => p.characterId);

  const existingCharacters = await db
    .select({ id: charactersTable.id })
    .from(charactersTable)
    .where(inArray(charactersTable.id, characterIds));

  const existingCharacterIds = new Set(existingCharacters.map((c) => c.id));
  for (const participant of bodyParticipants) {
    if (!existingCharacterIds.has(participant.characterId)) {
      throw createError({
        status: 400,
        statusMessage: `Character with id "${participant.characterId}" does not exist`,
      });
    }
  }

  const game = await db.transaction(async (tx) => {
    const [createdGame] = await tx
      .insert(gamesTable)
      .values({
        id: crypto.randomUUID(),
        mode,
        comment: comment || null,
        date,
        time,
        updatedAt: new Date().toISOString(),
      })
      .returning();

    if (!createdGame) {
      tx.rollback();
      return null;
    }

    const participantValues = bodyParticipants.map((participant) => ({
      id: crypto.randomUUID(),
      gameId: createdGame.id,
      userId: participant.userId || null,
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
