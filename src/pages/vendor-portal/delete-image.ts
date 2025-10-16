import type { APIRoute } from 'astro';
import { db } from '../../db/client';
import { vendorImages } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '../api/utils/auth';

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME!;
const API_KEY = process.env.CLOUDINARY_API_KEY!;
const API_SECRET = process.env.CLOUDINARY_API_SECRET!;

export const DELETE: APIRoute = async ({ request }) => {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const vendorId = auth.vendorId;

  const { image_url } = await request.json();
  if (!image_url)
    return new Response(JSON.stringify({ error: 'Missing image_url' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });

  try {
    // 1️⃣ Remove DB record
    await db.delete(vendorImages).where(
      and(eq(vendorImages.vendorId, vendorId), eq(vendorImages.imageUrl, image_url))
    );

    // 2️⃣ Extract public_id from Cloudinary URL
    const match = image_url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z]+$/);
    const public_id = match ? match[1] : null;
    if (!public_id) throw new Error('Invalid Cloudinary URL');

    // 3️⃣ Delete from Cloudinary
    const authHeader = 'Basic ' + btoa(`${API_KEY}:${API_SECRET}`);
    await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/resources/image/upload?public_ids[]=${public_id}`, {
      method: 'DELETE',
      headers: { Authorization: authHeader },
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Delete failed:', err);
    return new Response(JSON.stringify({ error: 'Delete failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
