import type { APIRoute } from 'astro';
import { db } from '../../../db/client';
import { listings, listingVariants } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth } from '../../api/utils/auth';
import { jsonOk, jsonError, parseBody, ListingSchema } from '../../api/utils';

export const prerender = false;

// PUT /vendor-portal/edit-listing/[id]
export const PUT: APIRoute = async ({ request, params }) => {
  console.log('🔄 PUT /vendor-portal/edit-listing/[id] called for ID:', params.id);
  
  try {
    const user = await requireAuth(request);
    if (user instanceof Response) {
      console.log('❌ Auth failed');
      return user;
    }
    console.log('✅ Auth successful for vendor:', user.vendorId);

    const listingId = parseInt(params.id!, 10);
    if (isNaN(listingId)) {
      console.log('❌ Invalid listing ID:', params.id);
      return jsonError('Invalid ID', 400);
    }

    const listing = await db.select().from(listings).where(eq(listings.id, listingId)).get();
    if (!listing) {
      console.log('❌ Listing not found:', listingId);
      return jsonError('Not Found', 404);
    }

    if (listing.vendorId !== user.vendorId) {
      console.log('❌ Vendor mismatch. Listing vendor:', listing.vendorId, 'Request vendor:', user.vendorId);
      return jsonError('Forbidden', 403);
    }

    const data = await request.json();
    console.log('📦 Received data:', JSON.stringify(data, null, 2));
    
    const { variants, ...listingData } = parseBody(ListingSchema, data);
    console.log('✅ Data validation passed. Variants:', variants.length);

    console.log('🔄 Starting database transaction...');
    await db.transaction(async (tx) => {
      // Update base listing
      console.log('📝 Updating base listing with:', listingData);
      await tx.update(listings).set(listingData).where(eq(listings.id, listingId));

      // Replace variants (simple approach)
      console.log('🗑️ Deleting existing variants...');
      await tx.delete(listingVariants).where(eq(listingVariants.listingId, listingId));
      
      console.log('➕ Creating new variants...');
      await tx.insert(listingVariants).values(
        variants.map((v) => ({
          ...v,
          listingId,
          attributes: JSON.stringify(v.attributes),
          images: JSON.stringify(v.images ?? []),
        }))
      );
      console.log('✅ Transaction completed successfully');
    });

    return jsonOk({ id: listingId });
  } catch (e: any) {
    if (e instanceof Response) return e;
    console.error('❌ PUT /vendor-portal/edit-listing error:', e);
    console.error('❌ Error stack:', e.stack);
    return jsonError(e.message || 'Server error', 500);
  }
};