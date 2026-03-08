import path from 'node:path';

import fastify from 'fastify';
import fCookie from '@fastify/cookie';
import fastifyStatic from '@fastify/static';

import { authenticate } from '@/server/decorators/authenticate.js';

import { authRoutes } from '@/modules/auth/authRoutes.js';
import { userRoutes } from '@/modules/user/userRoutes.js';
import { dicesRoutes } from '@/modules/dices/dicesRoutes.js';

import type { AppConfig } from '@/config.js';
import type { DbClient } from '@/db/client.js';

export function buildServer(config: AppConfig, db: DbClient) {
  const server = fastify();

  server.decorate('authenticate', authenticate);

  server.decorate('db', db);
  server.decorate('config', config);

  server.register(fCookie, {
    hook: 'preHandler',
    secret: config.COOKIE_SECRET,
  });

  server.register(fastifyStatic, {
    root: path.resolve('public'),
    prefix: '/files/',
  });

  server.register(
    (fastify, _, done) => {
      fastify.register(authRoutes, { prefix: '/auth' });
      fastify.register(userRoutes, { prefix: '/user' });
      fastify.register(dicesRoutes, { prefix: '/dices' });
      done();
    },
    { prefix: '/api' },
  );

  return server;
}
