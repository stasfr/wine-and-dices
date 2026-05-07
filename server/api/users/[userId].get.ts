import * as v from 'valibot';
import { eq } from 'drizzle-orm';
import { users as usersTable } from '#server/db/schema/schema.js';

const paramsSchema = v.object({
  userId: v.pipe(v.string(), v.minLength(1)),
});

export default defineEventHandler(async (event) => {
  const db = useDb();
  await requireUserSession(event);

  const params = await getValidatedRouterParams(event, (data) =>
    v.parse(paramsSchema, data),
  );

  const { userId } = params;

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
