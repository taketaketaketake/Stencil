import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db } from '../../../db/client';
import { vendors } from '../../../db/schema';
import bcrypt from 'bcryptjs';

export const post: APIRoute = async ({ request }) => {
  const { name, email, password } = await request.json();
  // check for existing
  const exists = await db.select().from(vendors).where(eq(vendors.email, email)).get();
  if (exists) {
    return new Response('Email already in use', { status: 409 });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  await db.insert(vendors).values({ name, email, passwordHash });
  return new Response('Created', { status: 201 });
};
