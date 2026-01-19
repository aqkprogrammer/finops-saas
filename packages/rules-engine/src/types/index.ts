import { AwsResource, Recommendation } from '@finopsguard/shared';

export interface Rule {
  id: string;
  name: string;
  description: string;
  resourceType: string;
  condition: RuleCondition;
  action: RuleAction;
  priority: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
}

export interface RuleCondition {
  field: string;
  operator: 'equals' | 'notEquals' | 'greaterThan' | 'lessThan' | 'contains' | 'exists';
  value: string | number | boolean;
}

export interface RuleAction {
  type: string;
  parameters: Record<string, unknown>;
}

export interface RuleEvaluationResult {
  rule: Rule;
  resource: AwsResource;
  matches: boolean;
  recommendation?: Recommendation;
}

export interface DetectedIssue {
  ruleId: string;
  resourceId: string;
  resourceType: string;
  issueDescription: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  ruleName: string;
  action: string;
}
