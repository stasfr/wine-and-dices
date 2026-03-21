import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { games as gamesTable } from '@/db/schema/schema.js';

export default async function dicesGamesList(fastify: FastifyInstance) {
  fastify.route({
    method: 'GET',
    url: '/v1/dices/games/list',
    schema: {
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'number' },
          perPage: { type: 'number' },
        },
      },
    },
    preHandler: [fastify.authenticate],
    handler: async (
      request: FastifyRequest<{
        Querystring: {
          page?: number;
          perPage?: number;
        };
      }>,
      reply: FastifyReply,
    ) => {
      const db = request.server.db;
      const { page = 1, perPage = 25 } = request.query;

      const games = await db
        .select()
        .from(gamesTable)
        .limit(perPage)
        .offset((page - 1) * perPage);

      await reply.send({ data: games });
    },
  });
}
