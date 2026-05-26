import * as v from 'valibot';
import { eq } from 'drizzle-orm';

const bodySchema = v.object({
  firstName: v.optional(v.string()),
  lastName: v.optional(v.string()),
  middleName: v.optional(v.string()),
  avatar: v.optional(v.string()),
});

export default defineEventHandler(async (event) => {
  const { db, users: usersTable } = useDb();
  const session = await requireUserSession(event);

  if (!session.user) {
    throw createError({ status: 401, statusMessage: 'Unauthorized' });
  }

  const body = await readValidatedBody(event, (data) =>
    v.parse(bodySchema, data),
  );

  const updateData: Record<string, unknown> = {
    firstName: body.firstName || null,
    lastName: body.lastName || null,
    middleName: body.middleName || null,
    updatedAt: new Date().toISOString(),
  };

  if (body.avatar !== undefined) {
    updateData.avatar = body.avatar || null;
  }

  const updateResult = await db
    .update(usersTable)
    .set(updateData)
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
