import { db } from './src/db/client.ts';
import { sql } from 'drizzle-orm';

async function main() {
  try {
    const tables = await db.select({
      name: sql`name`,
      sql: sql`sql`
    }).from(sql`sqlite_master`).where(sql`type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_litestream_%' AND name NOT LIKE 'libsql_%'`);

    console.log('Database Schema:');
    for (const table of tables) {
      console.log(`\n--- ${table.name} ---\n${table.sql};`);
    }

  } catch (error) {
    console.error('Error checking schema:', error);
  }
}

main();