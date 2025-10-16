import type { APIRoute } from 'astro';
import { requireAuth } from '../api/utils/auth';

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME!;
const SECURE_PRESET = process.env.CLOUDINARY_SECURE_UPLOAD_PRESET!;
const SITE_URL = process.env.SITE_URL!; // e.g. http://localhost:4321

export const POST: APIRoute = async ({ request }) => {
  console.log('🔄 Upload logo endpoint called');
  
  try {
    const auth = await requireAuth(request);
    if (auth instanceof Response) {
      console.log('❌ Auth failed');
      return auth;
    }
    console.log('✅ Auth successful for vendor:', auth.vendorId);

    const vendorId = auth.vendorId; // vendor ID from your session
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.log('❌ No file in request');
      return new Response(JSON.stringify({ error: 'No file uploaded' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    console.log('✅ File received:', file.name, 'Size:', file.size);

  // Get signed params from your sign-upload endpoint  
  const protocol = request.headers.get('x-forwarded-proto') || 'http';
  const host = request.headers.get('host') || 'localhost:4321';
  const baseUrl = `${protocol}://${host}`;
  
    console.log('🔄 Getting signature from:', `${baseUrl}/vendor-portal/sign-upload`);
    const signRes = await fetch(`${baseUrl}/vendor-portal/sign-upload`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || ''
      },
      body: JSON.stringify({
        folder: 'vendor_uploads',
        public_id: `vendor_${vendorId}_logo`, // keeps the same public ID for overwriting
      }),
    });

    if (!signRes.ok) {
      const err = await signRes.text();
      console.error('❌ Failed to get signature:', signRes.status, err);
      return new Response(JSON.stringify({ error: 'Failed to get signature' }), { status: 500 });
    }
    console.log('✅ Got signature successfully');

    const signed = await signRes.json();

    // Upload to Cloudinary
    const uploadForm = new FormData();
    uploadForm.append('file', file);
    uploadForm.append('api_key', signed.api_key);
    uploadForm.append('timestamp', signed.timestamp.toString());
    uploadForm.append('upload_preset', signed.upload_preset);
    uploadForm.append('signature', signed.signature);
    uploadForm.append('folder', signed.folder);
    uploadForm.append('public_id', signed.public_id);
    uploadForm.append('overwrite', 'true');

    console.log('🔄 Uploading to Cloudinary...');
    const cloudRes = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      { method: 'POST', body: uploadForm }
    );

    if (!cloudRes.ok) {
      const err = await cloudRes.text();
      console.error('❌ Cloudinary upload failed:', cloudRes.status, err);
      return new Response(JSON.stringify({ error: 'Cloudinary upload failed' }), { status: 500 });
    }

    const data = await cloudRes.json();

    // Use the original secure URL without transformations to avoid auth issues
    const imageUrl = data.secure_url;

    console.log('✅ Upload successful, returning URL:', imageUrl);
    return new Response(JSON.stringify({ url: imageUrl }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Unexpected upload error:', error);
    return new Response(JSON.stringify({ error: 'Unexpected error during upload' }), { status: 500 });
  }
};
