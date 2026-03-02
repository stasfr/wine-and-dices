import 'dotenv/config';
import { createDbClient } from '@/db/client.js';
import { users } from '@/db/schema/schema.js';

async function main() {
  const db = createDbClient();

  const newUser = await db
    .insert(users)
    .values({
      email: 'some@test.com',
      password: 'somepswrd',
    })
    .returning();

  console.log('newUser', newUser);

  const usersList = await db.select().from(users);

  console.log('usersList', usersList);
}

void main();
