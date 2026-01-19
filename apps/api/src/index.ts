// Load environment variables from .env file first
import 'dotenv/config';

import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { env } from './config/env.js';
import { errorHandler } from './plugins/error-handler.js';
import v1Routes from './routes/v1/index.js';

const fastify = Fastify({
  logger: {
    level: env.LOG_LEVEL,
  },
});

// Register plugins
await fastify.register(cors, {
  origin: true,
});

await fastify.register(helmet);

// Register Swagger
await fastify.register(swagger, {
  openapi: {
    info: {
      title: 'FinOpsGuard API',
      description: 'API documentation for FinOpsGuard - AWS cost optimization and analysis',
      version: '1.0.0',
    },
    servers: [
      {
        url: `http://${env.HOST}:${env.PORT}`,
        description: 'Development server',
      },
    ],
    tags: [
      { name: 'health', description: 'Health check endpoints' },
      { name: 'scan', description: 'AWS scan and cost analysis endpoints' },
      { name: 'subscription', description: 'Subscription and customer management endpoints' },
      { name: 'vehicle-ai-report', description: 'Vehicle AI analysis report endpoints' },
      { name: 'admin', description: 'Admin-only endpoints' },
    ],
  },
});

await fastify.register(swaggerUi, {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: false,
  },
  staticCSP: true,
  transformStaticCSP: (header: string) => header,
});

// Error handler
fastify.setErrorHandler(errorHandler);

// API versioning
await fastify.register(v1Routes, { prefix: '/api/v1' });

// Root health check (for backwards compatibility)
fastify.get('/health', {
  schema: {
    description: 'Root health check endpoint (backwards compatibility)',
    tags: ['health'],
    response: {
      200: {
        type: 'object',
        properties: {
          status: { type: 'string' },
          service: { type: 'string' },
        },
      },
    },
  },
}, async () => {
  return { status: 'ok', service: 'finopsguard-api' };
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: env.PORT, host: env.HOST });
    fastify.log.info(`🚀 API server running on http://${env.HOST}:${env.PORT}`);
    fastify.log.info(`📝 Environment: ${env.NODE_ENV}`);
    fastify.log.info(`🔗 Health check: http://${env.HOST}:${env.PORT}/api/v1/health`);
    fastify.log.info(`📚 Swagger docs: http://${env.HOST}:${env.PORT}/docs`);
    
    // Log AWS mode
    if (env.MOCK_AWS) {
      fastify.log.info(`🧪 AWS Mode: MOCK (using mock data for testing)`);
    } else {
      fastify.log.info(`☁️  AWS Mode: REAL (using AWS SDK)`);
    }
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
