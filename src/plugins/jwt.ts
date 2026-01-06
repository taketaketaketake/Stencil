import { FastifyPluginAsync } from 'fastify';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';

const jwtPlugin: FastifyPluginAsync = async (fastify) => {
  // Register cookie support first
  await fastify.register(cookie, {
    secret: process.env.JWT_SECRET || 'your-secret-key-here', // For cookie signing
    parseOptions: {}
  });

  // Register JWT plugin
  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET || 'your-secret-key-here',
    cookie: {
      cookieName: 'token',
      signed: false // We'll handle JWT verification, not cookie signing
    },
    // Support both Bearer tokens and cookies
    formatUser: (payload) => {
      return {
        vendorId: parseInt(payload.vendorId, 10),
        id: parseInt(payload.vendorId, 10) // Keep compatibility with existing code
      };
    }
  });

  // Add custom authentication decorator for backward compatibility
  fastify.decorate('authenticate', async function(request, reply) {
    try {
      // Try Bearer token first
      if (request.headers.authorization) {
        await request.jwtVerify();
        return;
      }
      
      // Fallback to cookie
      if (request.cookies.token) {
        const payload = fastify.jwt.verify(request.cookies.token);
        request.user = {
          vendorId: parseInt(payload.vendorId, 10),
          id: parseInt(payload.vendorId, 10)
        };
        return;
      }
      
      throw new Error('No token provided');
    } catch (error) {
      reply.code(401).send({
        error: 'Unauthorized',
        message: 'Invalid or missing token'
      });
    }
  });

  fastify.log.info('JWT plugin registered with cookie and Bearer token support');
};

export default jwtPlugin;