import { db } from './src/db/client.ts';
import { sql } from 'drizzle-orm';

async function main() {
  try {
    const migrations = await db.select({
      id: sql`id`,
      hash: sql`hash`,
      created_at: sql`created_at`
    }).from(sql`__drizzle_migrations`);

    console.log('Applied Migrations:');
    console.table(migrations);

  } catch (error) {
    console.error('Error checking migrations:', error);
  }
}

main();
