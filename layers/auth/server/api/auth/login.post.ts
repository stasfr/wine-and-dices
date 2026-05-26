import * as v from 'valibot';
import { eq } from 'drizzle-orm';

const passwordSchema = v.pipe(
  v.string(),
  v.minLength(8, 'Must be at least 8 characters'),
  v.maxLength(64, 'Must be at most 64 characters'),
  v.regex(/^\S*$/, 'Must not contain spaces'),
  v.regex(/[a-z]/, 'Must contain at least one lowercase letter'),
  v.regex(/[A-Z]/, 'Must contain at least one uppercase letter'),
  v.regex(/[0-9]/, 'Must contain at least one digit'),
  v.regex(/[\p{P}\p{S}]/u, 'Must contain at least one special character'),
);

const bodySchema = v.object({
  email: v.pipe(v.string(), v.minLength(1), v.email()),
  password: passwordSchema,
});

export default defineEventHandler(async (event) => {
  const { db, users: usersTable } = useDb();
  const { email, password } = await readValidatedBody(event, (data) =>
    v.parse(bodySchema, data),
  );

  const userResult = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email));

  if (!userResult.length) {
    throw createError({
      status: 404,
      statusMessage: 'User does not exist',
    });
  }

  const user = userResult[0];

  if (!user) {
    throw createError({
      status: 404,
      statusMessage: 'User does not exist',
    });
  }

  const correctPassword = await verifyPassword(user.password, password);

  if (!correctPassword) {
    throw createError({ status: 401, statusMessage: 'Invalid credentials' });
  }

  await setUserSession(event, {
    user: {
      id: user.id,
      email: user.email,
      isActive: user.isActive,
      firstName: user.firstName,
      lastName: user.lastName,
      middleName: user.middleName,
      avatar: user.avatar,
    },
    loggedInAt: Date.now(),
  });

  setResponseStatus(event, 200);

  return;
});
