import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { eq } from 'drizzle-orm';

import {
  userActivations as userActivationsTable,
  users as usersTable,
} from '@/db/schema/schema.js';

export default async function authActivate(fastify: FastifyInstance) {
  fastify.route({
    method: 'POST',
    url: '/v1/auth/activate/:activationId',
    schema: {
      params: {
        type: 'object',
        properties: {
          activationId: { type: 'string' },
        },
        required: ['activationId'],
      } as const,
    },
    preHandler: [fastify.authenticate],
    handler: async (
      request: FastifyRequest<{
        Params: {
          activationId: string;
        };
      }>,
      reply: FastifyReply,
    ) => {
      if (!request.user) {
        throw new Error('Unauthorized: No user provided', { cause: 401 });
      }

      const { id: userId, isActive: userIsActive } = request.user;

      if (userIsActive === true) {
        throw new Error('User is already activated', { cause: 400 });
      }

      const db = request.server.db;
      const { activationId } = request.params;

      const userActivationResult = await db
        .select()
        .from(userActivationsTable)
        .where(eq(userActivationsTable.id, activationId));

      if (!userActivationResult.length) {
        throw new Error('Activation link is invalid: Activation not found', {
          cause: 404,
        });
      }

      const userActivation = userActivationResult[0];

      if (userActivation.userId !== userId) {
        throw new Error('Activation link is invalid: User not found', {
          cause: 404,
        });
      }

      if (
        new Date(userActivation.createdAt) <
        new Date(Date.now() - 1000 * 60 * 60 * 24)
      ) {
        throw new Error('Activation expired', { cause: 404 });
      }

      await db
        .update(usersTable)
        .set({ isActive: true })
        .where(eq(usersTable.id, userId));

      return await reply.status(200).send();
    },
  });
}
