import type { Credentials } from '@aws-sdk/types';
import { CostExplorerService, type CostSummary } from '../services/cost-explorer-service.js';

/**
 * Real AWS cost data implementation
 */
export async function getCosts(
  credentials: Credentials,
  startDate: Date,
  endDate: Date,
  region: string = 'us-east-1'
): Promise<CostSummary> {
  const costExplorerService = new CostExplorerService({
    credentials,
    region,
  });

  return costExplorerService.getCostByService(startDate, endDate);
}
