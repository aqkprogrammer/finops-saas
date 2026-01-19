import type { DetectedIssue } from '@finopsguard/rules-engine';

/**
 * EC2 instance type to monthly cost mapping (USD)
 * Conservative estimates based on us-east-1 Linux On-Demand pricing
 * Prices are per month (730 hours)
 */
const EC2_INSTANCE_PRICING: Record<string, number> = {
  // General Purpose
  't2.micro': 8.76,
  't2.small': 17.52,
  't2.medium': 35.04,
  't2.large': 70.08,
  't2.xlarge': 140.16,
  't2.2xlarge': 280.32,
  't3.micro': 7.30,
  't3.small': 14.60,
  't3.medium': 29.20,
  't3.large': 58.40,
  't3.xlarge': 116.80,
  't3.2xlarge': 233.60,
  't3a.micro': 6.57,
  't3a.small': 13.14,
  't3a.medium': 26.28,
  't3a.large': 52.56,
  't3a.xlarge': 105.12,
  't3a.2xlarge': 210.24,
  't4g.micro': 5.84,
  't4g.small': 11.68,
  't4g.medium': 23.36,
  't4g.large': 46.72,
  't4g.xlarge': 93.44,
  't4g.2xlarge': 186.88,
  'm5.large': 77.70,
  'm5.xlarge': 155.40,
  'm5.2xlarge': 310.80,
  'm5.4xlarge': 621.60,
  'm5.8xlarge': 1243.20,
  'm5.12xlarge': 1864.80,
  'm5.16xlarge': 2486.40,
  'm5.24xlarge': 3729.60,
  'm5a.large': 69.93,
  'm5a.xlarge': 139.86,
  'm5a.2xlarge': 279.72,
  'm5a.4xlarge': 559.44,
  'm5a.8xlarge': 1118.88,
  'm5a.12xlarge': 1678.32,
  'm5a.16xlarge': 2237.76,
  'm5a.24xlarge': 3356.64,
  'm6i.large': 77.70,
  'm6i.xlarge': 155.40,
  'm6i.2xlarge': 310.80,
  'm6i.4xlarge': 621.60,
  'm6i.8xlarge': 1243.20,
  'm6i.12xlarge': 1864.80,
  'm6i.16xlarge': 2486.40,
  'm6i.24xlarge': 3729.60,
  'm6i.32xlarge': 4972.80,
  // Compute Optimized
  'c5.large': 77.70,
  'c5.xlarge': 155.40,
  'c5.2xlarge': 310.80,
  'c5.4xlarge': 621.60,
  'c5.9xlarge': 1398.60,
  'c5.12xlarge': 1864.80,
  'c5.18xlarge': 2797.20,
  'c5.24xlarge': 3729.60,
  'c5a.large': 69.93,
  'c5a.xlarge': 139.86,
  'c5a.2xlarge': 279.72,
  'c5a.4xlarge': 559.44,
  'c5a.8xlarge': 1118.88,
  'c5a.12xlarge': 1678.32,
  'c5a.16xlarge': 2237.76,
  'c5a.24xlarge': 3356.64,
  'c6i.large': 77.70,
  'c6i.xlarge': 155.40,
  'c6i.2xlarge': 310.80,
  'c6i.4xlarge': 621.60,
  'c6i.8xlarge': 1243.20,
  'c6i.12xlarge': 1864.80,
  'c6i.16xlarge': 2486.40,
  'c6i.24xlarge': 3729.60,
  'c6i.32xlarge': 4972.80,
  // Memory Optimized
  'r5.large': 126.48,
  'r5.xlarge': 252.96,
  'r5.2xlarge': 505.92,
  'r5.4xlarge': 1011.84,
  'r5.8xlarge': 2023.68,
  'r5.12xlarge': 3035.52,
  'r5.16xlarge': 4047.36,
  'r5.24xlarge': 6071.04,
  'r5a.large': 113.83,
  'r5a.xlarge': 227.66,
  'r5a.2xlarge': 455.32,
  'r5a.4xlarge': 910.64,
  'r5a.8xlarge': 1821.28,
  'r5a.12xlarge': 2731.92,
  'r5a.16xlarge': 3642.56,
  'r5a.24xlarge': 5463.84,
  'r6i.large': 126.48,
  'r6i.xlarge': 252.96,
  'r6i.2xlarge': 505.92,
  'r6i.4xlarge': 1011.84,
  'r6i.8xlarge': 2023.68,
  'r6i.12xlarge': 3035.52,
  'r6i.16xlarge': 4047.36,
  'r6i.24xlarge': 6071.04,
  'r6i.32xlarge': 8094.72,
  // Storage Optimized
  'i3.large': 156.00,
  'i3.xlarge': 312.00,
  'i3.2xlarge': 624.00,
  'i3.4xlarge': 1248.00,
  'i3.8xlarge': 2496.00,
  'i3.16xlarge': 4992.00,
  // GPU Instances
  'p3.2xlarge': 3066.00,
  'p3.8xlarge': 12264.00,
  'p3.16xlarge': 24528.00,
  'g4dn.xlarge': 526.50,
  'g4dn.2xlarge': 1053.00,
  'g4dn.4xlarge': 2106.00,
  'g4dn.8xlarge': 4212.00,
  'g4dn.12xlarge': 6318.00,
  'g4dn.16xlarge': 8424.00,
};

