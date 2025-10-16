import type { APIRoute } from 'astro';
import { db } from '../../db/client';
import { vendors } from '../../db/schema';
import { requireAuth } from '../api/utils/auth';
import { eq } from 'drizzle-orm';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  
  return new Response(JSON.stringify({ success: true, vendorId: auth.vendorId }), { 
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};

export const PUT: APIRoute = async ({ request }) => {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const vendorId = auth.vendorId;

  try {
    const body = await request.json();
    const { name, description, logo } = body;

    await db
      .update(vendors)
      .set({
        ...(name && { name }),
        ...(description && { description }),
        ...(logo && { logo }),
      })
      .where(eq(vendors.id, vendorId));

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error('Profile update failed:', err);
    return new Response(JSON.stringify({ error: 'Failed to update profile' }), { status: 500 });
  }
};
