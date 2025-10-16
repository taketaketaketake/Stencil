import type { APIRoute } from "astro";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db } from "../../../db/client";
import { vendors } from "../../../db/schema";
import "dotenv/config"; // ensures .env is loaded in dev or production

export const POST: APIRoute = async ({ request }) => {
  try {
    // Load and validate JWT secret
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      console.error("❌ Missing JWT_SECRET in .env");
      return new Response(
        JSON.stringify({ error: "Server misconfiguration: missing JWT_SECRET" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Parse request body
    const { email, password } = await request.json();
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
    const token = jwt.sign({ vendorId: user.id.toString() }, JWT_SECRET, {
      expiresIn: "7d",
    });

    // Respond with token
    return new Response(JSON.stringify({ token }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Login error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
