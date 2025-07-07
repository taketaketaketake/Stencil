import type { APIRoute } from 'astro';
import bcrypt from 'bcryptjs';
import { sign } from 'jsonwebtoken';
import { db } from '../../../db/client';
import { vendors } from '../../../db/schema';

const JWT_SECRET = process.env.JWT_SECRET!;

export const post: APIRoute = async ({ request }) => {
  const { email, password } = await request.json();
  const user = await db.select().from(vendors).where(vendors.email.eq(email)).get();
  if (!user) {
    return new Response('Invalid credentials', { status: 401 });
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return new Response('Invalid credentials', { status: 401 });
  }
  const token = sign({ vendorId: user.id.toString() }, JWT_SECRET, { expiresIn: '7d' });
  return new Response(JSON.stringify({ token }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
