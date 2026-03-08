import { FastifyReply, FastifyRequest } from 'fastify';
import { users as usersTable } from '@/db/schema/schema.js';

export async function getUsersHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const users = await request.server.db
    .select({
      email: usersTable.email,
      id: usersTable.id,
    })
    .from(usersTable);

  return reply.status(200).send({ data: users });
}
