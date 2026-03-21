import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { eq } from 'drizzle-orm';
import { characters as charactersTable } from '@/db/schema/schema.js';

export default async function dicesCharactersCharacterKey(
  fastify: FastifyInstance,
) {
  fastify.route({
    method: 'GET',
    url: '/v1/dices/characters/:characterKey',
    schema: {
      params: {
        type: 'object',
        properties: {
          characterKey: { type: 'string' },
        },
        required: ['characterKey'],
      } as const,
    },
    preHandler: [fastify.authenticate],
    handler: async (
      request: FastifyRequest<{
        Params: {
          characterKey: string;
        };
      }>,
      reply: FastifyReply,
    ) => {
      const db = request.server.db;
      const { characterKey } = request.params;
      const characterSelectResult = await db
        .select()
        .from(charactersTable)
        .where(eq(charactersTable.key, characterKey));

      const character = characterSelectResult[0];

      if (!character) {
        throw new Error('Character not found', { cause: 404 });
      }

      await reply.send({ data: character });
    },
  });
}
