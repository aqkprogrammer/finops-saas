import type { Credentials } from '@aws-sdk/types';
import type { Ec2Instance } from '../types/index.js';
import type { Ec2InventoryOptions } from '../clients/ec2-client.js';
import { AwsClient } from '../awsClient.js';

/**
 * Real AWS EC2 instances implementation
 */
export async function getEc2Instances(
  credentials: Credentials,
  region: string,
  options: Ec2InventoryOptions = {}
): Promise<Ec2Instance[]> {
  const awsClient = new AwsClient({
    region,
    credentials,
  });

  return awsClient.ec2.listInstances(options);
}
