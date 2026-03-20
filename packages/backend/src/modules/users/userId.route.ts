import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { eq } from 'drizzle-orm';
import { users as usersTable } from '@/db/schema/schema.js';

export default async function userUserId(fastify: FastifyInstance) {
  fastify.route({
    method: 'GET',
    url: '/v1/users/:userId',
    schema: {
      params: {
        type: 'object',
        properties: {
          userId: { type: 'string' },
        },
        required: ['userId'],
      } as const,
    },
    preHandler: [fastify.authenticate],
    handler: async (
      request: FastifyRequest<{
        Params: {
          userId: string;
        };
      }>,
      reply: FastifyReply,
    ) => {
      const db = request.server.db;
      const { userId } = request.params;
      const userSelectResult = await db
        .select({
          email: usersTable.email,
          id: usersTable.id,
        })
        .from(usersTable)
        .where(eq(usersTable.id, userId));

      const user = userSelectResult[0];

      if (!user) {
        throw new Error('User not found', { cause: 404 });
      }

      return reply.status(200).send({ data: user });
    },
  });
}
