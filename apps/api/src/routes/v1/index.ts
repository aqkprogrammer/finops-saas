import { FastifyInstance } from 'fastify';
import healthRoutes from './health';
import scanRoutes from './scan';
import scansRoutes from './scans';
import subscriptionRoutes from './subscription';
import vehicleAiReportRoutes from './vehicle-ai-report';
import authRoutes from './auth';
import adminRoutes from './admin';

export default async function v1Routes(fastify: FastifyInstance) {
  await fastify.register(healthRoutes, { prefix: '/health' });
  await fastify.register(authRoutes, { prefix: '/auth' });
  await fastify.register(scanRoutes, { prefix: '/scan' });
  await fastify.register(scansRoutes, { prefix: '/scans' });
  await fastify.register(subscriptionRoutes, { prefix: '/subscription' });
  await fastify.register(vehicleAiReportRoutes, { prefix: '/vehicle' });
  await fastify.register(adminRoutes, { prefix: '/admin' });
}
