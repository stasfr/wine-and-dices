import { eq } from 'drizzle-orm';
import { users as usersTable } from '#server/db/schema/schema.js';

export default defineEventHandler(async (event) => {
  const db = useDb();
  await requireAuth(event);

  const userId = getRouterParam(event, 'userId');

  if (!userId) {
    throw createError({ status: 400, statusText: 'Missing userId parameter' });
  }

  const userSelectResult = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      isActive: usersTable.isActive,
      lastName: usersTable.lastName,
      firstName: usersTable.firstName,
      middleName: usersTable.middleName,
    })
    .from(usersTable)
    .where(eq(usersTable.id, userId));

  const user = userSelectResult[0];

  if (!user) {
    throw createError({ status: 404, statusText: 'User not found' });
  }

  return { data: user };
});
