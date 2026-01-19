import { RDSClient, DescribeDBInstancesCommand } from '@aws-sdk/client-rds';
import type { AwsClientConfig, RdsInstance } from '../types/index.js';

export class RdsClient {
  private client: RDSClient;
  private region: string;

  constructor(config: AwsClientConfig) {
    this.region = config.region;
    this.client = new RDSClient({
      region: config.region,
      credentials: config.credentials
        ? {
            accessKeyId: config.credentials.accessKeyId,
            secretAccessKey: config.credentials.secretAccessKey,
            sessionToken: config.credentials.sessionToken,
          }
        : undefined,
    });
  }

  async listInstances(): Promise<RdsInstance[]> {
    const command = new DescribeDBInstancesCommand({});
    const response = await this.client.send(command);

    const instances: RdsInstance[] = [];

    for (const dbInstance of response.DBInstances || []) {
      if (dbInstance.DBInstanceIdentifier) {
        const instanceData: RdsInstance = {
          id: dbInstance.DBInstanceIdentifier,
          dbInstanceIdentifier: dbInstance.DBInstanceIdentifier,
          type: 'rds-instance',
          engine: dbInstance.Engine || 'unknown',
          instanceClass: dbInstance.DBInstanceClass || 'unknown',
          region: this.region,
          accountId: 'unknown', // RDS doesn't provide account ID directly
          status: dbInstance.DBInstanceStatus || 'unknown',
          tags: dbInstance.TagList?.reduce(
            (acc, tag) => {
              if (tag.Key && tag.Value) {
                acc[tag.Key] = tag.Value;
              }
              return acc;
            },
            {} as Record<string, string>
          ),
        };
        instances.push(instanceData);
      }
    }

    return instances;
  }
}
