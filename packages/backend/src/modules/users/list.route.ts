import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { eq, and, SQL } from 'drizzle-orm';
import { users as usersTable } from '@/db/schema/schema.js';

export default async function userList(fastify: FastifyInstance) {
  fastify.route({
    method: 'GET',
    url: '/v1/users/list',
    schema: {
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'number' },
          perPage: { type: 'number' },
          email: { type: 'string' },
          id: { type: 'string' },
        },
      },
    },
    preHandler: [fastify.authenticate],
    handler: async (
      request: FastifyRequest<{
        Querystring: {
          page?: number;
          perPage?: number;
          email?: string;
          id?: string;
        };
      }>,
      reply: FastifyReply,
    ) => {
      const db = request.server.db;
      const { page = 1, perPage = 25, email, id } = request.query;

      const filters: SQL[] = [];

      if (email) {
        filters.push(eq(usersTable.email, email));
      }
      if (id) {
        filters.push(eq(usersTable.id, id));
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

      return reply.status(200).send({ data: users });
    },
  });
}
