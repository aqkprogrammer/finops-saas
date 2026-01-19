import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  createUser,
  verifyPassword,
  signJWT,
} from '../../services/auth-service.js';

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export default async function authRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/v1/auth/signup
   * Create a new user account
   */
  fastify.post('/signup', {
    schema: {
      description: 'Create a new user account',
      tags: ['auth'],
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            token: { type: 'string' },
            userId: { type: 'string' },
            email: { type: 'string' },
          },
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
            details: { type: 'array' },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const body = signupSchema.parse(request.body);
      const user = await createUser(body.email, body.password);

      const jwtToken = signJWT({
        userId: user.id,
        email: user.email,
      });

      return reply.status(200).send({
        token: jwtToken,
        userId: user.id,
        email: user.email,
      });
    } catch (error) {
      fastify.log.error(error, 'Error signing up');

      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Invalid request',
          message: 'Invalid email or password',
          details: error.errors,
        });
      }

      if (error instanceof Error && error.message === 'User already exists') {
        return reply.status(400).send({
          error: 'User already exists',
          message: 'An account with this email already exists',
        });
      }

      return reply.status(500).send({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  });

  /**
   * POST /api/v1/auth/login
   * Login with email and password
   */
  fastify.post('/login', {
    schema: {
      description: 'Login with email and password',
      tags: ['auth'],
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            token: { type: 'string' },
            userId: { type: 'string' },
            email: { type: 'string' },
          },
        },
        401: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            details: { type: 'array' },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const body = loginSchema.parse(request.body);
      const user = await verifyPassword(body.email, body.password);

      if (!user) {
        return reply.status(401).send({
          error: 'Invalid credentials',
          message: 'Invalid email or password',
        });
      }

      const jwtToken = signJWT({
        userId: user.id,
        email: user.email,
      });

      return reply.status(200).send({
        token: jwtToken,
        userId: user.id,
        email: user.email,
      });
    } catch (error) {
      fastify.log.error(error, 'Error logging in');

      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Invalid request',
          details: error.errors,
        });
      }

      return reply.status(500).send({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  });
}