/**
 * EBS volume pricing per GB per month (us-east-1)
 */
const EBS_GP3_PRICE_PER_GB_MONTH = 0.08; // gp3 general purpose SSD
const EBS_GP2_PRICE_PER_GB_MONTH = 0.10; // gp2 general purpose SSD
const EBS_IO1_PRICE_PER_GB_MONTH = 0.125; // io1 provisioned IOPS SSD
const EBS_ST1_PRICE_PER_GB_MONTH = 0.045; // st1 throughput optimized HDD
const EBS_SC1_PRICE_PER_GB_MONTH = 0.025; // sc1 cold HDD

/**
 * EBS snapshot pricing per GB per month (us-east-1)
 */
const EBS_SNAPSHOT_PRICE_PER_GB_MONTH = 0.05;

/**
 * Get monthly cost for EC2 instance type
 */
function getEc2MonthlyCost(instanceType: string): number {
  const normalizedType = instanceType.toLowerCase();
  return EC2_INSTANCE_PRICING[normalizedType] || 100; // Default conservative estimate
}

/**
 * Get monthly cost for EBS volume based on type and size
 */
function getEbsVolumeMonthlyCost(volumeType: string, sizeGB: number): number {
  const normalizedType = volumeType.toLowerCase();
  let pricePerGB = EBS_GP3_PRICE_PER_GB_MONTH;

  if (normalizedType.includes('gp2')) {
    pricePerGB = EBS_GP2_PRICE_PER_GB_MONTH;
  } else if (normalizedType.includes('io1') || normalizedType.includes('io2')) {
    pricePerGB = EBS_IO1_PRICE_PER_GB_MONTH;
  } else if (normalizedType.includes('st1')) {
    pricePerGB = EBS_ST1_PRICE_PER_GB_MONTH;
  } else if (normalizedType.includes('sc1')) {
    pricePerGB = EBS_SC1_PRICE_PER_GB_MONTH;
  }

  return sizeGB * pricePerGB;
}

/**
 * Get monthly cost for EBS snapshot
 */
function getEbsSnapshotMonthlyCost(sizeGB: number): number {
  return sizeGB * EBS_SNAPSHOT_PRICE_PER_GB_MONTH;
}

export interface RuleSavings {
  ruleId: string;
  ruleName: string;
  resourceId: string;
  resourceType: string;
  currentMonthlyCost: number;
  potentialMonthlySavings: number;
  savingsPercentage: number;
}

export interface SavingsSummary {
  totalMonthlySavings: number;
  totalAnnualSavings: number;
  ruleBreakdown: Record<string, {
    count: number;
    monthlySavings: number;
    annualSavings: number;
  }>;
  resourceBreakdown: RuleSavings[];
}

