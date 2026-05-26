import * as v from 'valibot';
import { eq } from 'drizzle-orm';

const paramsSchema = v.object({
  characterKey: v.pipe(v.string(), v.minLength(1)),
});

export default defineAuthenticatedHandler(async (event) => {
  const { db, characters: charactersTable } = useDb();

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
    throw createError({ status: 404, statusMessage: 'Character not found' });
  }

  return { data: character };
});
