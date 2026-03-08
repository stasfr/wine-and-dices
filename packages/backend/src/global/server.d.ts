import { FastifyReply } from 'fastify';
import type { DbClient } from '@/db/client.js';

declare module 'fastify' {
  interface FastifyRequest {}

  export interface FastifyInstance {
    db: DbClient;
  }
}
