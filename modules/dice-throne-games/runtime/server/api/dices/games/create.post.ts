import * as v from 'valibot';
import crypto from 'node:crypto';
import { inArray } from 'drizzle-orm';
import {
  games as gamesTable,
  gameParticipants as gameParticipantsTable,
  users as usersTable,
  characters as charactersTable,
  gameModeEnum,
} from '#server/db/schema/schema.js';

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
  comment: v.optional(v.string()),
  mode: v.picklist(gameModeEnum.enumValues),
  participants: v.pipe(
    v.array(
      v.union([
        v.object({
          email: v.pipe(v.string(), v.minLength(1), v.email()),
          characterId: v.pipe(v.string(), v.minLength(1)),
          winner: v.boolean(),
          teamIndex: v.pipe(v.number(), v.integer(), v.minValue(0)),
        }),
        v.object({
          playerName: v.pipe(v.string(), v.minLength(1)),
          characterId: v.pipe(v.string(), v.minLength(1)),
          winner: v.boolean(),
          teamIndex: v.pipe(v.number(), v.integer(), v.minValue(0)),
        }),
      ]),
    ),
    v.maxLength(6),
  ),
});

export default defineEventHandler(async (event) => {
  const db = useDb();
  await requireUserSession(event);

  const {
    date,
    comment,
    mode,
    participants: bodyParticipants,
  } = await readValidatedBody(event, (data) => v.parse(bodySchema, data));

  const emails: string[] = [];
  for (const participant of bodyParticipants) {
    if ('email' in participant) {
      emails.push(participant.email);
    }
  }

  const emailToUserId = new Map<string, string>();
  if (emails.length > 0) {
    const usersByEmail = await db
      .select({ email: usersTable.email, id: usersTable.id })
      .from(usersTable)
      .where(inArray(usersTable.email, emails));

    for (const user of usersByEmail) {
      emailToUserId.set(user.email, user.id);
    }

    for (const participant of bodyParticipants) {
      if ('email' in participant && !emailToUserId.has(participant.email)) {
        throw createError({
          status: 400,
          statusMessage: `User with email "${participant.email}" does not exist`,
        });
      }
    }
  }

  const normalizedParticipants = bodyParticipants.map((participant) => {
    if ('email' in participant) {
      const userId = emailToUserId.get(participant.email);
      if (!userId) {
        throw createError({
          status: 400,
          statusMessage: `User with email "${participant.email}" does not exist`,
        });
      }
      return {
        userId,
        characterId: participant.characterId,
        winner: participant.winner,
        teamIndex: participant.teamIndex,
      };
    }
    return participant;
  });

  const participants = normalizedParticipants;

  if (new Date(date) > new Date()) {
    throw createError({
      status: 422,
      statusMessage: 'Game date cannot be in the future',
    });
  }

  const { min, max } = modeParticipantsCount[mode];
  if (participants.length < min || participants.length > max) {
    throw createError({
      status: 422,
      statusMessage: `Game mode "${mode}" requires ${min === max ? min : `${min}-${max}`} participants`,
    });
  }

  const expectedTeamCount = modeTeamCount[mode];
  const teamIndexCounts = new Map<number, number>();

  for (const participant of participants) {
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
    for (let i = 0; i < participants.length; i++) {
      if (teamIndexCounts.get(i) !== 1) {
        throw createError({
          status: 400,
          statusMessage: `Mode "king_of_the_hill" requires unique team index for each participant (0-${participants.length - 1})`,
        });
      }
    }
  }

  const winnerCount = participants.filter((p) => p.winner).length;
  if (winnerCount === 0) {
    throw createError({
      status: 400,
      statusMessage: 'At least one participant must be a winner',
    });
  }

  if (mode !== 'king_of_the_hill') {
    const participantsByTeam = new Map<number, typeof participants>();
    for (const participant of participants) {
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
  for (const participant of participants) {
    if ('userId' in participant) {
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
  for (const participant of participants) {
    if (characterIdsSet.has(participant.characterId)) {
      throw createError({
        status: 400,
        statusMessage: `Duplicate characterId "${participant.characterId}" in participants. Each character can be used only once per game.`,
      });
    }
    characterIdsSet.add(participant.characterId);
  }

  const characterIds = participants.map((p) => p.characterId);
  const userIds: string[] = [];
  for (const participant of participants) {
    if ('userId' in participant) {
      userIds.push(participant.userId);
    }
  }

  const existingCharacters = await db
    .select({ id: charactersTable.id })
    .from(charactersTable)
    .where(inArray(charactersTable.id, characterIds));

  const existingCharacterIds = new Set(existingCharacters.map((c) => c.id));
  for (const participant of participants) {
    if (!existingCharacterIds.has(participant.characterId)) {
      throw createError({
        status: 400,
        statusMessage: `Character with id "${participant.characterId}" does not exist`,
      });
    }
  }

  if (userIds.length > 0) {
    const existingUsers = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(inArray(usersTable.id, userIds));

    const existingUserIds = new Set(existingUsers.map((u) => u.id));
    for (const participant of participants) {
      if ('userId' in participant && !existingUserIds.has(participant.userId)) {
        throw createError({
          status: 400,
          statusMessage: `User with id "${participant.userId}" does not exist`,
        });
      }
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
        updatedAt: new Date().toISOString(),
      })
      .returning();

    if (!createdGame) {
      tx.rollback();
      return null;
    }

    const participantValues = participants.map((participant) => ({
      id: crypto.randomUUID(),
      gameId: createdGame.id,
      userId: 'userId' in participant ? participant.userId : null,
      playerName: 'playerName' in participant ? participant.playerName : null,
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
