import * as v from 'valibot';
import { eq, and } from 'drizzle-orm';

const paramsSchema = v.object({
  userId: v.pipe(v.string(), v.minLength(1)),
});

export default defineAuthenticatedHandler(async (event) => {
  const { db, users: usersTable } = useDb();

  const params = await getValidatedRouterParams(event, (data) =>
    v.parse(paramsSchema, data),
  );

  const { userId } = params;

  const userSelectResult = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      lastName: usersTable.lastName,
      firstName: usersTable.firstName,
      middleName: usersTable.middleName,
      avatar: usersTable.avatar,
    })
    .from(usersTable)
    .where(and(eq(usersTable.id, userId), eq(usersTable.isActive, true)));

  const user = userSelectResult[0];

  if (!user) {
    throw createError({ status: 404, statusMessage: 'User not found' });
  }

  return { data: user };
});
