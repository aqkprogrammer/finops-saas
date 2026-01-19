import {
  CloudWatchClient as AwsCloudWatchClient,
  GetMetricStatisticsCommand,
  type Statistic,
} from '@aws-sdk/client-cloudwatch';
import type { AwsClientConfig } from '../types/index.js';

export interface MetricStatisticsOptions {
  namespace: string;
  metricName: string;
  dimensions: Array<{ Name: string; Value: string }>;
  startTime: Date;
  endTime: Date;
  period?: number;
  statistics?: Statistic[];
}

export class CloudWatchClient {
  private client: AwsCloudWatchClient;

  constructor(config: AwsClientConfig) {
    this.client = new AwsCloudWatchClient({
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

  /**
   * Get metric statistics
   */
  async getMetricStatistics(
    options: MetricStatisticsOptions
  ): Promise<number | null> {
    const {
      namespace,
      metricName,
      dimensions,
      startTime,
      endTime,
      period = 3600, // 1 hour default
      statistics = ['Average'],
    } = options;

    try {
      const command = new GetMetricStatisticsCommand({
        Namespace: namespace,
        MetricName: metricName,
        Dimensions: dimensions,
        StartTime: startTime,
        EndTime: endTime,
        Period: period,
        Statistics: statistics,
      });

      const response = await this.client.send(command);

      if (!response.Datapoints || response.Datapoints.length === 0) {
        return null;
      }

      // Calculate average of all datapoints
      const values = response.Datapoints.map((dp) => dp.Average || 0);
      const sum = values.reduce((acc, val) => acc + val, 0);
      return sum / values.length;
    } catch (error) {
      // Return null if metric is not available or access denied
      return null;
    }
  }

  /**
   * Get 7-day average CPU utilization for an EC2 instance
   */
  async getEc2CpuUtilization(
    instanceId: string
  ): Promise<number | null> {
    const endTime = new Date();
    const startTime = new Date();
    startTime.setDate(startTime.getDate() - 7);

    return this.getMetricStatistics({
      namespace: 'AWS/EC2',
      metricName: 'CPUUtilization',
      dimensions: [
        {
          Name: 'InstanceId',
          Value: instanceId,
        },
      ],
      startTime,
      endTime,
      period: 3600, // 1 hour periods
      statistics: ['Average'],
    });
  }
}
