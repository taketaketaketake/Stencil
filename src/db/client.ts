import { Database } from 'sqlite3';
import { drizzle } from 'drizzle-orm/sqlite';

const sqlite = new Database('db.sqlite'); // or use process.env.DATABASE_URL
export const db = drizzle(sqlite);
