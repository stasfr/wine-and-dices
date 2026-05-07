import * as v from 'valibot';
import { eq, and, ilike } from 'drizzle-orm';
import { games as gamesTable, gameModeEnum } from '#server/db/schema/schema.js';
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
  mode: v.optional(v.picklist(gameModeEnum.enumValues)),
  id: v.optional(v.pipe(v.string(), v.minLength(1))),
  search: v.optional(v.pipe(v.string(), v.minLength(1))),
});

export default defineEventHandler(async (event) => {
  const db = useDb();
  await requireUserSession(event);

  const { page, perPage, mode, id, search } = await getValidatedQuery(
    event,
    (data) => v.parse(querySchema, data),
  );

  const filters: SQL[] = [];

  if (mode) {
    filters.push(eq(gamesTable.mode, mode));
  }
  if (id) {
    filters.push(eq(gamesTable.id, id));
  }
  if (search) {
    const searchFilter = ilike(gamesTable.comment, `%${search}%`);

    if (searchFilter) {
      filters.push(searchFilter);
    }
  }

  const games = await db
    .select()
    .from(gamesTable)
    .limit(perPage)
    .offset((page - 1) * perPage)
    .where(and(...filters));

  return { data: games };
});
