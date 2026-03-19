import { FastifyInstance } from 'fastify';

import { eq } from 'drizzle-orm';

import { users as usersTable } from '@/db/schema/schema.js';

export default async function authMe(fastify: FastifyInstance) {
  fastify.route({
    method: 'GET',
    url: '/v1/auth/me',
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const db = request.server.db;

      if (!request.user) {
        return await reply.code(401).send({ message: 'Unauthorized' });
      }

      const { id } = request.user;

      const userResult = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, id));

      if (!userResult.length) {
        return await reply.code(404).send({ message: 'User not found' });
      }

      const user = userResult[0];

      const { email, isActive } = user;

      return await reply.status(200).send({
        data: {
          email,
          id,
          isActive,
        },
      });
    },
  });
}
