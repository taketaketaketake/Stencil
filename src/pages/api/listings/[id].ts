import type { APIContext } from 'astro';
import { db } from '../../../db/client';
import { listings, listingVariants } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth, jsonOk, jsonError, parseBody, ListingSchema } from '../utils';

// GET /api/listings/[id]
export async function GET({ params }: APIContext) {
  const listingId = parseInt(params.id!, 10);
  if (isNaN(listingId)) {
    return jsonError('Invalid ID', 400);
  }

  const listing = await db.select().from(listings).where(eq(listings.id, listingId)).get();
  if (!listing) {
    return jsonError('Not Found', 404);
  }

  const variants = await db.select().from(listingVariants).where(eq(listingVariants.listingId, listingId)).all();
  return jsonOk({ ...listing, variants });
}

// PUT /api/listings/[id]
export async function PUT({ request, params }: APIContext) {
  const user = await requireAuth(request);
  if (user instanceof Response) return user;

  const listingId = parseInt(params.id!, 10);
  if (isNaN(listingId)) {
    return jsonError('Invalid ID', 400);
  }

  const listing = await db.select().from(listings).where(eq(listings.id, listingId)).get();
  if (!listing) {
    return jsonError('Not Found', 404);
  }

  if (listing.vendorId !== user.vendorId) {
    return jsonError('Forbidden', 403);
  }

  try {
    const data = await request.json();
    const { variants, ...listingData } = parseBody(ListingSchema, data);

    await db.transaction(async (tx) => {
      // Update base listing
      await tx.update(listings).set(listingData).where(eq(listings.id, listingId));

      // Replace variants (simple approach)
      await tx.delete(listingVariants).where(eq(listingVariants.listingId, listingId));
      await tx.insert(listingVariants).values(
        variants.map((v) => ({
          ...v,
          listingId,
          attributes: JSON.stringify(v.attributes),
          images: JSON.stringify(v.images ?? []),
        }))
      );
    });

    return jsonOk({ id: listingId });
  } catch (e: any) {
    if (e instanceof Response) return e;
    console.error('PUT /listings error:', e);
    return jsonError(e.message || 'Server error', 500);
  }
}

// DELETE /api/listings/[id]
export async function DELETE({ request, params }: APIContext) {
  const user = await requireAuth(request);
  if (user instanceof Response) return user;

  const listingId = parseInt(params.id!, 10);
  if (isNaN(listingId)) {
    return jsonError('Invalid ID', 400);
  }

  const listing = await db.select().from(listings).where(eq(listings.id, listingId)).get();
  if (!listing) {
    return jsonError('Not Found', 404);
  }

  if (listing.vendorId !== user.vendorId) {
    return jsonError('Forbidden', 403);
  }

  try {
    await db.delete(listings).where(eq(listings.id, listingId));
    // ✅ Return a JSON success message instead of 204 No Content
    return jsonOk({ message: 'Listing deleted successfully' });
  } catch (e: any) {
    console.error('DELETE /listings error:', e);
    return jsonError(e.message || 'Server error', 500);
  }
}
