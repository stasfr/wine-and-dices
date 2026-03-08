import path from 'node:path';

import fastify from 'fastify';
import fCookie from '@fastify/cookie';
import fastifyStatic from '@fastify/static';

import { userRoutes } from '@/modules/user/userRoutes.js';

import type { AppConfig } from '@/config.js';
import type { DbClient } from '@/db/client.js';

export function buildServer(config: AppConfig, db: DbClient) {
  const server = fastify();

  server.decorate('db', db);

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
      fastify.register(userRoutes, { prefix: '/user' });
      done();
    },
    { prefix: '/api' },
  );

  return server;
}
