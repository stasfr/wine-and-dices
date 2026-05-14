import { getDb } from '#db/client.js';
import * as schema from '#db/schema/schema.js';

export function useDb() {
  return { db: getDb(), ...schema };
}
