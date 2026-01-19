import type { Credentials } from '@aws-sdk/types';
import type { EbsSnapshot } from '../types/index.js';
import { EbsClient } from '../clients/ebs-client.js';

/**
 * Real AWS EBS snapshots implementation
 */
export async function getSnapshots(
  credentials: Credentials,
  region: string,
  ownerId?: string
): Promise<EbsSnapshot[]> {
  const ebsClient = new EbsClient({
    region,
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      sessionToken: credentials.sessionToken,
    },
  });

  return ebsClient.listSnapshots(ownerId);
}
