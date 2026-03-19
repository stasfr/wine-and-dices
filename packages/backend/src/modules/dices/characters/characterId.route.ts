import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { eq } from 'drizzle-orm';
import { characters as charactersTable } from '@/db/schema/schema.js';

export default async function dicesCharactersCharacterId(
  fastify: FastifyInstance,
) {
  fastify.route({
    method: 'GET',
    url: '/v1/dices/characters/:characterId',
    schema: {
      params: {
        type: 'object',
        properties: {
          characterId: { type: 'string' },
        },
        required: ['characterId'],
      } as const,
    },
    preHandler: [fastify.authenticate],
    handler: async (
      request: FastifyRequest<{
        Params: {
          characterId: string;
        };
      }>,
      reply: FastifyReply,
    ) => {
      const db = request.server.db;
      const { characterId } = request.params;
      const characterSelectResult = await db
        .select()
        .from(charactersTable)
        .where(eq(charactersTable.id, characterId));

      const character = characterSelectResult[0];

      if (!character) {
        throw new Error('Character not found', { cause: 404 });
      }

      await reply.send({ data: character });
    },
  });
}
