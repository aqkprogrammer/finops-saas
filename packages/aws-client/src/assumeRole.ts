import {
  STSClient,
  AssumeRoleCommand,
  AssumeRoleCommandOutput,
} from '@aws-sdk/client-sts';
import type { Credentials } from '@aws-sdk/types';

export interface AssumeRoleOptions {
  roleArn: string;
  roleSessionName: string;
  durationSeconds?: number;
  externalId?: string;
  region?: string;
  /**
   * Optional base credentials to use for assuming the role.
   * If not provided, the AWS SDK will use the default credential chain
   * (environment variables, IAM instance profile, credentials file, etc.)
   */
  credentials?: Credentials;
}

export interface AssumedRoleCredentials extends Credentials {
  expiration: Date;
}

export class AssumeRoleError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'AssumeRoleError';
  }
}

/**
 * Assume an IAM role using STS
 */
export async function assumeRole(
  options: AssumeRoleOptions
): Promise<AssumedRoleCredentials> {
  const {
    roleArn,
    roleSessionName,
    durationSeconds = 3600,
    externalId,
    region = 'us-east-1',
    credentials: baseCredentials,
  } = options;

  // Validate role ARN format
  if (!roleArn.startsWith('arn:aws:iam::') || !roleArn.includes(':role/')) {
    throw new AssumeRoleError(
      `Invalid role ARN format: ${roleArn}`,
      'InvalidRoleArn'
    );
  }

  // Configure STS client with base credentials if provided
  // Otherwise, AWS SDK will automatically use default credential provider chain
  // (environment variables, IAM instance profile, credentials file, etc.)
  const stsClientConfig: { region: string; credentials?: Credentials } = { region };
  
  if (baseCredentials) {
    // Use explicit credentials if provided
    stsClientConfig.credentials = {
      accessKeyId: baseCredentials.accessKeyId,
      secretAccessKey: baseCredentials.secretAccessKey,
      sessionToken: baseCredentials.sessionToken,
    };
  }
  // If baseCredentials is undefined, don't set credentials property
  // This allows AWS SDK to use its default credential provider chain

  const stsClient = new STSClient(stsClientConfig);

  try {
    const command = new AssumeRoleCommand({
      RoleArn: roleArn,
      RoleSessionName: roleSessionName,
      DurationSeconds: durationSeconds,
      ExternalId: externalId,
    });

    const response: AssumeRoleCommandOutput = await stsClient.send(command);

    if (!response.Credentials) {
      throw new AssumeRoleError(
        'No credentials returned from AssumeRole',
        'NoCredentials'
      );
    }

    const credentials = response.Credentials;

    if (!credentials.AccessKeyId || !credentials.SecretAccessKey || !credentials.SessionToken) {
      throw new AssumeRoleError(
        'Incomplete credentials returned from AssumeRole',
        'IncompleteCredentials'
      );
    }

    return {
      accessKeyId: credentials.AccessKeyId,
      secretAccessKey: credentials.SecretAccessKey,
      sessionToken: credentials.SessionToken,
      expiration: credentials.Expiration || new Date(Date.now() + durationSeconds * 1000),
    };
  } catch (error) {
    if (error instanceof AssumeRoleError) {
      throw error;
    }

    // Handle AWS SDK errors
    if (error && typeof error === 'object' && 'name' in error) {
      const awsError = error as { name: string; message: string };
      
      switch (awsError.name) {
        case 'AccessDenied':
          throw new AssumeRoleError(
            `Access denied when assuming role ${roleArn}. Check IAM trust policy and permissions.`,
            'AccessDenied',
            error
          );
        case 'InvalidClientTokenId':
          throw new AssumeRoleError(
            'Invalid AWS credentials. Check your access key and secret.',
            'InvalidCredentials',
            error
          );
        case 'MalformedPolicyDocument':
          throw new AssumeRoleError(
            'Malformed IAM policy document in role trust policy.',
            'MalformedPolicy',
            error
          );
        default:
          // Check for credential provider errors
          if (awsError.message?.includes('Could not load credentials') || 
              awsError.message?.includes('credentials')) {
            throw new AssumeRoleError(
              `Could not load AWS credentials. Please provide base credentials via environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY), IAM instance profile, or pass them explicitly to assumeRole(). Original error: ${awsError.message}`,
              'NoCredentials',
              error
            );
          }
          throw new AssumeRoleError(
            `Failed to assume role: ${awsError.message || String(error)}`,
            awsError.name,
            error
          );
      }
    }

    // Handle credential provider errors that might not have a name
    const errorMessage = String(error);
    if (errorMessage.includes('Could not load credentials') || 
        errorMessage.includes('credentials')) {
      throw new AssumeRoleError(
        `Could not load AWS credentials. Please provide base credentials via environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY), IAM instance profile, or pass them explicitly to assumeRole(). Original error: ${errorMessage}`,
        'NoCredentials',
        error
      );
    }

    throw new AssumeRoleError(
      `Unexpected error assuming role: ${errorMessage}`,
      'UnknownError',
      error
    );
  }
}
