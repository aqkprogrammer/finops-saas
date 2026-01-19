import type { Ec2Instance } from '../types/index.js';
import type { Ec2InventoryOptions } from '../clients/ec2-client.js';
import { mockEc2Instances } from './data.js';

/**
 * Mock EC2 instances implementation
 */
export async function getEc2Instances(
  region: string,
  _options: Ec2InventoryOptions = {}
): Promise<Ec2Instance[]> {
  // Return mock instances filtered by region
  return mockEc2Instances.map((instance) => ({
    ...instance,
    region,
  }));
}
