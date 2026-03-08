import { FastifyInstance } from 'fastify';

import { dicesCharactersRoutes } from '@/modules/dices/modules/characters/dicesCharactersRoutes.js';

export function dicesRoutes(server: FastifyInstance) {
  server.register(dicesCharactersRoutes, {
    prefix: '/characters',
    preHandler: [server.authenticate],
  });
}
