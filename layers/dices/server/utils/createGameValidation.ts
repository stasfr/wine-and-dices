import * as v from 'valibot';
import { inArray } from 'drizzle-orm';
import type { H3Event } from 'h3';
import { gameModeEnum } from '#db/schema/schema.js';
import type { users, characters } from '#db/schema/schema.js';
import type { DbClient } from '#db/client.js';

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

export interface ValidParticipant {
  playerName: string;
  userId: string | undefined;
  characterId: string;
  winner: boolean;
  teamIndex: number;
}

export interface ValidCreateGameBody {
  date: string;
  time: string | null;
  comment: string | undefined;
  mode: GameMode;
  participants: ValidParticipant[];
}

export const bodySchema = v.object({
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

export function validateBodySchema(data: unknown) {
  const parsed = v.parse(bodySchema, data);

  return {
    date: parsed.date,
    time: parsed.time,
    comment: parsed.comment,
    mode: parsed.mode,
    participants: parsed.participants.map((participant) => ({
      playerName: participant.playerName,
      userId: participant.userId,
      characterId: participant.characterId,
      winner: participant.winner,
      teamIndex: participant.teamIndex,
    })),
  };
}

export async function validateUsers(
  db: DbClient,
  usersTable: typeof users,
  participants: ValidParticipant[],
) {
  const userIds: string[] = [];
  for (const participant of participants) {
    if (participant.userId) {
      userIds.push(participant.userId);
    }
  }

  if (userIds.length === 0) {
    return;
  }

  const usersById = await db
    .select({ id: usersTable.id, email: usersTable.email })
    .from(usersTable)
    .where(inArray(usersTable.id, userIds));

  const userIdToEmail = new Map<string, string>();
  for (const user of usersById) {
    userIdToEmail.set(user.id, user.email);
  }

  for (const participant of participants) {
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

export function validateDate(date: string) {
  if (new Date(date) > new Date()) {
    throw createError({
      status: 422,
      statusMessage: 'Game date cannot be in the future',
    });
  }
}

export function validateParticipantCount(
  mode: GameMode,
  participants: ValidParticipant[],
) {
  const { min, max } = modeParticipantsCount[mode];
  if (participants.length < min || participants.length > max) {
    throw createError({
      status: 422,
      statusMessage: `Game mode "${mode}" requires ${min === max ? min : `${min}-${max}`} participants`,
    });
  }
}

export function validateTeamIndices(
  mode: GameMode,
  participants: ValidParticipant[],
) {
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
}

export function validateWinners(
  mode: GameMode,
  participants: ValidParticipant[],
) {
  const winnerCount = participants.filter((p) => p.winner).length;
  if (winnerCount === 0) {
    throw createError({
      status: 400,
      statusMessage: 'At least one participant must be a winner',
    });
  }

  if (mode !== 'king_of_the_hill') {
    const participantsByTeam = new Map<number, ValidParticipant[]>();
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
}

export function validateUniqueUserIds(participants: ValidParticipant[]) {
  const userIdsSet = new Set<string>();
  for (const participant of participants) {
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
}

export function validateUniqueCharacterIds(participants: ValidParticipant[]) {
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
}

export async function validateCharacters(
  db: DbClient,
  charactersTable: typeof characters,
  participants: ValidParticipant[],
) {
  const characterIds = participants.map((p) => p.characterId);

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
}

export async function validateCreateBody(
  event: H3Event,
  db: DbClient,
  tables: {
    users: typeof users;
    characters: typeof characters;
  },
) {
  const rawBody = await readBody(event);
  const body = validateBodySchema(rawBody);

  await validateUsers(db, tables.users, body.participants);
  validateDate(body.date);
  validateParticipantCount(body.mode, body.participants);
  validateTeamIndices(body.mode, body.participants);
  validateWinners(body.mode, body.participants);
  validateUniqueUserIds(body.participants);
  validateUniqueCharacterIds(body.participants);
  await validateCharacters(db, tables.characters, body.participants);

  return body;
}
