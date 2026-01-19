import type { Credentials } from '@aws-sdk/types';
import { awsClient, assumeRole, AssumeRoleError, validatePermissions, ValidationError } from '@finopsguard/aws-client';
import type { Ec2Instance, EbsVolume, EbsSnapshot } from '@finopsguard/aws-client';
import { FinOpsRulesEngine } from '@finopsguard/rules-engine';
import type { DetectedIssue } from '@finopsguard/rules-engine';
import { SavingsCalculator } from '@finopsguard/pricing';
import { env } from '../config/env.js';

export interface ScanOptions {
  region: string;
  roleArn: string;
  externalId?: string;
  includeMetrics?: boolean;
}

export interface ScanResult {
  scanId: string;
  timestamp: Date;
  region: string;
  costSummary: {
    totalCost: number;
    currency: string;
    period: {
      start: string;
      end: string;
      days: number;
    };
    services: Array<{
      service: string;
      cost: number;
      percentage: number;
    }>;
  };
  resourceInventory: {
    ec2Instances: number;
    ebsVolumes: number;
    ebsSnapshots: number;
  };
  issues: DetectedIssue[];
  savings: {
    totalMonthlySavings: number;
    totalAnnualSavings: number;
    ruleBreakdown: Record<string, {
      count: number;
      monthlySavings: number;
      annualSavings: number;
    }>;
    resourceBreakdown: Array<{
      ruleId: string;
      ruleName: string;
      resourceId: string;
      resourceType: string;
      currentMonthlyCost: number;
      potentialMonthlySavings: number;
      savingsPercentage: number;
    }>;
  };
}

export interface ScanSummary {
  totalCost: number;
  potentialSavings: number;
  issues: DetectedIssue[];
}

/**
 * Scan service that orchestrates cost collection, resource inventory,
 * rules evaluation, and savings calculation
 */
