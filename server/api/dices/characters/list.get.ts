import * as v from 'valibot';
import { eq, and, or, ilike } from 'drizzle-orm';
import { characters as charactersTable } from '#server/db/schema/schema.js';
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
  key: v.optional(v.pipe(v.string(), v.minLength(1))),
  name: v.optional(v.pipe(v.string(), v.minLength(1))),
  id: v.optional(v.pipe(v.string(), v.minLength(1))),
  search: v.optional(v.pipe(v.string(), v.minLength(1))),
});

export default defineEventHandler(async (event) => {
  const db = useDb();
  await requireAuth(event);

  const { page, perPage, key, name, id, search } = await getValidatedQuery(
    event,
    (data) => v.parse(querySchema, data),
  );

  const filters: SQL[] = [];

  if (key) {
    filters.push(eq(charactersTable.key, key));
  }
  if (name) {
    filters.push(eq(charactersTable.name, name));
  }
  if (id) {
    filters.push(eq(charactersTable.id, id));
  }
  if (search) {
    const searchFilter = or(
      ilike(charactersTable.name, `%${search}%`),
      ilike(charactersTable.ruName, `%${search}%`),
      ilike(charactersTable.key, `%${search}%`),
    );

    if (searchFilter) {
      filters.push(searchFilter);
    }
  }

  const characters = await db
    .select()
    .from(charactersTable)
    .limit(perPage)
    .offset((page - 1) * perPage)
    .where(and(...filters));

  return { data: characters };
});
