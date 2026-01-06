import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { join } from 'path';

// Use local SQLite database
const dbPath = 'db.sqlite';
const sqlite = new Database(dbPath);
export const db = drizzle(sqlite);

// Create indexes for performance optimization
try {
  // Index for listing_variants.listing_id (used in subqueries)
  sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_listing_variants_listing_id ON listing_variants(listing_id)`);
  
  // Index for listings.vendor_id (used in WHERE clauses)
  sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_listings_vendor_id ON listings(vendor_id)`);
  
  console.log('✅ Database indexes created successfully');
} catch (error) {
  console.log('ℹ️ Database indexes already exist or failed to create:', error.message);
}



