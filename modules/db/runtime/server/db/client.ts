import { drizzle } from 'drizzle-orm/node-postgres';
import { relations } from '#db/schema/schema.js';

let dbInstance: ReturnType<typeof drizzle> | undefined;

export function getDb() {
  if (!dbInstance) {
    const config = useRuntimeConfig();

    if (
      !config.dbHost ||
      !config.dbName ||
      !config.dbUser ||
      !config.dbPassword ||
      !config.dbPort
    ) {
      throw new Error(
        'One or more PostgreSQL environment variables are missing',
      );
    }

    const DB_URL = `postgresql://${config.dbUser}:${config.dbPassword}@${config.dbHost}:${config.dbPort}/${config.dbName}`;

    dbInstance = drizzle({
      connection: {
        connectionString: DB_URL,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      },
      relations,
    });
  }

  return dbInstance;
}

export type DbClient = ReturnType<typeof getDb>;
