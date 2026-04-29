import * as v from 'valibot';
import { eq } from 'drizzle-orm';
import { characters as charactersTable } from '#server/db/schema/schema.js';

const paramsSchema = v.object({
  characterKey: v.pipe(v.string(), v.minLength(1)),
});

export default defineEventHandler(async (event) => {
  const db = useDb();
  await requireAuth(event);

  const params = await getValidatedRouterParams(event, (data) =>
    v.parse(paramsSchema, data),
  );

  const { characterKey } = params;

  const characterSelectResult = await db
    .select()
    .from(charactersTable)
    .where(eq(charactersTable.key, characterKey));

  const character = characterSelectResult[0];

  if (!character) {
    throw createError({ status: 404, statusText: 'Character not found' });
  }

  return { data: character };
});
