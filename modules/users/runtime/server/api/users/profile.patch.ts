import * as v from 'valibot';
import { eq } from 'drizzle-orm';
import { users as usersTable } from '#server/db/schema/schema.js';

const bodySchema = v.object({
  firstName: v.optional(v.string()),
  lastName: v.optional(v.string()),
  middleName: v.optional(v.string()),
  avatar: v.optional(v.string()),
});

export default defineEventHandler(async (event) => {
  const db = useDb();
  const session = await requireUserSession(event);

  if (!session.user) {
    throw createError({ status: 401, statusMessage: 'Unauthorized' });
  }

  const body = await readValidatedBody(event, (data) =>
    v.parse(bodySchema, data),
  );

  const updateResult = await db
    .update(usersTable)
    .set({
      firstName: body.firstName || null,
      lastName: body.lastName || null,
      middleName: body.middleName || null,
      avatar: body.avatar || null,
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
