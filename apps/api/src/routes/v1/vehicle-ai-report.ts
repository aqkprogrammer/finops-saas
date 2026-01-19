import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { vehicleAiReportService } from '../../services/vehicle-ai-report-service.js';
import { ReportStatus } from '@prisma/client';

const createReportSchema = z.object({
  aiModelVersion: z.string().optional(),
});

const updateReportSchema = z.object({
  trustScore: z.number().int().min(0).max(100).optional(),
  exteriorScore: z.number().int().min(0).max(100).optional(),
  engineScore: z.number().int().min(0).max(100).optional(),
  interiorScore: z.number().int().min(0).max(100).optional(),
  transmissionScore: z.number().int().min(0).max(100).optional(),
  highlightsJson: z.unknown().optional(),
  issuesJson: z.unknown().optional(),
  aiModelVersion: z.string().optional(),
  status: z.nativeEnum(ReportStatus).optional(),
  failureReason: z.string().optional(),
});

export default async function vehicleAiReportRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/v1/vehicle/:id/ai-report
   * Create a new AI report (PENDING status)
   */
  fastify.post('/:id/ai-report', {
    schema: {
      description: 'Create a new AI report for a vehicle (status: PENDING)',
      tags: ['vehicle-ai-report'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', description: 'Vehicle ID (UUID)' },
        },
      },
      body: {
        type: 'object',
        properties: {
          aiModelVersion: { type: 'string', description: 'AI model version used' },
        },
      },
      response: {
        201: {
          type: 'object',
          description: 'Created AI report',
          properties: {
            id: { type: 'string' },
            vehicleId: { type: 'string' },
            trustScore: { type: ['number', 'null'] },
            exteriorScore: { type: ['number', 'null'] },
            engineScore: { type: ['number', 'null'] },
            interiorScore: { type: ['number', 'null'] },
            transmissionScore: { type: ['number', 'null'] },
            highlightsJson: { type: 'object' },
            issuesJson: { type: 'object' },
            aiModelVersion: { type: ['string', 'null'] },
            status: { type: 'string', enum: ['PENDING', 'COMPLETED', 'FAILED'] },
            failureReason: { type: ['string', 'null'] },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' },
          },
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            details: { type: 'array' },
          },
        },
        500: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const params = z.object({
        id: z.string().uuid(),
      }).parse(request.params);

      const body = createReportSchema.parse(request.body || {});

      const report = await vehicleAiReportService.createReport({
        vehicleId: params.id,
        aiModelVersion: body.aiModelVersion,
      });

      return reply.status(201).send({
        ...report,
        createdAt: report.createdAt.toISOString(),
        updatedAt: report.updatedAt.toISOString(),
      });
    } catch (error) {
      fastify.log.error(error, 'Error creating AI report');

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

  /**
   * PATCH /api/v1/vehicle/:id/ai-report
   * Update AI report with analysis results
   */
  fastify.patch('/:id/ai-report', {
    schema: {
      description: 'Update AI report with analysis results or status',
      tags: ['vehicle-ai-report'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', description: 'Vehicle ID (UUID)' },
        },
      },
      body: {
        type: 'object',
        properties: {
          trustScore: { type: 'number', minimum: 0, maximum: 100 },
          exteriorScore: { type: 'number', minimum: 0, maximum: 100 },
          engineScore: { type: 'number', minimum: 0, maximum: 100 },
          interiorScore: { type: 'number', minimum: 0, maximum: 100 },
          transmissionScore: { type: 'number', minimum: 0, maximum: 100 },
          highlightsJson: { type: 'object' },
          issuesJson: { type: 'object' },
          aiModelVersion: { type: 'string' },
          status: { type: 'string', enum: ['PENDING', 'COMPLETED', 'FAILED'] },
          failureReason: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          description: 'Updated AI report',
          properties: {
            id: { type: 'string' },
            vehicleId: { type: 'string' },
            trustScore: { type: ['number', 'null'] },
            exteriorScore: { type: ['number', 'null'] },
            engineScore: { type: ['number', 'null'] },
            interiorScore: { type: ['number', 'null'] },
            transmissionScore: { type: ['number', 'null'] },
            highlightsJson: { type: 'object' },
            issuesJson: { type: 'object' },
            aiModelVersion: { type: ['string', 'null'] },
            status: { type: 'string', enum: ['PENDING', 'COMPLETED', 'FAILED'] },
            failureReason: { type: ['string', 'null'] },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' },
          },
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            details: { type: 'array' },
          },
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
        500: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const params = z.object({
        id: z.string().uuid(),
      }).parse(request.params);

      const body = updateReportSchema.parse(request.body || {});

      const report = await vehicleAiReportService.updateReport(params.id, body);

      return reply.status(200).send({
        ...report,
        createdAt: report.createdAt.toISOString(),
        updatedAt: report.updatedAt.toISOString(),
      });
    } catch (error) {
      fastify.log.error(error, 'Error updating AI report');

      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Invalid request',
          details: error.errors,
        });
      }

      // Handle Prisma not found error
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'P2025'
      ) {
        return reply.status(404).send({
          error: 'Report not found',
          message: `No AI report found for vehicle ${request.params.id}`,
        });
      }

      return reply.status(500).send({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  });

  /**
   * GET /api/v1/vehicle/:id/ai-report
   * Get stored AI report for a vehicle
   */
  fastify.get('/:id/ai-report', {
    schema: {
      description: 'Get stored AI report for a vehicle',
      tags: ['vehicle-ai-report'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', description: 'Vehicle ID (UUID)' },
        },
      },
      response: {
        200: {
          type: 'object',
          description: 'AI report',
          properties: {
            id: { type: 'string' },
            vehicleId: { type: 'string' },
            trustScore: { type: ['number', 'null'] },
            exteriorScore: { type: ['number', 'null'] },
            engineScore: { type: ['number', 'null'] },
            interiorScore: { type: ['number', 'null'] },
            transmissionScore: { type: ['number', 'null'] },
            highlightsJson: { type: 'object' },
            issuesJson: { type: 'object' },
            aiModelVersion: { type: ['string', 'null'] },
            status: { type: 'string', enum: ['PENDING', 'COMPLETED', 'FAILED'] },
            failureReason: { type: ['string', 'null'] },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' },
          },
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
        500: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const params = z.object({
        id: z.string().uuid(),
      }).parse(request.params);

      const report = await vehicleAiReportService.getReport(params.id);

      if (!report) {
        return reply.status(404).send({
          error: 'Report not found',
          message: `No AI report found for vehicle ${params.id}`,
        });
      }

      return reply.status(200).send({
        ...report,
        createdAt: report.createdAt.toISOString(),
        updatedAt: report.updatedAt.toISOString(),
      });
    } catch (error) {
      fastify.log.error(error, 'Error getting AI report');

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
