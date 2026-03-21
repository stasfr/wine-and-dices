import path from 'node:path';

import fastify from 'fastify';
import fCookie from '@fastify/cookie';
import fastifyStatic from '@fastify/static';
import AutoLoad from '@fastify/autoload';

import { authenticate } from '@/server/decorators/authenticate.js';

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
  });

  server.register(AutoLoad, {
    dir: path.join(import.meta.dirname, '../modules'),
    dirNameRoutePrefix: false,
    options: {
      prefix: '/api',
    },
    matchFilter: (path) => /\.(route|resolver)\.ts$/.test(path),
  });

  return server;
}
