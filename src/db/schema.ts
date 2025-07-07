import { sqliteTable, integer, text } from 'drizzle-orm/sqlite';

export const vendors = sqliteTable('vendors', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull(),
  passwordHash: text('password_hash').notNull(),
});
