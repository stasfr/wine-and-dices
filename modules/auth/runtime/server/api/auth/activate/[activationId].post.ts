import * as v from 'valibot';
import { eq } from 'drizzle-orm';
import {
  userActivations as userActivationsTable,
  users as usersTable,
} from '#server/db/schema/schema.js';

const paramsSchema = v.object({
  activationId: v.pipe(v.string(), v.minLength(1)),
});

export default defineEventHandler(async (event) => {
  const db = useDb();
  const session = await requireUserSession(event);

  if (!session.user) {
    throw createError({ status: 401, statusMessage: 'Unauthorized' });
  }

  if (session.user.isActive) {
    throw createError({
      status: 400,
      statusMessage: 'User is already activated',
    });
  }

  const params = await getValidatedRouterParams(event, (data) =>
    v.parse(paramsSchema, data),
  );

  const { activationId } = params;

  const userActivationResult = await db
    .select()
    .from(userActivationsTable)
    .where(eq(userActivationsTable.id, activationId));

  if (!userActivationResult.length) {
    throw createError({
      status: 404,
      statusMessage: 'Activation link is invalid: Activation not found',
    });
  }

  const userActivation = userActivationResult[0];

  if (!userActivation) {
    throw createError({
      status: 404,
      statusMessage: 'Activation link is invalid: Activation not found',
    });
  }

  if (userActivation.userId !== session.user.id) {
    throw createError({
      status: 404,
      statusMessage: 'Activation link is invalid: User not found',
    });
  }

  if (
    new Date(userActivation.createdAt) <
    new Date(Date.now() - 1000 * 60 * 60 * 24)
  ) {
    throw createError({ status: 404, statusMessage: 'Activation expired' });
  }

  await db
    .update(usersTable)
    .set({ isActive: true })
    .where(eq(usersTable.id, session.user.id));

  await setUserSession(event, {
    user: {
      id: session.user.id,
      email: session.user.email,
      isActive: true,
      firstName: session.user.firstName,
      lastName: session.user.lastName,
      middleName: session.user.middleName,
      avatar: session.user.avatar,
    },
    loggedInAt: session.loggedInAt,
  });

  setResponseStatus(event, 200);

  return;
});
