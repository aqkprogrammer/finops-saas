import { FastifyInstance } from 'fastify';
import healthRoutes from './health.js';
import scanRoutes from './scan.js';
import scansRoutes from './scans.js';
import subscriptionRoutes from './subscription.js';
import vehicleAiReportRoutes from './vehicle-ai-report.js';
import authRoutes from './auth.js';
import adminRoutes from './admin.js';

export default async function v1Routes(fastify: FastifyInstance) {
  await fastify.register(healthRoutes, { prefix: '/health' });
  await fastify.register(authRoutes, { prefix: '/auth' });
  await fastify.register(scanRoutes, { prefix: '/scan' });
  await fastify.register(scansRoutes, { prefix: '/scans' });
  await fastify.register(subscriptionRoutes, { prefix: '/subscription' });
  await fastify.register(vehicleAiReportRoutes, { prefix: '/vehicle' });
  await fastify.register(adminRoutes, { prefix: '/admin' });
}
