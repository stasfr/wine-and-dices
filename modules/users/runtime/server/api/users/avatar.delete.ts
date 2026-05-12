import { eq } from 'drizzle-orm';

import { users as usersTable } from '#server/db/schema/schema.js';

export default defineEventHandler(async (event) => {
  const db = useDb();
  const session = await requireUserSession(event);

  if (!session.user) {
    throw createError({ status: 401, statusMessage: 'Unauthorized' });
  }

  const userSelectResult = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      isActive: usersTable.isActive,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      middleName: usersTable.middleName,
      avatar: usersTable.avatar,
    })
    .from(usersTable)
    .where(eq(usersTable.id, session.user.id));

  const existingUser = userSelectResult[0];

  if (!existingUser) {
    throw createError({ status: 404, statusMessage: 'User not found' });
  }

  if (existingUser.avatar) {
    try {
      await deleteFile(existingUser.avatar, '');
    } catch {
      // ignore if file doesn't exist
    }
  }

  const updateResult = await db
    .update(usersTable)
    .set({
      avatar: null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(usersTable.id, session.user.id))
    .returning({
      id: usersTable.id,
      email: usersTable.email,
      isActive: usersTable.isActive,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      middleName: usersTable.middleName,
      avatar: usersTable.avatar,
    });

  const user = updateResult[0];

  if (!user) {
    throw createError({ status: 404, statusMessage: 'User not found' });
  }

  await replaceUserSession(event, {
    user: {
      id: user.id,
      email: user.email,
      isActive: user.isActive,
      firstName: user.firstName,
      lastName: user.lastName,
      middleName: user.middleName,
      avatar: user.avatar,
    },
    loggedInAt: session.loggedInAt,
  });

  return { data: user };
});
