import { drizzle } from 'drizzle-orm/node-postgres';
import { relations } from '@/db/schema/schema.js';

export function createDbClient() {
  const { DB_NAME, DB_HOST, DB_PASSWORD, DB_PORT, DB_USER } = process.env;

  if (!DB_HOST || !DB_NAME || !DB_USER || !DB_PASSWORD || !DB_PORT) {
    throw new Error('One or more PostgreSQL environment variables are missing');
  }

  const DB_URL = `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;

  return drizzle(DB_URL, { relations });
}
