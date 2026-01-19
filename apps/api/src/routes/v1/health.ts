import { FastifyInstance } from 'fastify';

export default async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/', {
    schema: {
      description: 'Health check endpoint',
      tags: ['health'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            service: { type: 'string' },
            version: { type: 'string' },
            timestamp: { type: 'string' },
            uptime: { type: 'number' },
            mockMode: { type: 'boolean' },
          },
        },
      },
    },
  }, async () => {
    const { env } = await import('../../config/env.js');
    return {
      status: 'ok',
      service: 'finopsguard-api',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      mockMode: env.MOCK_AWS || false,
    };
  });

  fastify.get('/ready', {
    schema: {
      description: 'Readiness check endpoint',
      tags: ['health'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            checks: {
              type: 'object',
              properties: {
                api: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, async () => {
    // Add readiness checks here (database, external services, etc.)
    return {
      status: 'ready',
      checks: {
        api: 'ok',
      },
    };
  });

  fastify.get('/live', {
    schema: {
      description: 'Liveness probe endpoint',
      tags: ['health'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
          },
        },
      },
    },
  }, async () => {
    // Liveness probe - just return ok if process is running
    return {
      status: 'alive',
    };
  });
}
