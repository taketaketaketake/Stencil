import { defineMiddleware } from 'astro:middleware';

// Define allowed origins for CORS
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:4321',
  'https://shopstencil.com',
  'https://www.shopstencil.com'
];

// CORS headers configuration
const CORS_HEADERS = {
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true'
} as const;

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
          ...CORS_HEADERS,
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
    Object.entries(CORS_HEADERS).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }
  
  return response;
});
