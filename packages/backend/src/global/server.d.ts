import { FastifyReply } from 'fastify';

import type { AppConfig } from '@/config.js';
import type { DbClient } from '@/db/client.js';

declare module 'fastify' {
  interface FastifyRequest {
    user: {
      id: string;
      email: string;
      isActive: boolean;
    };
  }

  export interface FastifyInstance {
    db: DbClient;
    config: AppConfig;
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => Promise<void>;
  }
}
