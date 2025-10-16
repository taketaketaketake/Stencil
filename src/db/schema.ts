import { sql } from 'drizzle-orm';
import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';

/** Vendors */
export const vendors = sqliteTable('vendors', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull(),
  passwordHash: text('password_hash').notNull(),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  address: text('address'),
  phone: text('phone'),
  website: text('website'),
  logo: text('logo'),
  banner: text('banner'),
  socialMedia: text('social_media', { mode: 'json' }),
});

/**
 * Listings (product “parents”)
 * Refactored: removed variant-specific fields (price, images, video)
 */
export const listings = sqliteTable('listings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  status: text('status').notNull().default('new'),
  vendorId: integer('vendor_id')
    .notNull()
    .references(() => vendors.id),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  category: text('category'),
  subCategory: text('sub_category'),
  tags: text('tags'),
  isFeatured: integer('is_featured', { mode: 'boolean' })
    .notNull()
    .default(false),
  isActive: integer('is_active', { mode: 'boolean' })
    .notNull()
    .default(true),
});

/**
 * Listing Variants (first-class product variations)
 * price/images/attributes live here
 */
export const listingVariants = sqliteTable('listing_variants', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  listingId: integer('listing_id')
    .notNull()
    .references(() => listings.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  name: text('name').notNull(), // e.g., "Red / Medium"
  sku: text('sku'),
  price: real('price').notNull(),
  stock: integer('stock').notNull().default(0),
  attributes: text('attributes', { mode: 'json' }).notNull(),
  images: text('images', { mode: 'json' }),
  isActive: integer('is_active', { mode: 'boolean' })
    .notNull()
    .default(true),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

/**
 * Sales — now point to variantId (no listingId)
 */
export const sales = sqliteTable('sales', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  variantId: integer('variant_id')
    .notNull()
    .references(() => listingVariants.id),
  vendorId: integer('vendor_id')
    .notNull()
    .references(() => vendors.id),
  amount: real('amount').notNull(),
  saleDate: integer('sale_date', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  status: text('status').notNull().default('pending'),
  paymentStatus: text('payment_status').notNull().default('pending'),
  paymentMethod: text('payment_method').notNull().default('cash'),
  paymentDate: integer('payment_date', { mode: 'timestamp' }),
  paymentAmount: real('payment_amount').notNull(),
  paymentCurrency: text('payment_currency').notNull().default('USD'),
  paymentTransactionId: text('payment_transaction_id'),
});

/** Payouts — unchanged */
export const payouts = sqliteTable('payouts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  vendorId: integer('vendor_id')
    .notNull()
    .references(() => vendors.id),
  amount: real('amount').notNull(),
  status: text('status').notNull().default('pending'),
  payoutDate: integer('payout_date', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  payoutMethod: text('payout_method').notNull().default('bank_transfer'),
  payoutAccount: text('payout_account').notNull(),
  payoutAccountName: text('payout_account_name').notNull(),
  payoutAccountNumber: text('payout_account_number').notNull(),
  payoutAccountBank: text('payout_account_bank').notNull(),
});

/**
 * 🖼️ Vendor Images
 * Supports store logos, product galleries, and general uploads
 */
export const vendorImages = sqliteTable('vendor_images', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  vendorId: integer('vendor_id')
    .references(() => vendors.id),
  imageUrl: text('image_url').notNull(),
  type: text('type').default('store'), // 'store' | 'product'
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});
