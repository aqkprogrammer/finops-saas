import {
  CostExplorerClient,
  GetCostAndUsageCommand,
} from '@aws-sdk/client-cost-explorer';
import type { Credentials } from '@aws-sdk/types';

export interface ServiceCost {
  service: string;
  cost: number;
  percentage: number;
}

export interface CostSummary {
  totalCost: number;
  period: {
    start: string;
    end: string;
    days: number;
  };
  services: ServiceCost[];
  currency: string;
}

export interface CostExplorerServiceOptions {
  credentials: Credentials;
  region?: string;
}

export class CostExplorerServiceError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'CostExplorerServiceError';
  }
}

/**
 * Cost Explorer service for fetching and analyzing AWS costs
 */
export class CostExplorerService {
  private client: CostExplorerClient;
  private credentials: Credentials;

  constructor(options: CostExplorerServiceOptions) {
    this.credentials = options.credentials;
    this.client = new CostExplorerClient({
      region: options.region || 'us-east-1', // Cost Explorer is only available in us-east-1
      credentials: {
        accessKeyId: this.credentials.accessKeyId,
        secretAccessKey: this.credentials.secretAccessKey,
        sessionToken: this.credentials.sessionToken,
      },
    });
  }

  /**
   * Fetch last 30 days of AWS cost data grouped by service
   * Returns normalized monthly costs
   */
  async getLast30DaysCostByService(): Promise<CostSummary> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    return this.getCostByService(startDate, endDate);
  }

  /**
   * Fetch cost data grouped by service for a given date range
   * Normalizes costs to monthly values
   */
  async getCostByService(
    startDate: Date,
    endDate: Date
  ): Promise<CostSummary> {
    // Validate date range
    if (startDate >= endDate) {
      throw new CostExplorerServiceError(
        'Start date must be before end date'
      );
    }

    const daysDiff = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff > 365) {
      throw new CostExplorerServiceError(
        'Date range cannot exceed 365 days'
      );
    }

    try {
      const command = new GetCostAndUsageCommand({
        TimePeriod: {
          Start: startDate.toISOString().split('T')[0],
          End: endDate.toISOString().split('T')[0],
        },
        Granularity: 'DAILY',
        Metrics: ['BlendedCost'],
        GroupBy: [
          {
            Type: 'DIMENSION',
            Key: 'SERVICE',
          },
        ],
      });

      const response = await this.client.send(command);

      if (!response.ResultsByTime || response.ResultsByTime.length === 0) {
        return {
          totalCost: 0,
          period: {
            start: startDate.toISOString().split('T')[0],
            end: endDate.toISOString().split('T')[0],
            days: daysDiff,
          },
          services: [],
          currency: 'USD',
        };
      }

      // Aggregate costs by service across all time periods
      const serviceCostsMap = new Map<string, number>();
      let totalCost = 0;
      let currency = 'USD';

      for (const result of response.ResultsByTime) {
        if (result.Groups) {
          for (const group of result.Groups) {
            const serviceName = group.Keys?.[0] || 'Unknown';
            const costAmount = group.Metrics?.BlendedCost?.Amount;

            if (costAmount) {
              const cost = parseFloat(costAmount);
              const currentCost = serviceCostsMap.get(serviceName) || 0;
              serviceCostsMap.set(serviceName, currentCost + cost);
              totalCost += cost;

              // Extract currency from first result
              if (!currency && group.Metrics?.BlendedCost?.Unit) {
                currency = group.Metrics.BlendedCost.Unit;
              }
            }
          }
        }

        // Also check for total cost in the result
        if (result.Total && result.Total.BlendedCost?.Amount) {
          if (currency === 'USD' && result.Total.BlendedCost.Unit) {
            currency = result.Total.BlendedCost.Unit;
          }
        }
      }

      // Normalize to monthly costs
      // Formula: (total_cost / days) * 30
      const dailyAverage = totalCost / daysDiff;
      const normalizedMonthlyTotal = dailyAverage * 30;

      // Normalize each service cost to monthly
      const services: ServiceCost[] = Array.from(serviceCostsMap.entries())
        .map(([service, cost]) => {
          const dailyAverage = cost / daysDiff;
          const normalizedMonthlyCost = dailyAverage * 30;
          const percentage =
            totalCost > 0 ? (cost / totalCost) * 100 : 0;

          return {
            service,
            cost: Math.round(normalizedMonthlyCost * 100) / 100, // Round to 2 decimals
            percentage: Math.round(percentage * 100) / 100, // Round to 2 decimals
          };
        })
        .sort((a, b) => b.cost - a.cost); // Sort by cost descending

      return {
        totalCost: Math.round(normalizedMonthlyTotal * 100) / 100,
        period: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0],
          days: daysDiff,
        },
        services,
        currency: currency || 'USD',
      };
    } catch (error) {
      if (error && typeof error === 'object' && 'name' in error) {
        const awsError = error as { name: string; message: string };
        
        switch (awsError.name) {
          case 'AccessDenied':
            throw new CostExplorerServiceError(
              'Access denied to Cost Explorer. Ensure the role has ce:GetCostAndUsage permission.',
              'AccessDenied',
              error
            );
          case 'DataUnavailableException':
            throw new CostExplorerServiceError(
              'Cost data is not available for the specified time period. Cost data may take up to 24 hours to appear.',
              'DataUnavailable',
              error
            );
          case 'InvalidNextTokenException':
            throw new CostExplorerServiceError(
              'Invalid pagination token. This may indicate a large dataset.',
              'InvalidToken',
              error
            );
          default:
            throw new CostExplorerServiceError(
              `Failed to fetch cost data: ${awsError.message || String(error)}`,
              awsError.name,
              error
            );
        }
      }

      throw new CostExplorerServiceError(
        `Unexpected error fetching cost data: ${String(error)}`,
        'UnknownError',
        error
      );
    }
  }

  /**
   * Get cost breakdown for a specific service
   */
  async getServiceCost(
    serviceName: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const summary = await this.getCostByService(startDate, endDate);
    const service = summary.services.find((s) => s.service === serviceName);
    
    if (!service) {
      return 0;
    }

    // Convert monthly normalized cost back to period cost
    const daysDiff = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return (service.cost / 30) * daysDiff;
  }
}
