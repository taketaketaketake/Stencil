import { defineMiddleware } from 'astro:middleware';

// Define allowed origins for CORS
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:4321',
  'https://shopstencil.com',
  'https://www.shopstencil.com'
];

export const onRequest = defineMiddleware(async (context, next) => {
  const origin = context.request.headers.get('origin');
  
  // Handle preflight requests
  if (context.request.method === 'OPTIONS') {
    // Only allow preflight for allowed origins
    if (origin && allowedOrigins.includes(origin)) {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Max-Age': '86400',
        }
      });
    }
    // Reject preflight from unauthorized origins
    return new Response(null, { status: 403 });
  }
  
  // Process the request
  const response = await next();
  
  // Add CORS headers if origin is allowed
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }
  
  return response;
});
