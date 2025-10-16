import type { APIContext } from 'astro';
import { db } from '../../../db/client';
import { listings, listingVariants } from '../../../db/schema';
import { requireAuth, jsonOk, jsonError, parseBody, ListingSchema } from '../utils';

export async function GET({}: APIContext) {
  const allListings = await db.select().from(listings).all();
  const allVariants = await db.select().from(listingVariants).all();

  const listingsWithVariants = allListings.map(listing => ({
    ...listing,
    variants: allVariants.filter(variant => variant.listingId === listing.id),
  }));

  return jsonOk(listingsWithVariants);
}

export async function POST({ request }: APIContext) {
  const user = await requireAuth(request);
  if (user instanceof Response) return user;

  try {
    const data = await request.json();
    const { variants, ...listingData } = parseBody(ListingSchema, data);

    const result = await db.transaction(async (tx) => {
      const [newListing] = await tx.insert(listings).values({
        ...listingData,
        vendorId: user.vendorId,
      }).returning({ id: listings.id });

      if (!newListing) {
        throw new Error("Failed to create listing");
      }

      await tx.insert(listingVariants).values(
        variants.map(v => ({
          ...v,
          listingId: newListing.id,
          attributes: JSON.stringify(v.attributes),
          images: JSON.stringify(v.images ?? []),
        }))
      );

      return newListing;
    });

    return jsonOk({ id: result.id }, 201);

  } catch (e: any) {
    if (e instanceof Response) return e;
    return jsonError(e.message || 'Server error', 500);
  }
}
