import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { eq } from 'drizzle-orm';
import crypto from 'node:crypto';

import {
  userSessions as userSessionsTable,
  users as usersTable,
} from '@/db/schema/schema.js';
import { verify } from 'argon2';
import { hashSessionToken } from '@/utils/hash.js';

export default async function authLogin(fastify: FastifyInstance) {
  fastify.route({
    method: 'POST',
    url: '/v1/auth/login',
    schema: {
      body: {
        type: 'object',
        properties: {
          email: { type: 'string' },
          password: { type: 'string' },
        },
        required: ['email', 'password'],
      } as const,
    },
    handler: async (
      request: FastifyRequest<{ Body: { email: string; password: string } }>,
      reply: FastifyReply,
    ) => {
      const db = request.server.db;

      const { email, password } = request.body;
      const userIp = request.ip;
      const userAgent = request.headers['user-agent'];

      const userResult = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email));

      if (!userResult.length) {
        throw new Error('Invalid email or password: User not found', {
          cause: 401,
        });
      }

      const user = userResult[0];

      const correctPassword = await verify(user.password, password);

      if (!correctPassword) {
        throw new Error('Invalid email or password: Password is incorrect', {
          cause: 401,
        });
      }

      const existingSessions = await db
        .select()
        .from(userSessionsTable)
        .where(eq(userSessionsTable.userId, user.id));

      if (existingSessions.length > 0) {
        for (const session of existingSessions) {
          await db
            .delete(userSessionsTable)
            .where(eq(userSessionsTable.id, session.id));
        }
      }

      const { id } = user;
      const sessionToken = crypto.randomUUID();
      const hashedSessionToken = hashSessionToken(sessionToken);

      if (!userAgent) {
        throw new Error('Unauthorized: No user agent provided', { cause: 401 });
      }

      const session: typeof userSessionsTable.$inferInsert = {
        expiresAt: new Date(
          Date.now() + 60 * 60 * 24 * 30 * 1000,
        ).toISOString(),
        id: crypto.randomUUID(),
        sessionToken: hashedSessionToken,
        userAgent: userAgent,
        userId: id,
        userIp,
      };

      await db.insert(userSessionsTable).values(session);

      reply.setCookie('sessionToken', sessionToken, {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
        sameSite: 'lax',
        secure: request.server.config.NODE_ENV === 'production',
      });

      return await reply.status(200).send();
    },
  });
}
