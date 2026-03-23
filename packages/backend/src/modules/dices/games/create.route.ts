import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { inArray } from 'drizzle-orm';
import crypto from 'node:crypto';
import { isFuture } from 'date-fns';

import {
  games as gamesTable,
  gameParticipants as gameParticipantsTable,
  users as usersTable,
  characters as charactersTable,
  gameModeEnum,
} from '@/db/schema/schema.js';

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

interface ParticipantInput {
  userId?: string;
  playerName?: string;
  characterId: string;
  winner: boolean;
  teamIndex: number;
}

export default async function dicesGamesCreate(fastify: FastifyInstance) {
  fastify.route({
    method: 'POST',
    url: '/v1/dices/games',
    schema: {
      body: {
        type: 'object',
        properties: {
          date: { type: 'string' },
          comment: { type: 'string' },
          mode: { type: 'string', enum: gameModeEnum.enumValues },
          participants: {
            type: 'array',
            items: {
              type: 'object',
              oneOf: [
                {
                  properties: {
                    userId: { type: 'string' },
                    characterId: { type: 'string' },
                    winner: { type: 'boolean' },
                    teamIndex: { type: 'number' },
                  },
                  required: ['userId', 'characterId', 'winner', 'teamIndex'],
                  additionalProperties: false,
                },
                {
                  properties: {
                    playerName: { type: 'string' },
                    characterId: { type: 'string' },
                    winner: { type: 'boolean' },
                    teamIndex: { type: 'number' },
                  },
                  required: [
                    'playerName',
                    'characterId',
                    'winner',
                    'teamIndex',
                  ],
                  additionalProperties: false,
                },
              ],
            },
          },
        },
        required: ['date', 'participants', 'mode'],
      },
    },
    preHandler: [fastify.authenticate],
    handler: async (
      request: FastifyRequest<{
        Body: {
          date: string;
          comment?: string;
          mode: GameMode;
          participants: ParticipantInput[];
        };
      }>,
      reply: FastifyReply,
    ) => {
      const db = request.server.db;
      const { date, comment, mode, participants } = request.body;

      if (isFuture(date)) {
        throw new Error('Game date cannot be in the future', { cause: 422 });
      }

      if (!gameModeEnum.enumValues.includes(mode)) {
        throw new Error('Invalid game mode', { cause: 422 });
      }

      const { min, max } = modeParticipantsCount[mode];
      if (participants.length < min || participants.length > max) {
        throw new Error(
          `Game mode "${mode}" requires ${min === max ? min : `${min}-${max}`} participants`,
          { cause: 422 },
        );
      }

      const expectedTeamCount = modeTeamCount[mode];
      const teamIndexCounts = new Map<number, number>();

      for (const participant of participants) {
        if (
          participant.teamIndex < 0 ||
          participant.teamIndex >= expectedTeamCount
        ) {
          throw new Error(
            `Invalid team index ${participant.teamIndex} for mode "${mode}". Valid range: 0-${expectedTeamCount - 1}`,
            { cause: 400 },
          );
        }
        teamIndexCounts.set(
          participant.teamIndex,
          (teamIndexCounts.get(participant.teamIndex) || 0) + 1,
        );
      }

      if (mode === 'one_vs_one') {
        for (let i = 0; i < 2; i++) {
          if (teamIndexCounts.get(i) !== 1) {
            throw new Error(
              `Mode "one_vs_one" requires exactly 1 participant per team`,
              { cause: 400 },
            );
          }
        }
      } else if (mode === 'two_vs_two') {
        for (let i = 0; i < 2; i++) {
          if (teamIndexCounts.get(i) !== 2) {
            throw new Error(
              `Mode "two_vs_two" requires exactly 2 participants per team`,
              { cause: 400 },
            );
          }
        }
      } else if (mode === 'three_vs_three') {
        for (let i = 0; i < 2; i++) {
          if (teamIndexCounts.get(i) !== 3) {
            throw new Error(
              `Mode "three_vs_three" requires exactly 3 participants per team`,
              { cause: 400 },
            );
          }
        }
      } else if (mode === 'two_vs_two_vs_two') {
        for (let i = 0; i < 3; i++) {
          if (teamIndexCounts.get(i) !== 2) {
            throw new Error(
              `Mode "two_vs_two_vs_two" requires exactly 2 participants per team`,
              { cause: 400 },
            );
          }
        }
      } else if (mode === 'king_of_the_hill') {
        for (let i = 0; i < participants.length; i++) {
          if (teamIndexCounts.get(i) !== 1) {
            throw new Error(
              `Mode "king_of_the_hill" requires unique team index for each participant (0-${participants.length - 1})`,
              { cause: 400 },
            );
          }
        }
      }

      const winnerCount = participants.filter((p) => p.winner).length;
      if (winnerCount === 0) {
        throw new Error('At least one participant must be a winner', {
          cause: 400,
        });
      }

      if (mode !== 'king_of_the_hill') {
        const participantsByTeam = new Map<number, ParticipantInput[]>();
        for (const participant of participants) {
          const team = participantsByTeam.get(participant.teamIndex) || [];
          team.push(participant);
          participantsByTeam.set(participant.teamIndex, team);
        }

        for (const [teamIndex, teamParticipants] of participantsByTeam) {
          const teamWinnerCount = teamParticipants.filter(
            (p) => p.winner,
          ).length;
          const allWinners = teamWinnerCount === teamParticipants.length;
          const noWinners = teamWinnerCount === 0;

          if (!allWinners && !noWinners) {
            throw new Error(
              `In team mode, all members of team ${teamIndex} must be winners or none. ` +
                `Found ${teamWinnerCount} winners out of ${teamParticipants.length} team members.`,
              { cause: 400 },
            );
          }
        }
      }

      const characterIds = participants.map((p) => p.characterId);
      const userIds = participants
        .map((p) => p.userId)
        .filter((id): id is string => id !== undefined);

      const existingCharacters = await db
        .select({ id: charactersTable.id })
        .from(charactersTable)
        .where(inArray(charactersTable.id, characterIds));

      const existingCharacterIds = new Set(existingCharacters.map((c) => c.id));
      for (const participant of participants) {
        if (!existingCharacterIds.has(participant.characterId)) {
          throw new Error(
            `Character with id "${participant.characterId}" does not exist`,
            { cause: 400 },
          );
        }
      }

      if (userIds.length > 0) {
        const existingUsers = await db
          .select({ id: usersTable.id })
          .from(usersTable)
          .where(inArray(usersTable.id, userIds));

        const existingUserIds = new Set(existingUsers.map((u) => u.id));
        for (const participant of participants) {
          if (participant.userId && !existingUserIds.has(participant.userId)) {
            throw new Error(
              `User with id "${participant.userId}" does not exist`,
              { cause: 400 },
            );
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
            date: date,
            updatedAt: new Date().toISOString(),
          })
          .returning();

        const participantValues = participants.map((participant) => ({
          id: crypto.randomUUID(),
          gameId: createdGame.id,
          userId: participant.userId || null,
          playerName: participant.playerName || null,
          characterId: participant.characterId,
          winner: participant.winner,
          teamIndex: participant.teamIndex,
          updatedAt: new Date().toISOString(),
        }));

        await tx.insert(gameParticipantsTable).values(participantValues);

        return createdGame;
      });

      return await reply.status(201).send({ data: game });
    },
  });
}