export class SavingsCalculator {
  /**
   * Calculate potential savings for a detected issue
   */
  calculateSavingsForIssue(issue: DetectedIssue, resourceData?: {
    instanceType?: string;
    volumeSize?: number;
    volumeType?: string;
    snapshotSize?: number;
  }): RuleSavings {
    let currentMonthlyCost = 0;
    let potentialMonthlySavings = 0;

    switch (issue.ruleId) {
      case 'idle_ec2': {
        // Stopping an idle EC2 instance saves 100% of compute cost
        // Conservative: Assume 90% savings (accounting for potential data transfer, etc.)
        const instanceType = resourceData?.instanceType || 't3.medium';
        currentMonthlyCost = getEc2MonthlyCost(instanceType);
        potentialMonthlySavings = currentMonthlyCost * 0.9; // 90% savings
        break;
      }

      case 'unattached_ebs': {
        // Deleting an unattached volume saves 100% of storage cost
        const volumeSize = resourceData?.volumeSize || 20;
        const volumeType = resourceData?.volumeType || 'gp3';
        currentMonthlyCost = getEbsVolumeMonthlyCost(volumeType, volumeSize);
        potentialMonthlySavings = currentMonthlyCost; // 100% savings
        break;
      }

      case 'old_snapshot': {
        // Deleting an old snapshot saves 100% of snapshot storage cost
        const snapshotSize = resourceData?.snapshotSize || 20;
        currentMonthlyCost = getEbsSnapshotMonthlyCost(snapshotSize);
        potentialMonthlySavings = currentMonthlyCost; // 100% savings
        break;
      }

      default:
        // Unknown rule - conservative estimate
        currentMonthlyCost = 50;
        potentialMonthlySavings = currentMonthlyCost * 0.8; // 80% savings
    }

    const savingsPercentage =
      currentMonthlyCost > 0
        ? Math.round((potentialMonthlySavings / currentMonthlyCost) * 100 * 100) / 100
        : 0;

    return {
      ruleId: issue.ruleId,
      ruleName: issue.ruleName,
      resourceId: issue.resourceId,
      resourceType: issue.resourceType,
      currentMonthlyCost: Math.round(currentMonthlyCost * 100) / 100,
      potentialMonthlySavings: Math.round(potentialMonthlySavings * 100) / 100,
      savingsPercentage,
    };
  }

  /**
   * Calculate savings summary for multiple issues
   */
  calculateSavingsSummary(
    issues: DetectedIssue[],
    resourceDataMap?: Map<string, {
      instanceType?: string;
      volumeSize?: number;
      volumeType?: string;
      snapshotSize?: number;
    }>
  ): SavingsSummary {
    const resourceBreakdown: RuleSavings[] = [];
    const ruleBreakdown: Record<string, {
      count: number;
      monthlySavings: number;
      annualSavings: number;
    }> = {};

    let totalMonthlySavings = 0;

    for (const issue of issues) {
      const resourceData = resourceDataMap?.get(issue.resourceId);
      const savings = this.calculateSavingsForIssue(issue, resourceData);
      
      resourceBreakdown.push(savings);
      totalMonthlySavings += savings.potentialMonthlySavings;

      // Aggregate by rule
      if (!ruleBreakdown[issue.ruleId]) {
        ruleBreakdown[issue.ruleId] = {
          count: 0,
          monthlySavings: 0,
          annualSavings: 0,
        };
      }

      ruleBreakdown[issue.ruleId].count++;
      ruleBreakdown[issue.ruleId].monthlySavings += savings.potentialMonthlySavings;
      ruleBreakdown[issue.ruleId].annualSavings = ruleBreakdown[issue.ruleId].monthlySavings * 12;
    }

    // Round totals
    totalMonthlySavings = Math.round(totalMonthlySavings * 100) / 100;
    const totalAnnualSavings = Math.round(totalMonthlySavings * 12 * 100) / 100;

    // Round rule breakdown values
    for (const ruleId in ruleBreakdown) {
      ruleBreakdown[ruleId].monthlySavings = Math.round(ruleBreakdown[ruleId].monthlySavings * 100) / 100;
      ruleBreakdown[ruleId].annualSavings = Math.round(ruleBreakdown[ruleId].annualSavings * 100) / 100;
    }

    return {
      totalMonthlySavings,
      totalAnnualSavings,
      ruleBreakdown,
      resourceBreakdown,
    };
  }

  /**
   * Get EC2 instance monthly cost (public method for external use)
   */
  getEc2MonthlyCost(instanceType: string): number {
    return getEc2MonthlyCost(instanceType);
  }

  /**
   * Get EBS volume monthly cost (public method for external use)
   */
  getEbsVolumeMonthlyCost(volumeType: string, sizeGB: number): number {
    return getEbsVolumeMonthlyCost(volumeType, sizeGB);
  }

  /**
   * Get EBS snapshot monthly cost (public method for external use)
   */
  getEbsSnapshotMonthlyCost(sizeGB: number): number {
    return getEbsSnapshotMonthlyCost(sizeGB);
  }
}
