import { EC2Client, DescribeInstancesCommand } from '@aws-sdk/client-ec2';
import {
  CostExplorerClient,
  GetCostAndUsageCommand,
} from '@aws-sdk/client-cost-explorer';
import type { Credentials } from '@aws-sdk/types';

export interface ValidationOptions {
  credentials: Credentials;
  region?: string;
}

export interface ValidationResult {
  success: boolean;
  errors: ValidationServiceError[];
  checks: {
    costExplorer: CheckResult;
    ec2: CheckResult;
  };
}

export interface ValidationServiceError {
  service: string;
  error: string;
  code?: string;
}

export interface CheckResult {
  success: boolean;
  error?: string;
  code?: string;
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly validationResult: ValidationResult
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validate AWS permissions by testing read-only operations
 */
export async function validatePermissions(
  options: ValidationOptions
): Promise<ValidationResult> {
  const { credentials, region = 'us-east-1' } = options;
  const errors: ValidationServiceError[] = [];
  const checks: ValidationResult['checks'] = {
    costExplorer: { success: false },
    ec2: { success: false },
  };

  // Validate Cost Explorer permissions
  try {
    await validateCostExplorerAccess(credentials);
    checks.costExplorer.success = true;
  } catch (error) {
    const errorMessage = extractErrorMessage(error);
    const errorCode = extractErrorCode(error);
    
    checks.costExplorer = {
      success: false,
      error: errorMessage,
      code: errorCode,
    };
    
    errors.push({
      service: 'Cost Explorer',
      error: errorMessage,
      code: errorCode,
    });
  }

  // Validate EC2 permissions
  try {
    await validateEc2Access(credentials, region);
    checks.ec2.success = true;
  } catch (error) {
    const errorMessage = extractErrorMessage(error);
    const errorCode = extractErrorCode(error);
    
    checks.ec2 = {
      success: false,
      error: errorMessage,
      code: errorCode,
    };
    
    errors.push({
      service: 'EC2',
      error: errorMessage,
      code: errorCode,
    });
  }

  const result: ValidationResult = {
    success: errors.length === 0,
    errors,
    checks,
  };

  if (!result.success) {
    throw new ValidationError(
      `Permission validation failed: ${errors.map((e) => e.service).join(', ')}`,
      result
    );
  }

  return result;
}

/**
 * Validate Cost Explorer read access
 */
async function validateCostExplorerAccess(
  credentials: Credentials
): Promise<void> {
  const client = new CostExplorerClient({
    region: 'us-east-1', // Cost Explorer is only available in us-east-1
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      sessionToken: credentials.sessionToken,
    },
  });

  // Test with a small date range (last 7 days)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);

  try {
    const command = new GetCostAndUsageCommand({
      TimePeriod: {
        Start: startDate.toISOString().split('T')[0],
        End: endDate.toISOString().split('T')[0],
      },
      Granularity: 'DAILY',
      Metrics: ['BlendedCost'],
    });

    await client.send(command);
  } catch (error) {
    const errorCode = extractErrorCode(error);
    
    // Map common AWS errors to user-friendly messages
    if (errorCode === 'AccessDenied') {
      throw new Error(
        'Access denied to Cost Explorer. Ensure the role has ce:GetCostAndUsage permission.'
      );
    }
    
    if (errorCode === 'UnrecognizedClientException') {
      throw new Error(
        'Invalid AWS credentials. Check your access key and secret.'
      );
    }

    throw error;
  }
}

/**
 * Validate EC2 read access
 */
async function validateEc2Access(
  credentials: Credentials,
  region: string
): Promise<void> {
  const client = new EC2Client({
    region,
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      sessionToken: credentials.sessionToken,
    },
  });

  try {
    const command = new DescribeInstancesCommand({
      MaxResults: 1, // Only fetch 1 result for validation
    });

    await client.send(command);
  } catch (error) {
    const errorCode = extractErrorCode(error);
    
    // Map common AWS errors to user-friendly messages
    if (errorCode === 'UnauthorizedOperation') {
      throw new Error(
        'Access denied to EC2. Ensure the role has ec2:DescribeInstances permission.'
      );
    }
    
    if (errorCode === 'AuthFailure') {
      throw new Error(
        'Authentication failed. Check your AWS credentials and region.'
      );
    }

    throw error;
  }
}

/**
 * Extract error message from AWS SDK error
 */
function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  
  return String(error);
}

/**
 * Extract error code from AWS SDK error
 */
function extractErrorCode(error: unknown): string | undefined {
  if (error && typeof error === 'object') {
    if ('name' in error) {
      return String(error.name);
    }
    if ('code' in error) {
      return String(error.code);
    }
    if ('$metadata' in error && typeof error.$metadata === 'object') {
      const metadata = error.$metadata as { httpStatusCode?: number };
      if (metadata.httpStatusCode) {
        return `HTTP_${metadata.httpStatusCode}`;
      }
    }
  }
  
  return undefined;
}
