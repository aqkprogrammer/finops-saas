import { z } from 'zod';

// AWS Resource Types
export const AwsResourceSchema = z.object({
  id: z.string(),
  type: z.string(),
  region: z.string(),
  accountId: z.string(),
  tags: z.record(z.string()).optional(),
});

export type AwsResource = z.infer<typeof AwsResourceSchema>;

// Cost Types
export const CostSchema = z.object({
  amount: z.number(),
  currency: z.string().default('USD'),
  unit: z.string().default('hour'),
});

export type Cost = z.infer<typeof CostSchema>;

// Savings Types
export const SavingsSchema = z.object({
  currentCost: z.number(),
  optimizedCost: z.number(),
  savingsAmount: z.number(),
  savingsPercentage: z.number(),
});

export type Savings = z.infer<typeof SavingsSchema>;

// Recommendation Types
export const RecommendationSchema = z.object({
  id: z.string(),
  resourceId: z.string(),
  resourceType: z.string(),
  ruleId: z.string(),
  action: z.string(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  estimatedSavings: z.number(),
  description: z.string(),
});

export type Recommendation = z.infer<typeof RecommendationSchema>;
