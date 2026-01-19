import type { Credentials } from '@aws-sdk/types';

/**
 * Check if mock AWS mode is enabled
 */
function isMockAws(): boolean {
  return process.env.MOCK_AWS === 'true';
}
import * as mockCost from './mock/cost.js';
import * as mockEc2 from './mock/ec2.js';
import * as mockEbs from './mock/ebs.js';
import * as mockSnapshots from './mock/ebs.js';
import * as realCost from './real/cost.js';
import * as realEc2 from './real/ec2.js';
import * as realEbs from './real/ebs.js';
import * as realSnapshots from './real/snapshots.js';
import type { CostSummary } from './services/cost-explorer-service.js';
import type { Ec2Instance, EbsVolume, EbsSnapshot } from './types/index.js';
import type { Ec2InventoryOptions } from './clients/ec2-client.js';

/**
 * Unified AWS client that routes to mock or real implementations
 */
export class AwsClientSelector {
  /**
   * Get last 30 days cost data (mock or real)
   */
  async getLast30DaysCostByService(
    credentials: Credentials,
    region: string = 'us-east-1'
  ): Promise<CostSummary> {
    if (isMockAws()) {
      return mockCost.getLast30DaysCostByService();
    }
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    return realCost.getCosts(credentials, startDate, endDate, region);
  }

  /**
   * Get cost data for date range (mock or real)
   */
  async getCosts(
    credentials: Credentials,
    startDate: Date,
    endDate: Date,
    region: string = 'us-east-1'
  ): Promise<CostSummary> {
    if (isMockAws()) {
      return mockCost.getCosts(startDate, endDate);
    }
    return realCost.getCosts(credentials, startDate, endDate, region);
  }

  /**
   * Get EC2 instances (mock or real)
   */
  async getEc2Instances(
    credentials: Credentials,
    region: string,
    options: Ec2InventoryOptions = {}
  ): Promise<Ec2Instance[]> {
    if (isMockAws()) {
      return mockEc2.getEc2Instances(region, options);
    }
    return realEc2.getEc2Instances(credentials, region, options);
  }

  /**
   * Get EBS volumes (mock or real)
   */
  async getEbsVolumes(
    credentials: Credentials,
    region: string
  ): Promise<EbsVolume[]> {
    if (isMockAws()) {
      return mockEbs.getEbsVolumes(region);
    }
    return realEbs.getEbsVolumes(credentials, region);
  }

  /**
   * Get EBS snapshots (mock or real)
   */
  async getSnapshots(
    credentials: Credentials,
    region: string,
    ownerId?: string
  ): Promise<EbsSnapshot[]> {
    if (isMockAws()) {
      return mockSnapshots.getSnapshots(region, ownerId);
    }
    return realSnapshots.getSnapshots(credentials, region, ownerId);
  }
}

// Export singleton instance
export const awsClient = new AwsClientSelector();
