import type { Savings } from '@finopsguard/shared';
import type { CostCalculation, PricingConfig, ResourceCost } from './types/index.js';

/**
 * Calculate percentage
 */
function calculatePercentage(part: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((part / total) * 100 * 100) / 100;
}

/**
 * Pricing calculator for AWS resources
 */
export class PricingCalculator {
  constructor(_config: PricingConfig) {
    // Config can be used for future customization
  }

  /**
   * Calculate current cost for a resource
   */
  calculateCurrentCost(resource: ResourceCost): number {
    // Base pricing logic - can be extended with AWS Pricing API
    const hourlyRate = this.getHourlyRate(resource.resourceType);
    
    switch (resource.period) {
      case 'hourly':
        return hourlyRate;
      case 'daily':
        return hourlyRate * 24;
      case 'monthly':
        return hourlyRate * 24 * 30;
      default:
        return hourlyRate;
    }
  }

  /**
   * Calculate optimized cost after applying recommendations
   */
  calculateOptimizedCost(
    currentCost: number,
    optimizationPercentage: number
  ): number {
    return currentCost * (1 - optimizationPercentage / 100);
  }

  /**
   * Calculate savings from optimization
   */
  calculateSavings(
    currentCost: number,
    optimizedCost: number
  ): Savings {
    const savingsAmount = currentCost - optimizedCost;
    const savingsPercentage = calculatePercentage(savingsAmount, currentCost);

    return {
      currentCost,
      optimizedCost,
      savingsAmount,
      savingsPercentage,
    };
  }

  /**
   * Calculate total cost calculation with savings
   */
  calculateCostCalculation(
    currentCost: number,
    optimizationPercentage: number
  ): CostCalculation {
    const optimizedCost = this.calculateOptimizedCost(
      currentCost,
      optimizationPercentage
    );
    const savings = this.calculateSavings(currentCost, optimizedCost);

    return {
      currentCost,
      optimizedCost,
      savings,
    };
  }

  /**
   * Get hourly rate for a resource type (simplified - should use AWS Pricing API)
   */
  private getHourlyRate(resourceType: string): number {
    // Simplified pricing - in production, use AWS Pricing API
    const rates: Record<string, number> = {
      ec2: 0.1,
      rds: 0.2,
      s3: 0.023,
      lambda: 0.0000166667,
    };

    return rates[resourceType] || 0.05;
  }
}
