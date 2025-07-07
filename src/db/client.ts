import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { join } from 'path';

const sqlite = new Database('db.sqlite');
export const db = drizzle(sqlite);

const migrationsFolder = join(process.cwd(), 'drizzle');
migrate(db, { migrationsFolder });

