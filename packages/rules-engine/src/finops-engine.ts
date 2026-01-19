import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { RulesEngine } from './engine.js';
import type { Rule, DetectedIssue } from './types/index.js';
import type { AwsResource } from '@finopsguard/shared';

// ES module equivalent of __dirname
const __dirname = dirname(fileURLToPath(import.meta.url));

// Define resource types locally to avoid circular dependencies
export interface Ec2Instance extends AwsResource {
  instanceId: string;
  instanceType: string;
  state: string;
  launchTime: Date;
  cpuUtilization?: {
    average: number;
    period: string;
  };
}

export interface EbsVolume extends AwsResource {
  volumeId: string;
  size: number;
  volumeType: string;
  state: string;
  attached: boolean;
  attachmentInstanceId?: string;
  createTime: Date;
  encrypted: boolean;
}

export interface EbsSnapshot extends AwsResource {
  snapshotId: string;
  volumeId?: string;
  volumeSize: number;
  state: string;
  startTime: Date;
  ageInDays: number;
  encrypted: boolean;
  description?: string;
}

export class FinOpsRulesEngine {
  private engine: RulesEngine;
  private rules: Rule[] = [];

  constructor(rulesPath?: string) {
    this.engine = new RulesEngine();
    this.loadRulesFromFile(rulesPath);
  }

  /**
   * Load rules from JSON file
   */
  loadRulesFromFile(rulesPath?: string): void {
    const path = rulesPath || join(__dirname, 'rules', 'rules.json');
    try {
      const rulesJson = JSON.parse(readFileSync(path, 'utf-8')) as Rule[];
      this.rules = rulesJson;
      this.engine.loadRules(rulesJson);
    } catch (error) {
      throw new Error(
        `Failed to load rules from ${path}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Load rules from array
   */
  loadRules(rules: Rule[]): void {
    this.rules = rules;
    this.engine.loadRules(rules);
  }

  /**
   * Evaluate EC2 instances against FinOps rules
   */
  evaluateEc2Instances(instances: Ec2Instance[]): DetectedIssue[] {
    const issues: DetectedIssue[] = [];

    for (const instance of instances) {
      // Check idle_ec2 rule
      if (this.isIdleEc2(instance)) {
        issues.push({
          ruleId: 'idle_ec2',
          resourceId: instance.instanceId,
          resourceType: 'ec2',
          issueDescription: `EC2 instance ${instance.instanceId} has CPU utilization below 5% for 7 days`,
          riskLevel: 'medium',
          ruleName: 'Idle EC2 Instance',
          action: 'stop',
        });
      }
    }

    return issues;
  }

  /**
   * Evaluate EBS volumes against FinOps rules
   */
  evaluateEbsVolumes(volumes: EbsVolume[]): DetectedIssue[] {
    const issues: DetectedIssue[] = [];

    for (const volume of volumes) {
      // Check unattached_ebs rule
      if (this.isUnattachedEbs(volume)) {
        issues.push({
          ruleId: 'unattached_ebs',
          resourceId: volume.volumeId,
          resourceType: 'ebs-volume',
          issueDescription: `EBS volume ${volume.volumeId} (${volume.size}GB) is not attached to any instance`,
          riskLevel: 'high',
          ruleName: 'Unattached EBS Volume',
          action: 'delete',
        });
      }
    }

    return issues;
  }

  /**
   * Evaluate EBS snapshots against FinOps rules
   */
  evaluateEbsSnapshots(snapshots: EbsSnapshot[]): DetectedIssue[] {
    const issues: DetectedIssue[] = [];

    for (const snapshot of snapshots) {
      // Check old_snapshot rule
      if (this.isOldSnapshot(snapshot)) {
        issues.push({
          ruleId: 'old_snapshot',
          resourceId: snapshot.snapshotId,
          resourceType: 'ebs-snapshot',
          issueDescription: `EBS snapshot ${snapshot.snapshotId} is ${snapshot.ageInDays} days old (${snapshot.volumeSize}GB)`,
          riskLevel: 'low',
          ruleName: 'Old EBS Snapshot',
          action: 'delete',
        });
      }
    }

    return issues;
  }

  /**
   * Evaluate all resources and return detected issues
   */
  evaluateAllResources(options: {
    ec2Instances?: Ec2Instance[];
    ebsVolumes?: EbsVolume[];
    ebsSnapshots?: EbsSnapshot[];
  }): DetectedIssue[] {
    const issues: DetectedIssue[] = [];

    if (options.ec2Instances) {
      issues.push(...this.evaluateEc2Instances(options.ec2Instances));
    }

    if (options.ebsVolumes) {
      issues.push(...this.evaluateEbsVolumes(options.ebsVolumes));
    }

    if (options.ebsSnapshots) {
      issues.push(...this.evaluateEbsSnapshots(options.ebsSnapshots));
    }

    return issues;
  }

  /**
   * Check if EC2 instance is idle (CPU < 5% for 7 days)
   */
  private isIdleEc2(instance: Ec2Instance): boolean {
    // Must be running
    if (instance.state !== 'running') {
      return false;
    }

    // Must have CPU utilization data
    if (!instance.cpuUtilization) {
      return false;
    }

    // CPU must be below 5%
    return instance.cpuUtilization.average < 5;
  }

  /**
   * Check if EBS volume is unattached
   */
  private isUnattachedEbs(volume: EbsVolume): boolean {
    // Volume must be available and not attached
    return volume.state === 'available' && !volume.attached;
  }

  /**
   * Check if snapshot is old (> 30 days)
   */
  private isOldSnapshot(snapshot: EbsSnapshot): boolean {
    // Snapshot must be completed
    if (snapshot.state !== 'completed') {
      return false;
    }

    // Age must be greater than 30 days
    return snapshot.ageInDays > 30;
  }

  /**
   * Get all enabled rules
   */
  getRules(): Rule[] {
    return this.rules.filter((rule) => rule.enabled);
  }

  /**
   * Get rule by ID
   */
  getRule(ruleId: string): Rule | undefined {
    return this.rules.find((rule) => rule.id === ruleId);
  }
}
