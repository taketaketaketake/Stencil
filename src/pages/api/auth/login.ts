import type { APIRoute } from "astro";
import bcrypt from "bcryptjs";
import { signToken } from "../../../utils/jwt";
import { eq } from "drizzle-orm";
import { db } from "../../../db/client";
import { vendors } from "../../../db/schema";
import "dotenv/config"; // ensures .env is loaded in dev or production

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      console.error("JSON parsing error:", jsonError);
      return new Response(JSON.stringify({ error: "Invalid JSON in request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    const { email, password } = body;
    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email and password required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Find vendor in database
    const user = await db
      .select()
      .from(vendors)
      .where(eq(vendors.email, email))
      .get();

    if (!user) {
      return new Response(JSON.stringify({ error: "Invalid credentials" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate password
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return new Response(JSON.stringify({ error: "Invalid credentials" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Generate JWT token
    const token = signToken(user.id.toString());

    // Set token as httpOnly cookie and also return in response
    return new Response(JSON.stringify({ token }), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        "Set-Cookie": `token=${token}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax`
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
