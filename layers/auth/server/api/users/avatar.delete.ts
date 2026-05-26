import { eq } from 'drizzle-orm';
import { rm } from 'node:fs/promises';
import { join } from 'node:path';

export default defineAuthenticatedHandler(async (event, session) => {
  const { db, users: usersTable } = useDb();

  const userSelectResult = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
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
      const oldPath = join(
        process.cwd(),
        'public',
        'avatars',
        existingUser.avatar,
      );
      await rm(oldPath, { force: true });
    } catch (error) {
      console.error('Failed to delete old avatar:', error);
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

  return {
    data: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      middleName: user.middleName,
      avatar: user.avatar,
    },
  };
});
