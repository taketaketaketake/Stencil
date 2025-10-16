import pkg from 'jsonwebtoken';
const { sign, verify } = pkg;

// Ensure environment variables are loaded
function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('❌ JWT_SECRET environment variable is not defined');
    console.log('Available env vars:', Object.keys(process.env).filter(k => k.includes('JWT')));
    throw new Error('JWT_SECRET environment variable is required but not defined');
  }
  return secret;
}

export interface JWTPayload {
  vendorId: string;
  [key: string]: any;
}

/**
 * Sign a JWT token with vendor ID
 */
export function signToken(vendorId: string, options: { expiresIn?: string } = {}): string {
  return sign(
    { vendorId }, 
    getJWTSecret(), 
    { expiresIn: options.expiresIn || '7d' }
  );
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): JWTPayload {
  return verify(token, getJWTSecret()) as JWTPayload;
}

/**
 * Extract vendor ID from token
 */
export function getVendorIdFromToken(token: string): number {
  const payload = verifyToken(token);
  return parseInt(payload.vendorId, 10);
}