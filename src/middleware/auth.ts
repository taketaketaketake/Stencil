import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { verifyToken } from '../utils/jwt.js';
import { vendors } from '../db/schema.js';
import { eq } from 'drizzle-orm';

// Extended request type for authenticated user
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: number;
      vendorId: number;
      email: string;
    };
  }
}

/**
 * Fastify preHandler hook for authentication
 * Can be used as middleware for protected routes
 */
export async function requireAuthMiddleware(
  request: FastifyRequest,
  reply: FastifyReply,
  fastify: FastifyInstance
) {
  try {
    // Check Bearer token first
    const authHeader = request.headers.authorization;
    let token = authHeader?.startsWith('Bearer ') 
      ? authHeader.split(' ')[1] 
      : null;

    // Fallback: check cookie
    if (!token) {
      token = request.cookies.token;
    }

    if (!token) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'No token found'
      });
    }

    // Verify token
    const payload = verifyToken(token);
    const vendorId = parseInt(payload.vendorId, 10);

    // Fetch vendor from database
    const vendor = await fastify.db
      .select()
      .from(vendors)
      .where(eq(vendors.id, vendorId))
      .get();

    if (!vendor) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Vendor not found'
      });
    }

    // Attach user to request
    request.user = {
      id: vendor.id,
      vendorId: vendor.id,
      email: vendor.email,
    };

  } catch (error: any) {
    request.log.error('Auth verification failed:', error);
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Invalid token'
    });
  }
}

/**
 * Factory function to create auth preHandler with fastify instance
 */
export function createAuthMiddleware(fastify: FastifyInstance) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    return requireAuthMiddleware(request, reply, fastify);
  };
}

/**
 * Higher-order function to create route-specific auth middleware
 */
export function withAuth(fastify: FastifyInstance) {
  return {
    preHandler: createAuthMiddleware(fastify)
  };
}

/**
 * Legacy compatibility function for existing Astro-style auth checks
 * @deprecated Use requireAuthMiddleware with Fastify hooks instead
 */
export async function requireAuth(
  request: FastifyRequest,
  fastify: FastifyInstance
): Promise<{ id: number; vendorId: number; email: string; } | null> {
  try {
    // Check Bearer token first
    const authHeader = request.headers.authorization;
    let token = authHeader?.startsWith('Bearer ') 
      ? authHeader.split(' ')[1] 
      : null;

    // Fallback: check cookie
    if (!token) {
      token = request.cookies.token;
    }

    if (!token) {
      return null;
    }

    // Verify token
    const payload = verifyToken(token);
    const vendorId = parseInt(payload.vendorId, 10);

    // Fetch vendor from database
    const vendor = await fastify.db
      .select()
      .from(vendors)
      .where(eq(vendors.id, vendorId))
      .get();

    if (!vendor) {
      return null;
    }

    return {
      id: vendor.id,
      vendorId: vendor.id,
      email: vendor.email,
    };

  } catch (error: any) {
    request.log.error('Auth verification failed:', error);
    return null;
  }
}