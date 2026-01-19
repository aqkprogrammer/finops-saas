import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../../plugins/auth.js';
import { prisma } from '../../db/prisma.js';

export default async function scansRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/v1/scans
   * List scans for authenticated user
   */
  fastify.get('/', {
    preHandler: [authMiddleware],
    schema: {
      description: 'List scans for authenticated user',
      tags: ['scan'],
      response: {
        200: {
          type: 'object',
          properties: {
            scans: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  scanId: { type: 'string' },
                  status: { type: 'string' },
                  createdAt: { type: 'string' },
                  totalCost: { type: 'number' },
                  totalSavings: { type: 'number' },
                },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    if (!request.user) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    const customerId = request.user.userId;
    
    fastify.log.debug({ customerId, userId: request.user.userId, email: request.user.email }, 'Fetching scans for user');
    
    const dbScans = await prisma.scan.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        scanId: true,
        createdAt: true,
        costSummary: true,
        savings: true,
        customerId: true,
      },
    });

    type DbScan = { scanId: string; customerId: string | null; createdAt: Date; costSummary: unknown; savings: unknown };
    fastify.log.debug({ 
      customerId, 
      scanCount: dbScans.length,
      scanIds: dbScans.map((s: DbScan) => s.scanId),
      scanCustomerIds: dbScans.map((s: DbScan) => s.customerId),
    }, 'Found scans');

    const scans = dbScans.map((scan: DbScan) => ({
      scanId: scan.scanId,
      status: 'completed' as const,
      createdAt: scan.createdAt.toISOString(),
      totalCost: (scan.costSummary as { totalCost?: number })?.totalCost || 0,
      totalSavings: (scan.savings as { totalMonthlySavings?: number })?.totalMonthlySavings || 0,
    }));

    return reply.status(200).send({ scans });
  });
}
