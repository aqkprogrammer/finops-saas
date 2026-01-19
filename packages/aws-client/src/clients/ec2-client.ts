import { EC2Client, DescribeInstancesCommand } from '@aws-sdk/client-ec2';
import type { AwsClientConfig, Ec2Instance } from '../types/index.js';
import { CloudWatchClient } from './cloudwatch-client.js';

export interface Ec2InventoryOptions {
  includeMetrics?: boolean;
}

export class Ec2Client {
  private client: EC2Client;
  private cloudWatch?: CloudWatchClient;
  private region: string;

  constructor(config: AwsClientConfig) {
    this.region = config.region;
    this.client = new EC2Client({
      region: config.region,
      credentials: config.credentials
        ? {
            accessKeyId: config.credentials.accessKeyId,
            secretAccessKey: config.credentials.secretAccessKey,
            sessionToken: config.credentials.sessionToken,
          }
        : undefined,
    });

    // Initialize CloudWatch client if credentials are provided
    if (config.credentials) {
      this.cloudWatch = new CloudWatchClient(config);
    }
  }

  /**
   * List EC2 instances with optional CloudWatch CPU metrics
   */
  async listInstances(
    options: Ec2InventoryOptions = {}
  ): Promise<Ec2Instance[]> {
    const { includeMetrics = false } = options;
    const command = new DescribeInstancesCommand({});
    const response = await this.client.send(command);

    const instances: Ec2Instance[] = [];

    for (const reservation of response.Reservations || []) {
      for (const instance of reservation.Instances || []) {
        if (instance.InstanceId) {
          const instanceData: Ec2Instance = {
            id: instance.InstanceId,
            instanceId: instance.InstanceId,
            type: 'ec2-instance',
            instanceType: instance.InstanceType || 'unknown',
            region: this.region,
            accountId: reservation.OwnerId || 'unknown',
            state: instance.State?.Name || 'unknown',
            launchTime: instance.LaunchTime || new Date(),
            tags: instance.Tags?.reduce(
              (acc, tag) => {
                if (tag.Key && tag.Value) {
                  acc[tag.Key] = tag.Value;
                }
                return acc;
              },
              {} as Record<string, string>
            ),
          };

          // Fetch CloudWatch CPU metrics if requested
          if (includeMetrics && this.cloudWatch && instance.State?.Name === 'running') {
            try {
              const cpuUtilization = await this.cloudWatch.getEc2CpuUtilization(
                instance.InstanceId
              );

              if (cpuUtilization !== null) {
                instanceData.cpuUtilization = {
                  average: Math.round(cpuUtilization * 100) / 100,
                  period: '7-day',
                };
              }
            } catch (error) {
              // Silently fail if metrics are unavailable
            }
          }

          instances.push(instanceData);
        }
      }
    }

    return instances;
  }
}
