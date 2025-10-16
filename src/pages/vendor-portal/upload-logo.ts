import type { APIRoute } from 'astro';

// Cloudinary configuration
const CLOUD_NAME = 'dsjbqjihz';        // 👈 your Cloudinary cloud name
const UPLOAD_PRESET = 'unsigned';      // 👈 your unsigned upload preset
const FOLDER = 'vendor_logos';         // 👈 optional folder for organization

export const POST: APIRoute = async ({ request }) => {
  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return new Response(JSON.stringify({ error: 'No file uploaded' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Prepare data for Cloudinary upload
  const uploadForm = new FormData();
  uploadForm.append('file', file);
  uploadForm.append('upload_preset', UPLOAD_PRESET);
  uploadForm.append('folder', FOLDER);
  uploadForm.append('transformation', JSON.stringify([
    {
      width: 300,
      height: 300,
      crop: 'fill',
      gravity: 'auto',
      quality: 'auto',
      fetch_format: 'auto'
    }
  ]));

  try {
    const cloudRes = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: uploadForm,
      }
    );

    if (!cloudRes.ok) {
      const err = await cloudRes.text();
      console.error('Cloudinary upload failed:', err);
      return new Response(JSON.stringify({ error: 'Cloudinary upload failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await cloudRes.json();

    // Construct optimized image URL (auto-format, auto-quality)
    const optimizedUrl = data.secure_url.replace(
      '/upload/',
      '/upload/q_auto,f_auto,c_fill,g_auto,w_300,h_300/'
    );

    return new Response(JSON.stringify({ url: optimizedUrl }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Unexpected upload error:', error);
    return new Response(JSON.stringify({ error: 'Unexpected error during upload' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
