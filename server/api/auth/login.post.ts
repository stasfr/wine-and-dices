import crypto from 'node:crypto';
import { eq } from 'drizzle-orm';
import { verify } from 'argon2';
import {
  userSessions as userSessionsTable,
  users as usersTable,
} from '#server/db/schema/schema.js';
import { hashSessionToken } from '#server/utils/hash.js';

export default defineEventHandler(async (event) => {
  const db = useDb();
  const config = useRuntimeConfig();
  const body = await readBody(event);

  if (!body?.email || !body?.password) {
    throw createError({
      status: 400,
      statusText: 'Email and password are required',
    });
  }

  const { email, password } = body as { email: string; password: string };
  const userAgent = getHeader(event, 'user-agent');
  const userIp = getRequestIP(event);

  const userResult = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email));

  if (!userResult.length) {
    throw createError({ status: 401, statusText: 'Invalid credentials' });
  }

  const user = userResult[0]!;

  const correctPassword = await verify(user.password, password);

  if (!correctPassword) {
    throw createError({ status: 401, statusText: 'Invalid credentials' });
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

  if (!userAgent) {
    throw createError({
      status: 401,
      statusText: 'Unauthorized: No user agent provided',
    });
  }

  const sessionToken = crypto.randomUUID();
  const hashedSessionToken = hashSessionToken(sessionToken);

  const session = {
    id: crypto.randomUUID(),
    sessionToken: hashedSessionToken,
    userAgent,
    userId: user.id,
    userIp,
    expiresAt: new Date(Date.now() + 60 * 60 * 24 * 30 * 1000).toISOString(),
  };

  await db.insert(userSessionsTable).values(session);

  setCookie(event, 'sessionToken', sessionToken, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
    sameSite: 'lax',
    secure: config.nodeEnv === 'production',
  });

  setResponseStatus(event, 200);

  return;
});
