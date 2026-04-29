import { eq } from 'drizzle-orm';
import {
  users as usersTable,
  userSessions as userSessionsTable,
} from '#server/db/schema/schema.js';
import { hashSessionToken } from './hash.js';
import type { H3Event } from 'h3';

export async function requireAuth(event: H3Event) {
  const sessionToken = getCookie(event, 'sessionToken');

  if (!sessionToken) {
    throw createError({
      status: 401,
      statusText: 'Unauthorized: No session token provided',
    });
  }

  const db = useDb();
  const hashedSessionToken = hashSessionToken(sessionToken);

  const sessionResult = await db
    .select()
    .from(userSessionsTable)
    .where(eq(userSessionsTable.sessionToken, hashedSessionToken));

  if (!sessionResult.length) {
    throw createError({
      status: 401,
      statusText: 'Unauthorized: Invalid session token',
    });
  }

  const session = sessionResult[0]!;

  if (new Date(session.expiresAt) < new Date()) {
    throw createError({
      status: 401,
      statusText: 'Unauthorized: Session expired',
    });
  }

  const userResult = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, session.userId));

  if (!userResult.length) {
    throw createError({
      status: 401,
      statusText: 'Unauthorized: User not found',
    });
  }

  return userResult[0]!;
}
