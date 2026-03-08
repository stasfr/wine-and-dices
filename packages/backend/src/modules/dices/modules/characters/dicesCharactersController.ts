import { eq } from 'drizzle-orm';
import { FastifyReply, FastifyRequest } from 'fastify';

import { characters as charactersTable } from '@/db/schema/schema.js';

export async function getCharactersListHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const db = request.server.db;
  const characters = await db.select().from(charactersTable);
  await reply.send({ data: characters });
}

export async function getCharacterByIdHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const db = request.server.db;
  const { characterId } = request.params as { characterId: string };
  const characterSelectResult = await db
    .select()
    .from(charactersTable)
    .where(eq(charactersTable.id, characterId));

  const character = characterSelectResult[0];

  if (!character) {
    throw new Error('Character not found', { cause: 404 });
  }

  await reply.send({ data: character });
}
