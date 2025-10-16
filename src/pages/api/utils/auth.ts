import { verifyToken } from '../../../utils/jwt';
import { db } from '../../../db/client';
import { vendors } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { jsonError } from './error';


export async function requireAuth(request: Request): Promise<{ id: number; vendorId: number; email: string; } | Response> {
  // Check Bearer token first
  const authHeader = request.headers.get('authorization');
  let token = authHeader?.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : null;

  // Fallback: check cookie
  if (!token) {
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies: Record<string, string> = {};
    cookieHeader.split(';').forEach(cookie => {
      const [name, ...rest] = cookie.trim().split('=');
      if (name) {
        cookies[name] = rest.join('=');
      }
    });
    token = cookies.token;
  }

  if (!token) {
    return jsonError('Unauthorized: No token found', 401);
  }

  try {
    const payload = verifyToken(token);
    const vendorId = parseInt(payload.vendorId, 10);

    const vendor = await db.select().from(vendors).where(eq(vendors.id, vendorId)).get();

    if (!vendor) {
      return jsonError('Unauthorized: Vendor not found', 401);
    }

    return {
      id: vendor.id,
      vendorId: vendor.id,
      email: vendor.email,
    };
  } catch (err) {
    console.error('Auth verification failed:', err);
    return jsonError('Unauthorized: Invalid token', 401);
  }
}
