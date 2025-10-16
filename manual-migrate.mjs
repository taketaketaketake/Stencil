import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const db = new Database('db.sqlite');

const migrationFile = path.join(process.cwd(), 'drizzle', '20251015_refactor_variants.sql');
const migrationSql = fs.readFileSync(migrationFile, 'utf-8');

db.exec(migrationSql);

console.log('Migration applied manually.');
