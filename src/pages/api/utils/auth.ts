import { verify } from 'jsonwebtoken';
import { db } from '../../../db/client';
import { vendors } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { jsonError } from './error';

const JWT_SECRET = process.env.JWT_SECRET!;

export async function requireAuth(request: Request): Promise<{ id: number; vendorId: number; email: string; } | Response> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return jsonError('Unauthorized', 401);
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return jsonError('Unauthorized', 401);
  }

  try {
    const payload = verify(token, JWT_SECRET) as { vendorId: string };
    const vendorId = parseInt(payload.vendorId, 10);

    const vendor = await db.select().from(vendors).where(eq(vendors.id, vendorId)).get();

    if (!vendor) {
      return jsonError('Unauthorized', 401);
    }

    return {
      id: vendor.id,
      vendorId: vendor.id,
      email: vendor.email,
    };
  } catch {
    return jsonError('Unauthorized', 401);
  }
}
