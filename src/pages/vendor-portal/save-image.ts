import type { APIRoute } from 'astro';
import { db } from '../../db/client';
import { vendorImages } from '../../db/schema';
import { requireAuth } from '../api/utils/auth';

export const POST: APIRoute = async ({ request }) => {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth; // not logged in
  const vendorId = auth.vendorId;

  const { image_url, type = 'store' } = await request.json();

  if (!image_url)
    return new Response(JSON.stringify({ error: 'Missing image_url' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });

  await db.insert(vendorImages).values({
    vendorId: vendorId,
    imageUrl: image_url,
    type,
  });

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
