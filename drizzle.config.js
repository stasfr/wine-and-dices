import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

const {
  NUXT_DB_NAME,
  NUXT_DB_HOST,
  NUXT_DB_PASSWORD,
  NUXT_DB_PORT,
  NUXT_DB_USER,
} = process.env;

if (
  !NUXT_DB_HOST ||
  !NUXT_DB_NAME ||
  !NUXT_DB_USER ||
  !NUXT_DB_PASSWORD ||
  !NUXT_DB_PORT
) {
  throw new Error('One or more PostgreSQL environment variables are missing');
}

const connectionString = `postgresql://${NUXT_DB_USER}:${NUXT_DB_PASSWORD}@${NUXT_DB_HOST}:${NUXT_DB_PORT}/${NUXT_DB_NAME}`;

export default defineConfig({
  dbCredentials: { url: connectionString },
  dialect: 'postgresql',
  out: './drizzle',
  schema: './server/db/schema/schema.ts',
});
