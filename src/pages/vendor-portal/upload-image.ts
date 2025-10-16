export const prerender = false;

import type { APIRoute } from 'astro';
import { requireAuth } from '../api/utils/auth';
import crypto from 'crypto';

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME!;
const API_KEY = process.env.CLOUDINARY_API_KEY!;
const API_SECRET = process.env.CLOUDINARY_API_SECRET!;
const UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET!;

export const POST: APIRoute = async ({ request }) => {
  console.log('🔄 Upload image endpoint called');
  
  try {
    const auth = await requireAuth(request);
    if (auth instanceof Response) {
      console.log('❌ Auth failed');
      return auth;
    }
    console.log('✅ Auth successful for vendor:', auth.vendorId);

    const form = await request.formData();
    const file = form.get('file') as File;
    if (!file) {
      console.log('❌ No file in request');
      return new Response(JSON.stringify({ error: 'No file uploaded' }), { status: 400 });
    }
    console.log('✅ File received:', file.name, 'Size:', file.size);

  // Generate signed parameters directly
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = 'vendor_uploads';
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}&upload_preset=${UPLOAD_PRESET}`;
  const signature = crypto.createHash('sha1').update(paramsToSign + API_SECRET).digest('hex');

  const uploadForm = new FormData();
  uploadForm.append('file', file);
  uploadForm.append('api_key', API_KEY);
  uploadForm.append('timestamp', timestamp.toString());
  uploadForm.append('upload_preset', UPLOAD_PRESET);
  uploadForm.append('signature', signature);
  uploadForm.append('folder', folder);

    console.log('🔄 Uploading to Cloudinary...');
    const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: uploadForm,
    });

    if (!cloudRes.ok) {
      const err = await cloudRes.text();
      console.error('❌ Cloudinary upload failed:', cloudRes.status, err);
      return new Response(JSON.stringify({ error: 'Upload failed' }), { status: 500 });
    }

    const data = await cloudRes.json();
    console.log('✅ Cloudinary upload successful:', data.public_id);
    return new Response(JSON.stringify({ url: data.secure_url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Upload endpoint error:', error);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
};