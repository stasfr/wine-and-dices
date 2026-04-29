import { eq, and, ilike, or } from 'drizzle-orm';
import { users as usersTable } from '#server/db/schema/schema.js';
import type { SQL } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const db = useDb();
  await requireAuth(event);

  const query = getQuery(event);

  const page = Number(query.page) || 1;
  const perPage = Number(query.perPage) || 25;
  const email = query.email ? String(query.email) : undefined;
  const id = query.id ? String(query.id) : undefined;
  const search = query.search ? String(query.search) : undefined;

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
    })
    .from(usersTable)
    .limit(perPage)
    .offset((page - 1) * perPage)
    .where(and(...filters));

  return { data: users };
});
