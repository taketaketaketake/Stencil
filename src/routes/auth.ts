import { FastifyPluginAsync } from 'fastify';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { vendors } from '../db/schema.js';
import { signToken } from '../utils/jwt.js';
import {
  loginRequestSchema,
  loginResponseSchema,
  registerRequestSchema,
  registerResponseSchema,
  type LoginRequest,
  type RegisterRequest
} from '../schemas/auth.js';

const authRoutes: FastifyPluginAsync = async (fastify) => {
  
  // POST /api/auth/login
  fastify.post('/auth/login', {
    schema: {
      body: loginRequestSchema,
      response: loginResponseSchema
    }
  }, async (request, reply) => {
    try {
      const { email, password } = request.body as LoginRequest;

      // Find vendor in database
      const user = await fastify.db
        .select()
        .from(vendors)
        .where(eq(vendors.email, email))
        .get();

      if (!user) {
        return reply.status(401).send({ error: 'Invalid credentials' });
      }

      // Validate password
      const validPassword = await bcrypt.compare(password, user.passwordHash);
      if (!validPassword) {
        return reply.status(401).send({ error: 'Invalid credentials' });
      }

      // Generate JWT token
      const token = signToken(user.id.toString());

      // Set token as httpOnly cookie
      reply.setCookie('token', token, {
        httpOnly: true,
        path: '/',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      });

      return reply.send({ token });

    } catch (error: any) {
      fastify.log.error('Login error:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // POST /api/auth/register
  fastify.post('/auth/register', {
    schema: {
      body: registerRequestSchema,
      response: registerResponseSchema
    }
  }, async (request, reply) => {
    try {
      const { name, email, password } = request.body as RegisterRequest;

      // Check for existing vendor
      const exists = await fastify.db
        .select()
        .from(vendors)
        .where(eq(vendors.email, email))
        .get();

      if (exists) {
        return reply.status(409).send({ error: 'Email already in use' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create vendor
      await fastify.db.insert(vendors).values({
        name,
        email,
        passwordHash
      });

      return reply.status(201).send({ message: 'Account created successfully' });

    } catch (error: any) {
      fastify.log.error('Registration error:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  fastify.log.info('Auth routes registered: /auth/login, /auth/register');
};

export default authRoutes;