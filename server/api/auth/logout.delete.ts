import { eq } from 'drizzle-orm';
import { userSessions as userSessionsTable } from '#server/db/schema/schema.js';
import { hashSessionToken } from '#server/utils/hash.js';

export default defineEventHandler(async (event) => {
  const db = useDb();
  const sessionToken = getCookie(event, 'sessionToken');

  if (!sessionToken) {
    throw createError({ status: 401, statusText: 'Unauthorized: No session token provided' });
  }

  const hashedSessionToken = hashSessionToken(sessionToken);

  await db
    .delete(userSessionsTable)
    .where(eq(userSessionsTable.sessionToken, hashedSessionToken));

  deleteCookie(event, 'sessionToken');

  setResponseStatus(event, 200);

  return;
});
