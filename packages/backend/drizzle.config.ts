import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

const { DB_NAME, DB_HOST, DB_PASSWORD, DB_PORT, DB_USER } = process.env;

if (!DB_HOST || !DB_NAME || !DB_USER || !DB_PASSWORD || !DB_PORT) {
  throw new Error('One or more PostgreSQL environment variables are missing');
}

const connectionString = `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;

export default defineConfig({
  dbCredentials: { url: connectionString },
  dialect: 'postgresql',
  out: './drizzle',
  schema: './src/db/schema/schema.ts',
});
