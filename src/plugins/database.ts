import { FastifyPluginAsync } from 'fastify';
import { db } from '../db/client.js';

const databasePlugin: FastifyPluginAsync = async (fastify) => {
  // Decorate Fastify instance with database client
  fastify.decorate('db', db);
  
  // Add hook to log database queries in development
  if (process.env.NODE_ENV !== 'production') {
    fastify.addHook('preHandler', async (request) => {
      request.log.debug('Database client available for request');
    });
  }

  // Test database connection on startup
  try {
    // Simple query to test connection
    const { vendors } = await import('../db/schema.js');
    await db.select().from(vendors).limit(1);
    fastify.log.info('✅ Database connection verified');
  } catch (error: any) {
    fastify.log.error('❌ Database connection failed:', error?.message || error);
    throw error;
  }

  fastify.log.info('Database plugin registered');
};

// Declare module augmentation for TypeScript
declare module 'fastify' {
  interface FastifyInstance {
    db: typeof db;
  }
}

export default databasePlugin;