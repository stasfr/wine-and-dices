import { FastifyReply, FastifyRequest } from 'fastify';

import { eq } from 'drizzle-orm';

import {
  userSessions as userSessionsTable,
  users as usersTable,
} from '@/db/schema/schema.js';
import { hashSessionToken } from '@/utils/hash.js';

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const sessionToken = request.cookies.sessionToken;

    if (!sessionToken) {
      return await reply.status(401).send({
        message: 'Authentication required: session token not provided',
      });
    }

    const sessionTokenHash = hashSessionToken(sessionToken);

    const sessionQueryResult = await request.server.db
      .select({
        session: userSessionsTable,
        user: {
          id: usersTable.id,
          email: usersTable.email,
          isActive: usersTable.isActive,
        },
      })
      .from(userSessionsTable)
      .leftJoin(usersTable, eq(userSessionsTable.userId, usersTable.id))
      .where(eq(userSessionsTable.sessionToken, sessionTokenHash));

    if (!sessionQueryResult.length) {
      return await reply
        .status(401)
        .send({ message: 'Authentication required: session is not active' });
    }

    const { session, user } = sessionQueryResult[0];

    if (!user) {
      return await reply.status(401).send({
        message: 'Authentication required: associated user not found',
      });
    }

    if (new Date(session.expiresAt) < new Date()) {
      return await reply
        .status(401)
        .send({ message: 'Authentication required: session is expired' });
    }

    const userIp = request.ip;
    const userAgent = request.headers['user-agent'];

    if (session.userIp !== userIp || session.userAgent !== userAgent) {
      await request.server.db
        .delete(userSessionsTable)
        .where(eq(userSessionsTable.sessionToken, sessionTokenHash));

      return await reply
        .status(401)
        .send({ message: 'Authentication required: session is not active' });
    }

    request.user = user;
  } catch (error: unknown) {
    return reply.send(error);
  }
}
