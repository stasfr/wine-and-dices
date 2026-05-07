import { eq } from 'drizzle-orm';
import { users as usersTable } from '#server/db/schema/schema.js';
import type { H3Event } from 'h3';

export async function requireAuth(event: H3Event) {
  const session = await requireUserSession(event);

  if (!session.user) {
    throw createError({
      status: 401,
      statusText: 'Unauthorized: No user in session',
    });
  }

  const db = useDb();

  const userResult = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, session.user.id));

  if (!userResult.length) {
    throw createError({
      status: 401,
      statusText: 'Unauthorized: User not found',
    });
  }

  return userResult[0];
}
