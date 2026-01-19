import {
  CostExplorerClient as AwsCostExplorerClient,
  GetCostAndUsageCommand,
} from '@aws-sdk/client-cost-explorer';
import type { AwsClientConfig } from '../types/index.js';

export class CostExplorerClient {
  private client: AwsCostExplorerClient;

  constructor(config: AwsClientConfig) {
    this.client = new AwsCostExplorerClient({
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

  async getCosts(
    startDate: Date,
    endDate: Date,
    granularity: 'DAILY' | 'MONTHLY' = 'DAILY'
  ) {
    const command = new GetCostAndUsageCommand({
      TimePeriod: {
        Start: startDate.toISOString().split('T')[0],
        End: endDate.toISOString().split('T')[0],
      },
      Granularity: granularity,
      Metrics: ['BlendedCost', 'UnblendedCost'],
    });

    const response = await this.client.send(command);
    return response.ResultsByTime || [];
  }
}
