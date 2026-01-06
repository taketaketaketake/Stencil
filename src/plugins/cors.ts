import { FastifyPluginAsync } from 'fastify';
import cors from '@fastify/cors';

const corsPlugin: FastifyPluginAsync = async (fastify) => {
  // Define allowed origins for CORS
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:4321', 
    'https://shopstencil.com',
    'https://www.shopstencil.com'
  ];

  await fastify.register(cors, {
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      // Reject unauthorized origins
      return callback(new Error('CORS: Origin not allowed'), false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400 // Cache preflight response for 24 hours
  });

  fastify.log.info('CORS plugin registered with origins:', allowedOrigins);
};

export default corsPlugin;