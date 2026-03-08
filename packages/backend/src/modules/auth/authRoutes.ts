import { FastifyInstance } from 'fastify';

import {
  activateHandler,
  loginHandler,
  logoutHandler,
  meHandler,
  registerHandler,
} from '@/modules/auth/authController.js';

export function authRoutes(server: FastifyInstance) {
  server.post('/register', registerHandler);

  server.post('/login', loginHandler);

  server.delete(
    '/logout',
    { preHandler: [server.authenticate] },
    logoutHandler,
  );

  server.get('/me', { preHandler: [server.authenticate] }, meHandler);

  server.get(
    '/activate/:activationId',
    { preHandler: [server.authenticate] },
    activateHandler,
  );
}
