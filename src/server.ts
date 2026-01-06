import Fastify from 'fastify';
import { join } from 'path';
import 'dotenv/config';

const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    transport: process.env.NODE_ENV === 'production' ? undefined : {
      target: 'pino-pretty',
      options: {
        colorize: true,
        ignore: 'pid,hostname',
        translateTime: 'SYS:standard'
      }
    }
  }
});

// Global error handler
fastify.setErrorHandler(async (error, request, reply) => {
  fastify.log.error(error);
  
  // Handle JWT errors
  if (error.code === 'FST_JWT_NO_AUTHORIZATION_IN_HEADER' || 
      error.code === 'FST_JWT_AUTHORIZATION_TOKEN_INVALID') {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Invalid or missing token'
    });
  }

  // Handle validation errors
  if (error.validation) {
    return reply.status(400).send({
      error: 'Validation Error',
      message: 'Invalid request data',
      details: error.validation
    });
  }

  // Default error response
  const statusCode = error.statusCode || 500;
  return reply.status(statusCode).send({
    error: statusCode >= 500 ? 'Internal Server Error' : error.message,
    message: statusCode >= 500 ? 'Something went wrong' : error.message
  });
});

// Register plugins
async function registerPlugins() {
  // CORS plugin
  await fastify.register(import('./plugins/cors.js'));
  
  // JWT plugin
  await fastify.register(import('./plugins/jwt.js'));
  
  // Database plugin
  await fastify.register(import('./plugins/database.js'));
  
  // Auto-load routes
  await fastify.register(import('@fastify/autoload'), {
    dir: join(__dirname, 'routes'),
    options: {
      prefix: '/api' // Keep existing API prefix for compatibility
    }
  });
}

// Start server
async function start() {
  try {
    await registerPlugins();
    
    const host = process.env.HOST || '0.0.0.0';
    const port = parseInt(process.env.PORT || '8080', 10);
    
    await fastify.listen({ host, port });
    
    fastify.log.info(`🚀 Stencil API server running on http://${host}:${port}`);
    fastify.log.info(`📚 Environment: ${process.env.NODE_ENV || 'development'}`);
    
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  fastify.log.info('SIGTERM received, shutting down gracefully');
  try {
    await fastify.close();
    process.exit(0);
  } catch (error) {
    fastify.log.error('Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  fastify.log.info('SIGINT received, shutting down gracefully');
  try {
    await fastify.close();
    process.exit(0);
  } catch (error) {
    fastify.log.error('Error during shutdown:', error);
    process.exit(1);
  }
});

// Start the server
if (require.main === module) {
  start();
}

export default fastify;
export { start };