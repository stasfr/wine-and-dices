import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { eq, and, ilike, or } from 'drizzle-orm';
import { users as usersTable } from '@/db/schema/schema.js';

import type { SQL } from 'drizzle-orm';

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
          search: { type: 'string' },
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
          search?: string;
        };
      }>,
      reply: FastifyReply,
    ) => {
      const db = request.server.db;
      const { page = 1, perPage = 25, email, id, search } = request.query;

      const filters: SQL[] = [];

      if (email) {
        filters.push(eq(usersTable.email, email));
      }
      if (id) {
        filters.push(eq(usersTable.id, id));
      }
      if (search) {
        filters.push(
          or(
            ilike(usersTable.firstName, `%${search}%`),
            ilike(usersTable.lastName, `%${search}%`),
            ilike(usersTable.middleName, `%${search}%`),
            ilike(usersTable.email, `%${search}%`),
            // FIXME: check typing for or expression and remove "!"
          )!,
        );
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
