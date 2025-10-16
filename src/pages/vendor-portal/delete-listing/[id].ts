import type { APIRoute } from 'astro';
import { db } from '../../../db/client';
import { listings } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth } from '../../api/utils/auth';
import { jsonOk, jsonError } from '../../api/utils';

export const prerender = false;

// DELETE /vendor-portal/delete-listing/[id]
export const DELETE: APIRoute = async ({ request, params }) => {
  console.log('🗑️ DELETE /vendor-portal/delete-listing/[id] called for ID:', params.id);
  
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

    console.log('🗑️ Deleting listing...');
    await db.delete(listings).where(eq(listings.id, listingId));
    console.log('✅ Listing deleted successfully');
    
    return jsonOk({ message: 'Listing deleted successfully' });
  } catch (e: any) {
    if (e instanceof Response) return e;
    console.error('❌ DELETE /vendor-portal/delete-listing error:', e);
    console.error('❌ Error stack:', e.stack);
    return jsonError(e.message || 'Server error', 500);
  }
};