import { FastifyInstance } from 'fastify';

import { users as usersTable } from '@/db/schema/schema.js';

export default async function userList(fastify: FastifyInstance) {
  fastify.route({
    method: 'GET',
    url: '/v1/user/list',
    handler: async (request, reply) => {
      const users = await request.server.db
        .select({
          email: usersTable.email,
          id: usersTable.id,
        })
        .from(usersTable);

      return reply.status(200).send({ data: users });
    },
  });
}
