import type { APIContext } from 'astro';
import { db } from '../../../../db/client';
import { listings, listingVariants } from '../../../../db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth, jsonOk, jsonError, parseBody, VariantSchema } from '../../utils';

// PUT /api/listings/variants/[id]
// Update a single variant
export async function PUT({ request, params }: APIContext) {
  const user = await requireAuth(request);
  if (user instanceof Response) return user;

  const variantId = parseInt(params.id!, 10);
  if (isNaN(variantId)) {
    return jsonError('Invalid variant ID', 400);
  }

  const variant = await db.select().from(listingVariants).where(eq(listingVariants.id, variantId)).get();
  if (!variant) {
    return jsonError('Variant not found', 404);
  }

  // Verify that this variant belongs to a listing owned by the current vendor
  const listing = await db
    .select()
    .from(listings)
    .where(eq(listings.id, variant.listingId))
    .get();

  if (!listing || listing.vendorId !== user.vendorId) {
    return jsonError('Forbidden', 403);
  }

  try {
    const data = await request.json();
    const parsed = parseBody(VariantSchema, data);

    await db
      .update(listingVariants)
      .set({
        name: parsed.name,
        sku: parsed.sku,
        price: parsed.price,
        stock: parsed.stock,
        attributes: JSON.stringify(parsed.attributes),
        images: JSON.stringify(parsed.images ?? []),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(listingVariants.id, variantId));

    return jsonOk({ message: 'Variant updated successfully', id: variantId });
  } catch (e: any) {
    if (e instanceof Response) return e;
    console.error('PUT /variants error:', e);
    return jsonError(e.message || 'Server error', 500);
  }
}

// DELETE /api/listings/variants/[id]
// Delete a single variant
export async function DELETE({ request, params }: APIContext) {
  const user = await requireAuth(request);
  if (user instanceof Response) return user;

  const variantId = parseInt(params.id!, 10);
  if (isNaN(variantId)) {
    return jsonError('Invalid variant ID', 400);
  }

  const variant = await db.select().from(listingVariants).where(eq(listingVariants.id, variantId)).get();
  if (!variant) {
    return jsonError('Variant not found', 404);
  }

  // Check ownership: ensure the vendor owns the listing this variant belongs to
  const listing = await db
    .select()
    .from(listings)
    .where(eq(listings.id, variant.listingId))
    .get();

  if (!listing || listing.vendorId !== user.vendorId) {
    return jsonError('Forbidden', 403);
  }

  try {
    await db.delete(listingVariants).where(eq(listingVariants.id, variantId));
    // ✅ Return a friendly JSON message instead of an empty response
    return jsonOk({ message: 'Variant deleted successfully' });
  } catch (e: any) {
    console.error('DELETE /variants error:', e);
    return jsonError(e.message || 'Server error', 500);
  }
}
