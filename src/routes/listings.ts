import { FastifyPluginAsync } from 'fastify';
import { eq } from 'drizzle-orm';
import { listings, listingVariants } from '../db/schema.js';
import { createAuthMiddleware } from '../middleware/auth.js';
import {
  listingRequestSchema,
  listingResponseSchema,
  listingParamsSchema,
  createListingResponseSchema,
  updateListingResponseSchema,
  deleteListingResponseSchema,
  type ListingRequest
} from '../schemas/listings.js';

const listingRoutes: FastifyPluginAsync = async (fastify) => {
  
  // GET /api/listings - Public endpoint
  fastify.get('/listings', {
    schema: {
      response: {
        200: {
          type: 'array',
          items: listingResponseSchema
        }
      }
    }
  }, async (request, reply) => {
    try {
      const allListings = await fastify.db.select().from(listings).all();
      const allVariants = await fastify.db.select().from(listingVariants).all();

      const listingsWithVariants = allListings.map(listing => ({
        ...listing,
        variants: allVariants.filter(variant => variant.listingId === listing.id),
      }));

      return reply.send(listingsWithVariants);
    } catch (error: any) {
      fastify.log.error('Error fetching listings:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // POST /api/listings - Protected endpoint
  fastify.post('/listings', {
    preHandler: createAuthMiddleware(fastify),
    schema: {
      body: listingRequestSchema,
      response: createListingResponseSchema
    }
  }, async (request, reply) => {
    try {
      const { variants, ...listingData } = request.body as ListingRequest;
      const user = request.user!;

      const result = await fastify.db.transaction(async (tx) => {
        const [newListing] = await tx.insert(listings).values({
          ...listingData,
          vendorId: user.vendorId,
        }).returning({ id: listings.id });

        if (!newListing) {
          throw new Error("Failed to create listing");
        }

        await tx.insert(listingVariants).values(
          variants.map((v: any) => ({
            ...v,
            listingId: newListing.id,
            attributes: JSON.stringify(v.attributes),
            images: JSON.stringify(v.images ?? []),
          }))
        );

        return newListing;
      });

      return reply.status(201).send({ id: result.id });

    } catch (error: any) {
      fastify.log.error('Error creating listing:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // GET /api/listings/:id - Public endpoint
  fastify.get('/listings/:id', {
    schema: {
      params: listingParamsSchema,
      response: {
        200: listingResponseSchema,
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const listingId = parseInt(id, 10);

      const listing = await fastify.db.select().from(listings).where(eq(listings.id, listingId)).get();
      if (!listing) {
        return reply.status(404).send({ error: 'Listing not found' });
      }

      const variants = await fastify.db.select().from(listingVariants).where(eq(listingVariants.listingId, listingId)).all();
      
      return reply.send({ 
        ...listing, 
        variants: variants.map(v => ({
          ...v,
          attributes: typeof v.attributes === 'string' ? JSON.parse(v.attributes) : v.attributes,
          images: typeof v.images === 'string' ? JSON.parse(v.images || '[]') : v.images || []
        }))
      });

    } catch (error: any) {
      fastify.log.error('Error fetching listing:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // PUT /api/listings/:id - Protected endpoint
  fastify.put('/listings/:id', {
    preHandler: createAuthMiddleware(fastify),
    schema: {
      params: listingParamsSchema,
      body: listingRequestSchema,
      response: updateListingResponseSchema
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const listingId = parseInt(id, 10);
      const { variants, ...listingData } = request.body as ListingRequest;
      const user = request.user!;

      const listing = await fastify.db.select().from(listings).where(eq(listings.id, listingId)).get();
      if (!listing) {
        return reply.status(404).send({ error: 'Listing not found' });
      }

      if (listing.vendorId !== user.vendorId) {
        return reply.status(403).send({ error: 'Forbidden' });
      }

      await fastify.db.transaction(async (tx) => {
        // Update base listing
        await tx.update(listings).set(listingData).where(eq(listings.id, listingId));

        // Replace variants
        await tx.delete(listingVariants).where(eq(listingVariants.listingId, listingId));
        
        await tx.insert(listingVariants).values(
          variants.map((v: any) => ({
            ...v,
            listingId,
            attributes: JSON.stringify(v.attributes),
            images: JSON.stringify(v.images ?? []),
          }))
        );
      });

      return reply.send({ id: listingId });

    } catch (error: any) {
      fastify.log.error('Error updating listing:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // DELETE /api/listings/:id - Protected endpoint
  fastify.delete('/listings/:id', {
    preHandler: createAuthMiddleware(fastify),
    schema: {
      params: listingParamsSchema,
      response: deleteListingResponseSchema
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const listingId = parseInt(id, 10);
      const user = request.user!;

      const listing = await fastify.db.select().from(listings).where(eq(listings.id, listingId)).get();
      if (!listing) {
        return reply.status(404).send({ error: 'Listing not found' });
      }

      if (listing.vendorId !== user.vendorId) {
        return reply.status(403).send({ error: 'Forbidden' });
      }

      await fastify.db.delete(listings).where(eq(listings.id, listingId));
      
      return reply.send({ message: 'Listing deleted successfully' });

    } catch (error: any) {
      fastify.log.error('Error deleting listing:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  fastify.log.info('Listings routes registered: GET/POST /listings, GET/PUT/DELETE /listings/:id');
};

export default listingRoutes;