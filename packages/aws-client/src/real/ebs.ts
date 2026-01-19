import type { Credentials } from '@aws-sdk/types';
import type { EbsVolume } from '../types/index.js';
import { EbsClient } from '../clients/ebs-client.js';

/**
 * Real AWS EBS volumes implementation
 */
export async function getEbsVolumes(
  credentials: Credentials,
  region: string
): Promise<EbsVolume[]> {
  const ebsClient = new EbsClient({
    region,
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      sessionToken: credentials.sessionToken,
    },
  });

  return ebsClient.listVolumes();
}
