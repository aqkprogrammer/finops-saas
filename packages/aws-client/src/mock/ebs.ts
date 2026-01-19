import type { EbsVolume, EbsSnapshot } from '../types/index.js';
import { mockEbsVolumes, mockEbsSnapshots } from './data.js';

/**
 * Mock EBS volumes implementation
 */
export async function getEbsVolumes(region: string): Promise<EbsVolume[]> {
  // Return mock volumes filtered by region
  return mockEbsVolumes.map((volume) => ({
    ...volume,
    region,
  }));
}

/**
 * Mock EBS snapshots implementation
 */
export async function getSnapshots(
  region: string,
  _ownerId?: string
): Promise<EbsSnapshot[]> {
  // Return mock snapshots filtered by region
  return mockEbsSnapshots.map((snapshot) => ({
    ...snapshot,
    region,
  }));
}
