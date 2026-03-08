import { loadConfig } from '@/config.js';
import { createDbClient } from '@/db/client.js';

import { buildServer } from '@/server.js';

async function main() {
  try {
    const config = loadConfig();
    const db = createDbClient();

    const server = buildServer(config, db);
    await server.listen({ port: Number(config.SERVER_PORT) });

    console.log(`Server is running on ${config.FULL_SERVER_URL}`);
    console.log(`Docs are available on ${config.FULL_SERVER_URL}/api/docs`);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

void main();
