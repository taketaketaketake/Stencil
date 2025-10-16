import type { APIContext } from 'astro';
import { db } from '../../../../db/client';
import { listings, listingVariants } from '../../../../db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth, jsonOk, jsonError, parseBody, VariantSchema } from '../../utils';
import { z } from 'zod';

const AddVariantsSchema = z.object({
  listingId: z.number().int().positive(),
  variants: z.array(VariantSchema),
});

export async function POST({ request }: APIContext) {
  const user = await requireAuth(request);
  if (user instanceof Response) return user;

  try {
    const data = await request.json();
    const { listingId, variants } = parseBody(AddVariantsSchema, data);

    const listing = await db.select().from(listings).where(eq(listings.id, listingId)).get();
    if (!listing) {
      return jsonError('Not Found', 404);
    }

    if (listing.vendorId !== user.vendorId) {
      return jsonError('Forbidden', 403);
    }

    const newVariants = await db.insert(listingVariants).values(
      variants.map(v => ({
        ...v,
        listingId: listingId,
        attributes: JSON.stringify(v.attributes),
        images: JSON.stringify(v.images ?? []),
      }))
    ).returning();

    return jsonOk(newVariants, 201);

  } catch (e: any) {
    if (e instanceof Response) return e;
    return jsonError(e.message || 'Server error', 500);
  }
}
