import { drizzle } from 'drizzle-orm/node-postgres';
import { relations } from '#server/db/schema/schema';

let db: ReturnType<typeof drizzle> | undefined;

export function useDb() {
  if (!db) {
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

    db = drizzle({
      connection: {
        connectionString: DB_URL,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      },
      relations,
    });
  }

  return db;
}

export type DbClient = ReturnType<typeof useDb>;
