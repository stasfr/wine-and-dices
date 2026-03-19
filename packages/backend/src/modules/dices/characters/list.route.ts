import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { characters as charactersTable } from '@/db/schema/schema.js';

export default async function dicesCharactersList(fastify: FastifyInstance) {
  fastify.route({
    method: 'GET',
    url: '/v1/dices/characters/list',
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
        Querystring: { page?: number; perPage?: number };
      }>,
      reply: FastifyReply,
    ) => {
      const db = request.server.db;
      const { page = 1, perPage = 25 } = request.query;
      const characters = await db
        .select()
        .from(charactersTable)
        .limit(perPage)
        .offset((page - 1) * perPage);
      await reply.send({ data: characters });
    },
  });
}
