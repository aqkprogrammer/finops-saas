import type { AwsResource, Recommendation } from '@finopsguard/shared';
import type { Rule, RuleCondition, RuleEvaluationResult } from './types/index.js';
import { generateId } from '@finopsguard/shared';

export class RulesEngine {
  private rules: Rule[] = [];

  /**
   * Load rules from JSON configuration
   */
  loadRules(rulesJson: Rule[]): void {
    this.rules = rulesJson.filter((rule) => rule.enabled);
  }

  /**
   * Evaluate a single rule against a resource
   */
  evaluateRule(rule: Rule, resource: AwsResource): RuleEvaluationResult {
    const matches = this.checkCondition(rule.condition, resource);

    let recommendation: Recommendation | undefined;

    if (matches) {
      recommendation = {
        id: generateId(),
        resourceId: resource.id,
        resourceType: resource.type,
        ruleId: rule.id,
        action: rule.action.type,
        priority: rule.priority,
        estimatedSavings: 0, // Will be calculated by pricing package
        description: rule.description,
      };
    }

    return {
      rule,
      resource,
      matches,
      recommendation,
    };
  }

  /**
   * Evaluate all rules against a resource
   */
  evaluateResource(resource: AwsResource): RuleEvaluationResult[] {
    return this.rules
      .filter((rule) => rule.resourceType === resource.type || rule.resourceType === '*')
      .map((rule) => this.evaluateRule(rule, resource));
  }

  /**
   * Evaluate all rules against multiple resources
   */
  evaluateResources(resources: AwsResource[]): RuleEvaluationResult[] {
    const results: RuleEvaluationResult[] = [];

    for (const resource of resources) {
      results.push(...this.evaluateResource(resource));
    }

    return results.filter((result) => result.matches);
  }

  /**
   * Check if a condition matches a resource
   */
  private checkCondition(
    condition: RuleCondition,
    resource: AwsResource
  ): boolean {
    const fieldValue = this.getFieldValue(resource, condition.field);

    if (fieldValue === undefined && condition.operator !== 'exists') {
      return false;
    }

    switch (condition.operator) {
      case 'equals':
        return String(fieldValue) === String(condition.value);
      case 'notEquals':
        return String(fieldValue) !== String(condition.value);
      case 'greaterThan':
        return Number(fieldValue) > Number(condition.value);
      case 'lessThan':
        return Number(fieldValue) < Number(condition.value);
      case 'contains':
        return String(fieldValue).includes(String(condition.value));
      case 'exists':
        return fieldValue !== undefined;
      default:
        return false;
    }
  }

  /**
   * Get field value from resource (supports nested fields and tags)
   */
  private getFieldValue(resource: AwsResource, field: string): unknown {
    if (field.startsWith('tags.')) {
      const tagKey = field.replace('tags.', '');
      return resource.tags?.[tagKey];
    }

    return (resource as Record<string, unknown>)[field];
  }
}