export class ScanService {
  /**
   * Run a complete FinOps scan using IAM role assumption
   */
  async runScan(options: ScanOptions): Promise<ScanResult> {
    const { region, roleArn, externalId, includeMetrics = true } = options;
    const scanId = this.generateScanId();
    const timestamp = new Date();

    // Step 0: Assume IAM role to get temporary credentials (skip in mock mode)
    let assumedCredentials: Credentials;
    
    if (env.MOCK_AWS) {
      // Use dummy credentials in mock mode
      assumedCredentials = {
        accessKeyId: 'MOCK_ACCESS_KEY_ID',
        secretAccessKey: 'MOCK_SECRET_ACCESS_KEY',
        sessionToken: 'MOCK_SESSION_TOKEN',
      };
    } else {
      // Generate a unique session name for this scan
      const roleSessionName = `finops-scan-${scanId}`;
      
      // Get base credentials from environment variables if available
      // Check both env object and process.env directly as fallback
      const accessKeyId = env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
      const secretAccessKey = env.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
      const sessionToken = env.AWS_SESSION_TOKEN || process.env.AWS_SESSION_TOKEN;
      
      // Only create credentials object if both required values are present and non-empty
      const hasExplicitCredentials = accessKeyId && accessKeyId.trim() && secretAccessKey && secretAccessKey.trim();
      const baseCredentials: Credentials | undefined = hasExplicitCredentials
          ? {
              accessKeyId: accessKeyId!.trim(),
              secretAccessKey: secretAccessKey!.trim(),
              sessionToken: sessionToken?.trim() || undefined,
            }
          : undefined;
      
      // Log credential status (without exposing secrets)
      if (hasExplicitCredentials) {
        console.log('[ScanService] Using explicit AWS credentials from environment variables');
      } else {
        console.log('[ScanService] No explicit credentials found, using AWS SDK default credential chain');
        console.log('[ScanService] Checking for credentials in: environment variables, IAM instance profile, credentials file');
      }
      
      try {
        assumedCredentials = await assumeRole({
          roleArn,
          roleSessionName,
          externalId,
          durationSeconds: 3600, // 1 hour
          region: 'us-east-1', // STS is available in all regions, using us-east-1 as default
          credentials: baseCredentials,
        });
      } catch (error) {
        // Re-throw AssumeRoleError as-is (it has proper error codes)
        if (error instanceof AssumeRoleError) {
          throw error;
        }
        // Wrap other errors
        if (error instanceof Error) {
          throw new Error(`Failed to assume IAM role ${roleArn}: ${error.message}`);
        }
        throw error;
      }

      // Validate permissions immediately after assuming role
      try {
        await validatePermissions({
          credentials: assumedCredentials,
          region,
        });
      } catch (error) {
        if (error instanceof ValidationError) {
          const missingServices = error.validationResult.errors.map((e: { service: string }) => e.service).join(' / ');
          throw new Error(`Permission validation failed: Missing ${missingServices} permissions`);
        }
        throw error;
      }
    }

    // Step 1: Cost Collection
    const costSummary = await awsClient.getLast30DaysCostByService(
      assumedCredentials,
      'us-east-1' // Cost Explorer is only available in us-east-1
    );

    // Step 2: Resource Inventory
    // Collect resources
    const [ec2Instances, ebsVolumes, ebsSnapshots] = await Promise.all([
      awsClient.getEc2Instances(assumedCredentials, region, { includeMetrics }),
      awsClient.getEbsVolumes(assumedCredentials, region),
      awsClient.getSnapshots(assumedCredentials, region),
    ]);

    // Step 3: Rules Evaluation
    const rulesEngine = new FinOpsRulesEngine();
    // Types from aws-client are compatible with rules-engine types
    const issues = rulesEngine.evaluateAllResources({
      ec2Instances: ec2Instances as Ec2Instance[],
      ebsVolumes: ebsVolumes as EbsVolume[],
      ebsSnapshots: ebsSnapshots as EbsSnapshot[],
    });

    // Step 4: Savings Calculation
    const savingsCalculator = new SavingsCalculator();
    
    // Build resource data map for savings calculation
    const resourceDataMap = new Map<string, {
      instanceType?: string;
      volumeSize?: number;
      volumeType?: string;
      snapshotSize?: number;
    }>();

    // Map EC2 instances
    for (const instance of ec2Instances) {
      resourceDataMap.set(instance.instanceId, {
        instanceType: instance.instanceType,
      });
    }

    // Map EBS volumes
    for (const volume of ebsVolumes) {
      resourceDataMap.set(volume.volumeId, {
        volumeSize: volume.size,
        volumeType: volume.volumeType,
      });
    }

    // Map EBS snapshots
    for (const snapshot of ebsSnapshots) {
      resourceDataMap.set(snapshot.snapshotId, {
        snapshotSize: snapshot.volumeSize,
      });
    }

    const savingsSummary = savingsCalculator.calculateSavingsSummary(issues, resourceDataMap);

    // Build scan result
    const scanResult: ScanResult = {
      scanId,
      timestamp,
      region,
      costSummary: {
        totalCost: costSummary.totalCost,
        currency: costSummary.currency,
        period: costSummary.period,
        services: costSummary.services,
      },
      resourceInventory: {
        ec2Instances: ec2Instances.length,
        ebsVolumes: ebsVolumes.length,
        ebsSnapshots: ebsSnapshots.length,
      },
      issues,
      savings: {
        totalMonthlySavings: savingsSummary.totalMonthlySavings,
        totalAnnualSavings: savingsSummary.totalAnnualSavings,
        ruleBreakdown: savingsSummary.ruleBreakdown,
        resourceBreakdown: savingsSummary.resourceBreakdown,
      },
    };

    return scanResult;
  }

  /**
   * Generate a unique scan ID
   */
  private generateScanId(): string {
    return `scan-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Convert scan result to summary format
   */
  toSummary(result: ScanResult): ScanSummary {
    if (!result || !result.costSummary || !result.savings || !Array.isArray(result.issues)) {
      throw new Error('Invalid scan result: cannot create summary');
    }
    return {
      totalCost: result.costSummary.totalCost || 0,
      potentialSavings: result.savings.totalMonthlySavings || 0,
      issues: result.issues || [],
    };
  }
}
