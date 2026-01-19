import type { CostSummary } from '../services/cost-explorer-service.js';
import { mockCostSummary } from './data.js';

/**
 * Mock cost data implementation
 * Returns getLast30DaysCostByService format
 */
export async function getLast30DaysCostByService(): Promise<CostSummary> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  const daysDiff = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    ...mockCostSummary,
    period: {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0],
      days: daysDiff,
    },
  };
}

/**
 * Mock cost data implementation for date range
 */
export async function getCosts(
  startDate: Date,
  endDate: Date
): Promise<CostSummary> {
  const daysDiff = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    ...mockCostSummary,
    period: {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0],
      days: daysDiff,
    },
  };
}
