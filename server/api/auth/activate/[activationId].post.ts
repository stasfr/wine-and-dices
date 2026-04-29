import { eq } from 'drizzle-orm';
import {
  userActivations as userActivationsTable,
  users as usersTable,
} from '#server/db/schema/schema.js';

export default defineEventHandler(async (event) => {
  const db = useDb();
  const user = await requireAuth(event);

  if (user!.isActive) {
    throw createError({ status: 400, statusText: 'User is already activated' });
  }

  const activationId = getRouterParam(event, 'activationId');

  if (!activationId) {
    throw createError({ status: 400, statusText: 'Activation ID is required' });
  }

  const userActivationResult = await db
    .select()
    .from(userActivationsTable)
    .where(eq(userActivationsTable.id, activationId));

  if (!userActivationResult.length) {
    throw createError({
      status: 404,
      statusText: 'Activation link is invalid: Activation not found',
    });
  }

  const userActivation = userActivationResult[0]!;

  if (userActivation.userId !== user!.id) {
    throw createError({
      status: 404,
      statusText: 'Activation link is invalid: User not found',
    });
  }

  if (
    new Date(userActivation.createdAt) <
    new Date(Date.now() - 1000 * 60 * 60 * 24)
  ) {
    throw createError({ status: 404, statusText: 'Activation expired' });
  }

  await db
    .update(usersTable)
    .set({ isActive: true })
    .where(eq(usersTable.id, user!.id));

  setResponseStatus(event, 200);

  return;
});
