import * as v from 'valibot';
import { eq } from 'drizzle-orm';
import { users as usersTable } from '#server/db/schema/schema.js';

const bodySchema = v.object({
  email: v.pipe(v.string(), v.minLength(1), v.email()),
  password: v.pipe(v.string(), v.minLength(1)),
});

export default defineEventHandler(async (event) => {
  const db = useDb();
  const { email, password } = await readValidatedBody(event, (data) =>
    v.parse(bodySchema, data),
  );

  const userResult = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email));

  if (!userResult.length) {
    throw createError({ status: 401, statusText: 'Invalid credentials' });
  }

  const user = userResult[0];

  if (!user) {
    throw createError({ status: 401, statusText: 'Invalid credentials' });
  }

  const correctPassword = await verifyPassword(user.password, password);

  if (!correctPassword) {
    throw createError({ status: 401, statusText: 'Invalid credentials' });
  }

  await setUserSession(event, {
    user: {
      id: user.id,
      email: user.email,
      isActive: user.isActive,
    },
    loggedInAt: Date.now(),
  });

  setResponseStatus(event, 200);

  return;
});
