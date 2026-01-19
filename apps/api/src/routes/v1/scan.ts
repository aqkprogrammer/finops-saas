import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ScanService } from '../../services/scan-service.js';
import { scanStorage } from '../../storage/scan-storage.js';
import { ReportGenerator } from '../../services/report-generator.js';
import { subscriptionService } from '../../services/subscription-service.js';
import { AssumeRoleError } from '@finopsguard/aws-client';
import { authMiddleware } from '../../plugins/auth.js';
import { prisma } from '../../db/prisma.js';

// Request schema for scan run
const scanRunRequestSchema = z.object({
  region: z.string().min(1),
  roleArn: z.string().min(1).regex(/^arn:aws:iam::\d+:role\/.+/, {
    message: 'Invalid IAM Role ARN format. Must be: arn:aws:iam::ACCOUNT_ID:role/ROLE_NAME',
  }),
  externalId: z.string().optional(),
  includeMetrics: z.boolean().optional().default(true),
});

export default async function scanRoutes(fastify: FastifyInstance) {
  const scanService = new ScanService();
  const reportGenerator = new ReportGenerator();

  /**
   * POST /api/v1/scan/run
   * Run a complete FinOps scan
   */
  fastify.post('/run', {
      preHandler: [authMiddleware],
      schema: {
        description: 'Run a complete FinOps scan of AWS resources using IAM role assumption',
        tags: ['scan'],
        body: {
          type: 'object',
          required: ['region', 'roleArn'],
          properties: {
            region: { type: 'string', description: 'AWS region to scan' },
            roleArn: { 
              type: 'string', 
              description: 'IAM Role ARN to assume (format: arn:aws:iam::ACCOUNT_ID:role/ROLE_NAME)',
              pattern: '^arn:aws:iam::\\d+:role/.+',
            },
            externalId: { 
              type: 'string', 
              description: 'External ID for role assumption (optional, recommended for security)' 
            },
            includeMetrics: { type: 'boolean', default: true, description: 'Include CloudWatch metrics' },
          },
        },
      response: {
        200: {
          type: 'object',
          properties: {
            scanId: { type: 'string' },
            timestamp: { type: 'string' },
            summary: { type: 'object' },
            customerId: { type: 'string' },
            hasFullAccess: { type: 'boolean' },
            freeScanUsed: { type: 'boolean' },
          },
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            details: { type: 'array' },
          },
        },
        403: {
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
      // Validate request body
      let body;
      try {
        body = scanRunRequestSchema.parse(request.body);
        fastify.log.debug({ body: { region: body.region, roleArn: body.roleArn } }, 'Request body validated');
      } catch (validationError) {
        fastify.log.error({ error: validationError, body: request.body }, 'Request validation failed');
        throw validationError;
      }

      // Use authenticated user ID as customerId
      if (!request.user) {
        return reply.status(401).send({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
      }

      const customerId = request.user.userId;
      fastify.log.debug({ customerId, email: request.user.email }, 'Using authenticated user as customer');

      // Check if customer has access
      let hasFullAccess: boolean;
      let canUseFreeScan: boolean;
      try {
        hasFullAccess = subscriptionService.hasFullAccess(customerId);
        canUseFreeScan = await subscriptionService.canUseFreeScan(customerId);
        fastify.log.debug({ customerId, hasFullAccess, canUseFreeScan }, 'Access check completed');
      } catch (accessError) {
        fastify.log.error({ error: accessError, customerId }, 'Error checking customer access');
        throw new Error(`Failed to check customer access: ${accessError instanceof Error ? accessError.message : 'Unknown error'}`);
      }

      if (!hasFullAccess && !canUseFreeScan) {
        return reply.status(403).send({
          error: 'Subscription required',
          message: 'You have used your free scan. Please subscribe to continue.',
          customerId,
        });
      }

      // Run the scan using IAM role assumption
      let scanResult;
      try {
        scanResult = await scanService.runScan({
          region: body.region,
          roleArn: body.roleArn,
          externalId: body.externalId,
          includeMetrics: body.includeMetrics,
        });
        
        // Validate scan result structure
        if (!scanResult || !scanResult.scanId) {
          throw new Error('Scan completed but result is invalid: missing scanId');
        }
        if (!scanResult.timestamp || !(scanResult.timestamp instanceof Date)) {
          throw new Error('Scan completed but result is invalid: missing or invalid timestamp');
        }
        if (!Array.isArray(scanResult.issues)) {
          throw new Error('Scan completed but result is invalid: issues is not an array');
        }
        if (!scanResult.costSummary || typeof scanResult.costSummary.totalCost !== 'number') {
          throw new Error('Scan completed but result is invalid: missing or invalid costSummary');
        }
        if (!scanResult.savings || typeof scanResult.savings.totalMonthlySavings !== 'number') {
          throw new Error('Scan completed but result is invalid: missing or invalid savings');
        }
        
        fastify.log.info({ 
          scanId: scanResult.scanId,
          region: scanResult.region,
          issuesCount: scanResult.issues.length,
          totalCost: scanResult.costSummary.totalCost,
          monthlySavings: scanResult.savings.totalMonthlySavings,
          hasCostData: scanResult.costSummary.totalCost > 0
        }, 'Scan completed successfully');
      } catch (scanError) {
        const errorMessage = scanError instanceof Error ? scanError.message : 'Unknown scan error';
        fastify.log.error({ 
          error: scanError, 
          customerId,
          errorMessage
        }, 'Scan execution failed');
        throw scanError;
      }

      // Note: We no longer need to mark free scan as used in memory storage
      // because canUseFreeScan now checks the database for existing scans
      // The scan will be stored below with the customerId, which will be used
      // to determine if they've used their free scan on subsequent checks

      // Store scan result with customer ID
      try {
        await scanStorage.store(scanResult, customerId);
        
        // Verify it was stored with correct customerId
        const storedScan = await scanStorage.get(scanResult.scanId);
        if (!storedScan) {
          const allScans = await scanStorage.list();
          fastify.log.error({ 
            scanId: scanResult.scanId,
            availableScans: allScans.map(s => s.scanId)
          }, 'Scan was not stored successfully - verification failed');
          return reply.status(500).send({
            error: 'Storage verification failed',
            message: 'Scan completed but could not be verified in storage',
            scanId: scanResult.scanId,
          });
        }
        
        // Verify customerId was stored correctly
        const storedDbScan = await prisma.scan.findUnique({
          where: { scanId: scanResult.scanId },
          select: { customerId: true },
        });
        
        if (storedDbScan?.customerId !== customerId) {
          fastify.log.error({ 
            scanId: scanResult.scanId,
            expectedCustomerId: customerId,
            storedCustomerId: storedDbScan?.customerId,
          }, 'Scan stored with incorrect customerId');
        }
        
        const allScans = await scanStorage.list();
        fastify.log.info({ 
          scanId: scanResult.scanId, 
          customerId,
          storedCustomerId: storedDbScan?.customerId,
          storedScanCount: allScans.length,
          issuesCount: scanResult.issues.length,
          totalCost: scanResult.costSummary.totalCost,
          verified: true
        }, 'Scan stored and verified successfully');
      } catch (storageError) {
        const errorMessage = storageError instanceof Error ? storageError.message : 'Unknown storage error';
        fastify.log.error({ 
          error: storageError, 
          scanId: scanResult.scanId,
          errorMessage
        }, 'Failed to store scan');
        return reply.status(500).send({
          error: 'Storage error',
          message: errorMessage,
          scanId: scanResult.scanId,
        });
      }

      // Generate summary
      let summary;
      try {
        summary = scanService.toSummary(scanResult);
      } catch (summaryError) {
        fastify.log.warn({ 
          error: summaryError, 
          scanId: scanResult.scanId 
        }, 'Failed to generate summary, using fallback');
        // Fallback summary if generation fails
        summary = {
          totalCost: scanResult.costSummary?.totalCost || 0,
          potentialSavings: scanResult.savings?.totalMonthlySavings || 0,
          issues: scanResult.issues || [],
        };
      }

      // Return response with proper serialization
      const response = {
        scanId: scanResult.scanId,
        timestamp: scanResult.timestamp.toISOString(),
        summary,
        customerId,
        hasFullAccess,
        freeScanUsed: !hasFullAccess,
      };

      fastify.log.debug({ 
        scanId: scanResult.scanId,
        responseKeys: Object.keys(response),
        summaryKeys: Object.keys(summary)
      }, 'Sending scan response');

      return reply.status(200).send(response);
    } catch (error) {
      // Log detailed error information
      const errorDetails = {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        } : error,
        errorType: error?.constructor?.name || typeof error,
        isZodError: error instanceof z.ZodError,
        isAssumeRoleError: error instanceof AssumeRoleError,
      };
      
      fastify.log.error(errorDetails, 'Error running scan');

      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Invalid request',
          details: error.errors,
        });
      }

      // Handle AssumeRoleError (from our assumeRole function)
      if (error instanceof AssumeRoleError) {
        const arErr = error as AssumeRoleError;
        const statusCode = arErr.code === 'InvalidRoleArn' || arErr.code === 'MalformedPolicy' 
          ? 400 
          : 403;
        return reply.status(statusCode).send({
          error: 'Failed to assume IAM role',
          message: arErr.message,
          code: arErr.code,
        });
      }

      // Handle AWS-specific errors
      if (error && typeof error === 'object' && 'name' in error) {
        const awsError = error as { name: string; message: string };
        
        if (awsError.name === 'AccessDenied' || awsError.name === 'UnauthorizedOperation') {
          return reply.status(403).send({
            error: 'AWS access denied',
            message: awsError.message,
          });
        }

        if (awsError.name === 'DataUnavailableException') {
          return reply.status(503).send({
            error: 'Cost data unavailable',
            message: awsError.message,
          });
        }
      }

      // Return detailed error in development, generic in production
      const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
      return reply.status(500).send({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        ...(isDevelopment && {
          details: errorDetails,
          stack: error instanceof Error ? error.stack : undefined,
        }),
      });
    }
  });

  /**
   * GET /api/v1/scan
   * List all scan results
   */
  fastify.get('/', {
    schema: {
      description: 'List all scan results',
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
                  timestamp: { type: 'string' },
                  region: { type: 'string' },
                  summary: { type: 'object' },
                },
              },
            },
            count: { type: 'number' },
          },
        },
      },
    },
  }, async (_request, reply) => {
    const scans = await scanStorage.list();
    
    return reply.status(200).send({
      scans: scans.map((scan) => ({
        scanId: scan.scanId,
        timestamp: scan.timestamp.toISOString(),
        region: scan.region,
        summary: scanService.toSummary(scan),
      })),
      count: scans.length,
    });
  });

  /**
   * GET /api/v1/scan/:scanId/debug
   * Debug endpoint to inspect scan data (development only)
   */
  fastify.get('/:scanId/debug', {
    schema: {
      description: 'Debug scan data (development only)',
      tags: ['scan'],
    },
  }, async (request, reply) => {
    const params = z.object({
      scanId: z.string().min(1),
    }).parse(request.params);

    const scanResult = await scanStorage.get(params.scanId);
    const allScans = await scanStorage.list();
    
    return reply.status(200).send({
      requestedScanId: params.scanId,
      scanExists: !!scanResult,
      scanKeys: scanResult ? Object.keys(scanResult) : [],
      scanType: scanResult ? typeof scanResult : 'null',
      scanStringified: scanResult ? JSON.stringify(scanResult, null, 2) : 'null',
      scanRaw: scanResult,
      allScanIds: allScans.map(s => s.scanId),
      scanCount: allScans.length,
    });
  });

  /**
   * GET /api/v1/scan/:scanId/report
   * Generate HTML cost optimization report for a scan
   * Note: This route must be registered before /:scanId to avoid route conflicts
   */
  fastify.get('/:scanId/report', {
    schema: {
      description: 'Generate HTML cost optimization report for a scan',
      tags: ['scan'],
      params: {
        type: 'object',
        required: ['scanId'],
        properties: {
          scanId: { type: 'string', description: 'Scan ID' },
        },
      },
      querystring: {
        type: 'object',
        properties: {
          companyName: { type: 'string', description: 'Company name for the report' },
          reportTitle: { type: 'string', description: 'Custom report title' },
        },
      },
      response: {
        200: {
          type: 'string',
          description: 'HTML report',
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            scanId: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const params = z.object({
        scanId: z.string(),
      }).parse(request.params);

      const query = z.object({
        companyName: z.string().optional(),
        reportTitle: z.string().optional(),
      }).parse(request.query);

      const scanResult = await scanStorage.get(params.scanId);

      if (!scanResult) {
        return reply.status(404).send({
          error: 'Scan not found',
          scanId: params.scanId,
        });
      }

      const htmlReport = reportGenerator.generateReport(scanResult, {
        companyName: query.companyName,
        reportTitle: query.reportTitle,
      });

      return reply
        .status(200)
        .type('text/html')
        .send(htmlReport);
    } catch (error) {
      fastify.log.error(error, 'Error generating report');

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
   * GET /api/v1/scan/:scanId
   * Get a specific scan result (gated by subscription)
   */
  fastify.get('/:scanId', {
    preHandler: [authMiddleware],
    schema: {
      description: 'Get a specific scan result. Returns limited data for free users.',
      tags: ['scan'],
      params: {
        type: 'object',
        required: ['scanId'],
        properties: {
          scanId: { type: 'string', description: 'Scan ID' },
        },
      },
      response: {
        200: {
          type: 'object',
          description: 'Scan result (full or limited based on subscription)',
          // Use additionalProperties to allow any properties since the response structure varies
          additionalProperties: true,
        },
        403: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            scanId: { type: 'string' },
            message: { type: 'string' },
            availableScans: {
              type: 'array',
              items: { type: 'string' },
            },
          },
        },
        500: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
            scanId: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    let params: { scanId: string } | undefined;
    try {
      params = z.object({
        scanId: z.string().min(1),
      }).parse(request.params);

      fastify.log.info({ 
        url: request.url,
        method: request.method,
        params: request.params,
        query: request.query 
      }, 'GET scan request received');

      if (!request.user) {
        return reply.status(401).send({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
      }

      // Retrieve scan result
      const scanResult = await scanStorage.get(params.scanId);
      
      // Log retrieval attempt for debugging
      const allScans = await scanStorage.list();
      const scanResultKeys = scanResult ? Object.keys(scanResult) : [];
      fastify.log.info({ 
        requestedScanId: params.scanId,
        storedScanIds: allScans.map(s => s.scanId),
        scanCount: allScans.length,
        hasScanResult: !!scanResult,
        scanResultKeys,
        scanResultType: scanResult ? typeof scanResult : 'null',
        scanResultValue: scanResult ? JSON.stringify(scanResult).substring(0, 200) : 'null',
        scanResultIsEmpty: scanResult && scanResultKeys.length === 0,
        scanResultStringified: scanResult ? JSON.stringify(scanResult) : 'null'
      }, 'Retrieving scan result');

      // Check if scan doesn't exist or is null/undefined
      if (!scanResult || scanResult === null || scanResult === undefined) {
        fastify.log.warn({ 
          requestedScanId: params.scanId,
          availableScans: allScans.map(s => s.scanId)
        }, 'Scan not found');
        return reply.status(404).send({
          error: 'Scan not found',
          message: `Scan ${params.scanId} was not found. This may happen if the server was restarted, as scans are currently stored in memory. Please run a new scan to generate fresh results.`,
          scanId: params.scanId,
          availableScans: allScans.map(s => s.scanId),
        });
      }

      // Validate scan result structure - check if it's an empty object or missing required fields
      if (scanResultKeys.length === 0 || (scanResultKeys.length === 1 && scanResultKeys[0] === 'constructor')) {
        fastify.log.error({ 
          scanId: params.scanId,
          message: 'Scan result is an empty object',
          scanResultKeys,
          scanResultStringified: JSON.stringify(scanResult),
          scanResultType: typeof scanResult,
          scanResultConstructor: scanResult?.constructor?.name
        }, 'Scan result is empty');
        return reply.status(404).send({
          error: 'Scan not found',
          message: `Scan ${params.scanId} was not found or is invalid. This may happen if the server was restarted, as scans are currently stored in memory. Please run a new scan to generate fresh results.`,
          scanId: params.scanId,
          availableScans: allScans.map(s => s.scanId),
        });
      }

      if (!scanResult.scanId || !scanResult.timestamp || !scanResult.region) {
        fastify.log.error({ 
          scanId: params.scanId,
          scanResultKeys: scanResultKeys,
          scanResultValues: scanResultKeys.reduce((acc, key) => {
            acc[key] = typeof scanResult[key as keyof typeof scanResult];
            return acc;
          }, {} as Record<string, string>),
          hasScanId: !!scanResult.scanId,
          hasTimestamp: !!scanResult.timestamp,
          hasRegion: !!scanResult.region,
          scanResultStringified: JSON.stringify(scanResult, null, 2).substring(0, 500)
        }, 'Scan result is malformed - missing required fields');
        return reply.status(500).send({
          error: 'Invalid scan data',
          message: 'Scan result exists but is missing required fields. This may indicate a storage issue.',
          scanId: params.scanId,
          availableFields: scanResultKeys,
        });
      }

      // Log scan result structure for debugging
      fastify.log.debug({ 
        scanId: params.scanId,
        hasCostSummary: !!scanResult.costSummary,
        hasResourceInventory: !!scanResult.resourceInventory,
        hasIssues: Array.isArray(scanResult.issues),
        issuesCount: Array.isArray(scanResult.issues) ? scanResult.issues.length : 0,
        hasSavings: !!scanResult.savings,
        timestampType: typeof scanResult.timestamp,
        timestampIsDate: scanResult.timestamp instanceof Date
      }, 'Scan result structure validated');

      // Check ownership - user can only access their own scans
      const scanCustomerId = await scanStorage.getCustomerId(params.scanId);
      const authenticatedUserId = request.user.userId;

      if (scanCustomerId !== authenticatedUserId) {
        return reply.status(403).send({
          error: 'Access denied',
          message: 'This scan does not belong to you',
        });
      }

      const hasFullAccess = subscriptionService.hasFullAccess(authenticatedUserId);
        
      if (!hasFullAccess) {
        // Return limited results for free users
        try {
            // Ensure timestamp is properly converted
            const timestamp = scanResult.timestamp instanceof Date 
              ? scanResult.timestamp.toISOString()
              : typeof scanResult.timestamp === 'string'
              ? scanResult.timestamp
              : new Date(scanResult.timestamp).toISOString();

            const limitedResponse = {
              scanId: scanResult.scanId,
              timestamp,
              region: scanResult.region,
              costSummary: {
                totalCost: scanResult.costSummary?.totalCost || 0,
                currency: scanResult.costSummary?.currency || 'USD',
                period: scanResult.costSummary?.period || {},
              },
              savings: {
                totalMonthlySavings: scanResult.savings?.totalMonthlySavings || 0,
                totalAnnualSavings: scanResult.savings?.totalAnnualSavings || 0,
              },
              issues: Array.isArray(scanResult.issues) ? scanResult.issues.slice(0, 3) : [],
              limited: true,
              message: 'Subscribe to see all issues and full details',
            };

          return reply.status(200).send(limitedResponse);
        } catch (limitedError) {
          fastify.log.error({ 
            error: limitedError,
            scanId: params.scanId
          }, 'Error serializing limited scan result');
          return reply.status(500).send({
            error: 'Serialization error',
            message: 'Failed to serialize scan result',
            scanId: params.scanId,
          });
        }
      }

      // Full access - convert Date objects to ISO strings for JSON serialization
      try {
        // Ensure timestamp is properly converted
        let timestamp: string;
        try {
          if (scanResult.timestamp instanceof Date) {
            timestamp = scanResult.timestamp.toISOString();
          } else if (typeof scanResult.timestamp === 'string') {
            timestamp = scanResult.timestamp;
          } else if (scanResult.timestamp) {
            timestamp = new Date(scanResult.timestamp).toISOString();
          } else {
            timestamp = new Date().toISOString(); // Fallback to current time
            fastify.log.warn({ scanId: params.scanId }, 'Timestamp missing, using current time');
          }
        } catch (timestampError) {
          timestamp = new Date().toISOString();
          fastify.log.warn({ scanId: params.scanId, error: timestampError }, 'Failed to parse timestamp, using current time');
        }

        // Build response with defensive checks
        const response: Record<string, any> = {
          scanId: scanResult.scanId || params.scanId,
          timestamp,
          region: scanResult.region || 'unknown',
        };

        // Add costSummary if it exists and is valid
        if (scanResult.costSummary && typeof scanResult.costSummary === 'object') {
          response.costSummary = scanResult.costSummary;
        } else {
          response.costSummary = {
            totalCost: 0,
            currency: 'USD',
            period: { start: '', end: '', days: 0 },
            services: [],
          };
          fastify.log.warn({ scanId: params.scanId }, 'CostSummary missing or invalid, using defaults');
        }

        // Add resourceInventory if it exists and is valid
        if (scanResult.resourceInventory && typeof scanResult.resourceInventory === 'object') {
          response.resourceInventory = scanResult.resourceInventory;
        } else {
          response.resourceInventory = {
            ec2Instances: 0,
            ebsVolumes: 0,
            ebsSnapshots: 0,
          };
          fastify.log.warn({ scanId: params.scanId }, 'ResourceInventory missing or invalid, using defaults');
        }

        // Add issues if it exists and is an array
        if (Array.isArray(scanResult.issues)) {
          response.issues = scanResult.issues;
        } else {
          response.issues = [];
          fastify.log.warn({ scanId: params.scanId }, 'Issues missing or invalid, using empty array');
        }

        // Add savings if it exists and is valid
        if (scanResult.savings && typeof scanResult.savings === 'object') {
          response.savings = scanResult.savings;
        } else {
          response.savings = {
            totalMonthlySavings: 0,
            totalAnnualSavings: 0,
            ruleBreakdown: {},
            resourceBreakdown: [],
          };
          fastify.log.warn({ scanId: params.scanId }, 'Savings missing or invalid, using defaults');
        }

        // Validate response has at least basic fields
        if (!response.scanId || !response.timestamp || !response.region) {
          throw new Error('Response validation failed: missing required fields');
        }

        // Test JSON serialization before sending
        let responseJson: string;
        try {
          responseJson = JSON.stringify(response);
        } catch (jsonError) {
          fastify.log.error({ 
            error: jsonError,
            scanId: params.scanId,
            responseKeys: Object.keys(response)
          }, 'Failed to serialize response to JSON');
          throw new Error(`JSON serialization failed: ${jsonError instanceof Error ? jsonError.message : 'Unknown error'}`);
        }

        fastify.log.info({ 
          scanId: params.scanId,
          responseKeys: Object.keys(response),
          hasCostSummary: !!response.costSummary,
          hasIssues: Array.isArray(response.issues),
          issuesCount: response.issues.length,
          responseSize: responseJson.length,
          responsePreview: responseJson.substring(0, 100)
        }, 'Sending scan result response');

        // Double-check response is not empty before sending
        if (Object.keys(response).length === 0) {
          fastify.log.error({ scanId: params.scanId }, 'Response is empty before sending!');
          return reply.status(500).send({
            error: 'Internal server error',
            message: 'Response is empty',
            scanId: params.scanId,
          });
        }

        return reply.status(200).send(response);
      } catch (serializationError) {
        fastify.log.error({ 
          error: serializationError,
          scanId: params.scanId,
          scanResultKeys: Object.keys(scanResult),
          scanResultType: typeof scanResult,
          scanResultString: JSON.stringify(scanResult).substring(0, 500)
        }, 'Error serializing scan result');
        return reply.status(500).send({
          error: 'Serialization error',
          message: serializationError instanceof Error ? serializationError.message : 'Failed to serialize scan result',
          scanId: params.scanId,
        });
      }
    } catch (error) {
      const scanId = params?.scanId || (request.params as any)?.scanId || 'unknown';
      fastify.log.error({ 
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
        errorName: error instanceof Error ? error.name : typeof error,
        scanId
      }, 'Error getting scan result');
      
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
