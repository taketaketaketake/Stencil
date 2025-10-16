import type { APIRoute } from 'astro';
import crypto from 'crypto';
import { requireAuth } from '../api/utils/auth';

// Generates signed parameters vendors can use for Cloudinary secure uploads
export const POST: APIRoute = async ({ request }) => {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth; // only vendors allowed

  const vendorId = auth.vendorId; // vendor ID from your session
  const body = await request.json().catch(() => ({}));

  const folder = body.folder || 'vendor_uploads';
  const publicId = body.public_id || `vendor_${vendorId}_logo`;
  const timestamp = Math.floor(Date.now() / 1000);
  console.log('🕒 Generated timestamp:', timestamp, 'Date:', new Date(timestamp * 1000));

  const uploadPreset = process.env.CLOUDINARY_SECURE_UPLOAD_PRESET!; // ✅ Use your signed preset
  const apiSecret = process.env.CLOUDINARY_API_SECRET!;
  const apiKey = process.env.CLOUDINARY_API_KEY!;

  // 🧮 Construct signature string (alphabetical order)
  const paramsToSign = [
    `folder=${folder}`,
    `overwrite=true`,
    `public_id=${publicId}`,
    `timestamp=${timestamp}`,
    `upload_preset=${uploadPreset}`,
  ].join('&');

  const signature = crypto.createHash('sha1').update(paramsToSign + apiSecret).digest('hex');

  return new Response(
    JSON.stringify({
      timestamp,
      folder,
      public_id: publicId,
      upload_preset: uploadPreset,
      signature,
      api_key: apiKey,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};
