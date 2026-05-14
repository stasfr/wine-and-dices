import * as v from 'valibot';
import { eq, and, ilike, or } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

const querySchema = v.object({
  page: v.optional(
    v.pipe(v.string(), v.toNumber(), v.number(), v.integer(), v.minValue(1)),
    '1',
  ),
  perPage: v.optional(
    v.pipe(
      v.string(),
      v.toNumber(),
      v.number(),
      v.integer(),
      v.minValue(1),
      v.maxValue(100),
    ),
    '20',
  ),
  email: v.optional(v.pipe(v.string(), v.minLength(1), v.email())),
  id: v.optional(v.pipe(v.string(), v.minLength(1))),
  search: v.optional(v.pipe(v.string(), v.minLength(1))),
});

export default defineEventHandler(async (event) => {
  const { db, users: usersTable } = useDb();
  await requireUserSession(event);

  const { page, perPage, email, id, search } = await getValidatedQuery(
    event,
    (data) => v.parse(querySchema, data),
  );

  const filters: SQL[] = [];

  if (email) {
    filters.push(eq(usersTable.email, email));
  }
  if (id) {
    filters.push(eq(usersTable.id, id));
  }
  if (search) {
    const searchFilter = or(
      ilike(usersTable.firstName, `%${search}%`),
      ilike(usersTable.lastName, `%${search}%`),
      ilike(usersTable.middleName, `%${search}%`),
      ilike(usersTable.email, `%${search}%`),
    );

    if (searchFilter) {
      filters.push(searchFilter);
    }
  }

  const users = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      isActive: usersTable.isActive,
      lastName: usersTable.lastName,
      firstName: usersTable.firstName,
      middleName: usersTable.middleName,
      avatar: usersTable.avatar,
    })
    .from(usersTable)
    .limit(perPage)
    .offset((page - 1) * perPage)
    .where(and(...filters));

  return { data: users };
});
