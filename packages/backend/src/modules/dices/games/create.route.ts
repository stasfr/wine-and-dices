import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { games as gamesTable, gameModeEnum } from '@/db/schema/schema.js';

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
          mode: string;
          participants: {
            userId: string;
            playerName: string;
            winner: boolean;
            teamIndex: number;
            characterId: string;
          }[];
        };
      }>,
      reply: FastifyReply,
    ) => {
      // валидация
      // дата есть и она <== сегодня
      // есть режим и он входит в enum
      // "участники" более двух человек
      // режим игры соответствует количеству участников (если царь горы, то 3-6; если 1 на 1, то ровно 2; если 2 на 2, то ровно 4; если 3 на 3, то ровно 6; если 2на2на2, то ровно 6)
      // проверить team index в соответствии с правилами режимов (например, если у нас выбран режим 1 на 1, то не может быть 2 участника с одинаковым team index)
      // у каждого участника должен быть либо userId, либо playerName
      // если выбран userId, то пользователь должен существовать в базе данных
      // должен быть хотя бы один победитель
      // должен быть обязательно characterId и он должен существовать в базе данных
      const db = request.server.db;
    },
  });
}
