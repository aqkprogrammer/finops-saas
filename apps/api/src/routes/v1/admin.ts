import { FastifyInstance } from 'fastify';
import { adminMiddleware } from '../../plugins/admin.js';
import { getAllAdminMetrics } from '../../services/admin-metrics-service.js';

export default async function adminRoutes(fastify: FastifyInstance) {
  fastify.get('/metrics', {
    preHandler: [adminMiddleware],
    schema: {
      description: 'Get admin metrics (admin only)',
      tags: ['admin'],
      response: {
        200: {
          type: 'object',
          properties: {
            totalUsers: { type: 'number' },
            newUsersLast7Days: { type: 'number' },
            totalScans: { type: 'number' },
            scansLast24Hours: { type: 'number' },
            scansLast7Days: { type: 'number' },
            failedScansCount: { type: 'number' },
            activeSubscriptions: { type: 'number' },
            canceledSubscriptions: { type: 'number' },
            freeUsers: { type: 'number' },
            paidUsers: { type: 'number' },
            averageScansPerUser: { type: 'number' },
            usersWithAtLeastOneScanPercent: { type: 'number' },
          },
        },
        403: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (_request, reply) => {
    try {
      const metrics = await getAllAdminMetrics();
      return reply.status(200).send(metrics);
    } catch (error) {
      fastify.log.error(error, 'Error fetching admin metrics');
      return reply.status(500).send({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  });
}
