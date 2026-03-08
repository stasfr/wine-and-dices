import { FastifyInstance } from 'fastify';

import { getUsersHandler } from '@/modules/user/userController.js';

export function userRoutes(server: FastifyInstance) {
  server.get('/list', getUsersHandler);
}
