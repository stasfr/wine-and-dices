import { eq } from 'drizzle-orm';
import { users as usersTable } from '#server/db/schema/schema.js';

export default defineEventHandler(async (event) => {
  const db = useDb();
  const session = await requireUserSession(event);

  if (!session.user) {
    throw createError({ status: 401, statusText: 'Unauthorized' });
  }

  const userResult = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      isActive: usersTable.isActive,
      lastName: usersTable.lastName,
      firstName: usersTable.firstName,
      middleName: usersTable.middleName,
      createdAt: usersTable.createdAt,
      updatedAt: usersTable.updatedAt,
      deletedAt: usersTable.deletedAt,
    })
    .from(usersTable)
    .where(eq(usersTable.id, session.user.id));

  if (!userResult.length) {
    throw createError({ status: 404, statusText: 'User not found' });
  }

  return {
    data: userResult[0],
  };
});
