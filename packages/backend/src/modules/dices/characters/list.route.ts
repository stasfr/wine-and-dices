import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { eq, and } from 'drizzle-orm';
import { characters as charactersTable } from '@/db/schema/schema.js';

import type { SQL } from 'drizzle-orm';

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
          key: { type: 'string' },
          name: { type: 'string' },
          id: { type: 'string' },
        },
      },
    },
    preHandler: [fastify.authenticate],
    handler: async (
      request: FastifyRequest<{
        Querystring: {
          page?: number;
          perPage?: number;
          key?: string;
          name?: string;
          id?: string;
        };
      }>,
      reply: FastifyReply,
    ) => {
      const db = request.server.db;
      const { page = 1, perPage = 25, key, name, id } = request.query;

      const filters: SQL[] = [];

      if (key) {
        filters.push(eq(charactersTable.key, key));
      }

      if (name) {
        filters.push(eq(charactersTable.name, name));
      }

      if (id) {
        filters.push(eq(charactersTable.id, id));
      }

      const characters = await db
        .select()
        .from(charactersTable)
        .limit(perPage)
        .offset((page - 1) * perPage)
        .where(and(...filters));
      await reply.send({ data: characters });
    },
  });
}
