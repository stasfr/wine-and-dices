import { drizzle } from 'drizzle-orm/node-postgres';
import { relations } from '#server/db/schema/schema';

export function useDb() {
  const config = useRuntimeConfig();

  if (
    !config.dbHost ||
    !config.dbName ||
    !config.dbUser ||
    !config.dbPassword ||
    !config.dbPort
  ) {
    throw new Error('One or more PostgreSQL environment variables are missing');
  }

  const DB_URL = `postgresql://${config.dbUser}:${config.dbPassword}@${config.dbHost}:${config.dbPort}/${config.dbName}`;

  return drizzle(DB_URL, { relations });
}

export type DbClient = ReturnType<typeof useDb>;
