import { Cost, Savings } from '@finopsguard/shared';

export interface PricingConfig {
  region: string;
  currency?: string;
}

export interface ResourceCost extends Cost {
  resourceId: string;
  resourceType: string;
  period: 'hourly' | 'daily' | 'monthly';
}

export interface CostCalculation {
  currentCost: number;
  optimizedCost: number;
  savings: Savings;
}
