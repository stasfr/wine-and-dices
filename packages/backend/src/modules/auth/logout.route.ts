import { FastifyInstance } from 'fastify';

import { eq } from 'drizzle-orm';

import { userSessions as userSessionsTable } from '@/db/schema/schema.js';
import { hashSessionToken } from '@/utils/hash.js';

export default async function authLogout(fastify: FastifyInstance) {
  fastify.route({
    method: 'DELETE',
    url: '/v1/auth/logout',
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const db = request.server.db;

      const sessionToken = request.cookies.sessionToken;

      if (!sessionToken) {
        throw new Error('Unauthorized: No session token provided', {
          cause: 401,
        });
      }

      const hashedSessionToken = hashSessionToken(sessionToken);

      await db
        .delete(userSessionsTable)
        .where(eq(userSessionsTable.sessionToken, hashedSessionToken));

      reply.clearCookie('sessionToken');

      return await reply.status(200);
    },
  });
}
