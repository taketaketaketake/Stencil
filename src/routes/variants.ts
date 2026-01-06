import { FastifyPluginAsync } from 'fastify';
import { eq } from 'drizzle-orm';
import { listings, listingVariants } from '../db/schema.js';
import { createAuthMiddleware } from '../middleware/auth.js';
import {
  variantRequestSchema,
  addVariantsRequestSchema,
  variantParamsSchema,
  createVariantsResponseSchema,
  updateVariantResponseSchema,
  deleteVariantResponseSchema,
  type VariantRequest,
  type AddVariantsRequest
} from '../schemas/variants.js';

const variantRoutes: FastifyPluginAsync = async (fastify) => {
  
  // POST /api/variants - Add variants to a listing
  fastify.post('/variants', {
    preHandler: createAuthMiddleware(fastify),
    schema: {
      body: addVariantsRequestSchema,
      response: createVariantsResponseSchema
    }
  }, async (request, reply) => {
    try {
      const { listingId, variants } = request.body as AddVariantsRequest;
      const user = request.user!;

      // Verify listing exists and belongs to vendor
      const listing = await fastify.db.select().from(listings).where(eq(listings.id, listingId)).get();
      if (!listing) {
        return reply.status(404).send({ error: 'Listing not found' });
      }

      if (listing.vendorId !== user.vendorId) {
        return reply.status(403).send({ error: 'Forbidden' });
      }

      const newVariants = await fastify.db.insert(listingVariants).values(
        variants.map((v) => ({
          ...v,
          listingId: listingId,
          attributes: JSON.stringify(v.attributes),
          images: JSON.stringify(v.images ?? []),
        }))
      ).returning();

      return reply.status(201).send(newVariants);

    } catch (error: any) {
      fastify.log.error('Error creating variants:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // PUT /api/variants/:id - Update a single variant
  fastify.put('/variants/:id', {
    preHandler: createAuthMiddleware(fastify),
    schema: {
      params: variantParamsSchema,
      body: variantRequestSchema,
      response: updateVariantResponseSchema
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const variantId = parseInt(id, 10);
      const variantData = request.body as VariantRequest;
      const user = request.user!;

      const variant = await fastify.db.select().from(listingVariants).where(eq(listingVariants.id, variantId)).get();
      if (!variant) {
        return reply.status(404).send({ error: 'Variant not found' });
      }

      // Verify that this variant belongs to a listing owned by the current vendor
      const listing = await fastify.db
        .select()
        .from(listings)
        .where(eq(listings.id, variant.listingId))
        .get();

      if (!listing || listing.vendorId !== user.vendorId) {
        return reply.status(403).send({ error: 'Forbidden' });
      }

      await fastify.db
        .update(listingVariants)
        .set({
          name: variantData.name,
          sku: variantData.sku,
          price: variantData.price,
          stock: variantData.stock,
          attributes: JSON.stringify(variantData.attributes),
          images: JSON.stringify(variantData.images ?? []),
          updatedAt: new Date(),
        })
        .where(eq(listingVariants.id, variantId));

      return reply.send({ message: 'Variant updated successfully', id: variantId });

    } catch (error: any) {
      fastify.log.error('Error updating variant:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // DELETE /api/variants/:id - Delete a single variant
  fastify.delete('/variants/:id', {
    preHandler: createAuthMiddleware(fastify),
    schema: {
      params: variantParamsSchema,
      response: deleteVariantResponseSchema
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const variantId = parseInt(id, 10);
      const user = request.user!;

      const variant = await fastify.db.select().from(listingVariants).where(eq(listingVariants.id, variantId)).get();
      if (!variant) {
        return reply.status(404).send({ error: 'Variant not found' });
      }

      // Check ownership: ensure the vendor owns the listing this variant belongs to
      const listing = await fastify.db
        .select()
        .from(listings)
        .where(eq(listings.id, variant.listingId))
        .get();

      if (!listing || listing.vendorId !== user.vendorId) {
        return reply.status(403).send({ error: 'Forbidden' });
      }

      await fastify.db.delete(listingVariants).where(eq(listingVariants.id, variantId));
      
      return reply.send({ message: 'Variant deleted successfully' });

    } catch (error: any) {
      fastify.log.error('Error deleting variant:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  fastify.log.info('Variants routes registered: POST /variants, PUT/DELETE /variants/:id');
};

export default variantRoutes;