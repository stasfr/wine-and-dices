import { FastifyInstance } from 'fastify';

import { characters as charactersTable } from '@/db/schema/schema.js';

export default async function dicesCharactersList(fastify: FastifyInstance) {
  fastify.route({
    method: 'GET',
    url: '/v1/dices/characters/list',
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const db = request.server.db;
      const characters = await db.select().from(charactersTable);
      await reply.send({ data: characters });
    },
  });
}
