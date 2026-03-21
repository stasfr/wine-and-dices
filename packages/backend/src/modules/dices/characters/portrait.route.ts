import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export default async function dicesCharactersPortrait(
  fastify: FastifyInstance,
) {
  fastify.route({
    method: 'GET',
    url: '/v1/dices/characters/:characterKey/portrait',
    schema: {
      params: {
        type: 'object',
        properties: {
          characterKey: { type: 'string' },
        },
        required: ['characterKey'],
      } as const,
    },
    preHandler: [fastify.authenticate],
    handler: async (
      request: FastifyRequest<{
        Params: {
          characterKey: string;
        };
      }>,
      reply: FastifyReply,
    ) => {
      const { characterKey } = request.params;
      return reply.sendFile(`files/portrait/${characterKey}.png`);
    },
  });
}
