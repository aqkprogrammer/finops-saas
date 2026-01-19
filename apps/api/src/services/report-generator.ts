import type { ScanResult } from './scan-service.js';
import type { DetectedIssue } from '@finopsguard/rules-engine';

export interface ReportOptions {
  companyName?: string;
  reportTitle?: string;
  includeCharts?: boolean;
}

/**
 * HTML Report Generator for Cost Optimization Reports
 * Generates printable and email-friendly HTML reports
 */
export class ReportGenerator {
  /**
   * Generate HTML cost optimization report from scan result
   */
  generateReport(scanResult: ScanResult, options: ReportOptions = {}): string {
    const {
      companyName = 'Your Organization',
      reportTitle = 'AWS Cost Optimization Report',
      includeCharts = false,
    } = options;

    const issuesByRiskLevel = this.groupIssuesByRiskLevel(scanResult.issues);
    const issuesByRule = this.groupIssuesByRule(scanResult.issues);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${reportTitle}</title>
  <style>
    ${this.getStyles()}
  </style>
</head>
<body>
  <div class="container">
    ${this.generateHeader(companyName, reportTitle, scanResult)}
    ${this.generateExecutiveSummary(scanResult)}
    ${this.generateSpendBreakdown(scanResult)}
    ${this.generateDetectedIssues(scanResult, issuesByRiskLevel, issuesByRule)}
    ${this.generateRecommendedActions(scanResult, issuesByRule)}
    ${this.generateEstimatedSavings(scanResult)}
    ${this.generateFooter(scanResult)}
  </div>
</body>
</html>`;
  }

  /**
   * Generate report header
   */
  private generateHeader(companyName: string, title: string, scanResult: ScanResult): string {
    const scanDate = new Date(scanResult.timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return `
    <header class="report-header">
      <div class="header-content">
        <h1>${title}</h1>
        <div class="header-meta">
          <div class="meta-item">
            <strong>Organization:</strong> ${companyName}
          </div>
          <div class="meta-item">
            <strong>Region:</strong> ${scanResult.region}
          </div>
          <div class="meta-item">
            <strong>Scan Date:</strong> ${scanDate}
          </div>
          <div class="meta-item">
            <strong>Scan ID:</strong> ${scanResult.scanId}
          </div>
        </div>
      </div>
    </header>`;
  }

  /**
   * Generate executive summary section
   */
  private generateExecutiveSummary(scanResult: ScanResult): string {
    const savingsPercentage = scanResult.costSummary.totalCost > 0
      ? ((scanResult.savings.totalMonthlySavings / scanResult.costSummary.totalCost) * 100).toFixed(1)
      : '0';

    return `
    <section class="executive-summary">
      <h2>Executive Summary</h2>
      <div class="summary-grid">
        <div class="summary-card primary">
          <div class="summary-label">Monthly Spend</div>
          <div class="summary-value">${this.formatCurrency(scanResult.costSummary.totalCost, scanResult.costSummary.currency)}</div>
        </div>
        <div class="summary-card success">
          <div class="summary-label">Potential Monthly Savings</div>
          <div class="summary-value">${this.formatCurrency(scanResult.savings.totalMonthlySavings, scanResult.costSummary.currency)}</div>
          <div class="summary-subtext">${savingsPercentage}% of total spend</div>
        </div>
        <div class="summary-card warning">
          <div class="summary-label">Potential Annual Savings</div>
          <div class="summary-value">${this.formatCurrency(scanResult.savings.totalAnnualSavings, scanResult.costSummary.currency)}</div>
        </div>
        <div class="summary-card info">
          <div class="summary-label">Issues Detected</div>
          <div class="summary-value">${scanResult.issues.length}</div>
          <div class="summary-subtext">${this.getIssuesBreakdownText(scanResult.issues)}</div>
        </div>
      </div>
      <div class="summary-text">
        <p>
          This report analyzes your AWS infrastructure costs and identifies optimization opportunities.
          Based on the scan conducted on <strong>${new Date(scanResult.timestamp).toLocaleDateString()}</strong>,
          we've identified <strong>${scanResult.issues.length} cost optimization opportunities</strong> that could
          result in <strong>${this.formatCurrency(scanResult.savings.totalMonthlySavings, scanResult.costSummary.currency)}</strong>
          in monthly savings, or <strong>${this.formatCurrency(scanResult.savings.totalAnnualSavings, scanResult.costSummary.currency)}</strong> annually.
        </p>
      </div>
    </section>`;
  }

  /**
   * Generate monthly spend breakdown section
   */
  private generateSpendBreakdown(scanResult: ScanResult): string {
    const topServices = scanResult.costSummary.services.slice(0, 10);
    const otherServices = scanResult.costSummary.services.slice(10);
    const otherTotal = otherServices.reduce((sum, s) => sum + s.cost, 0);
    const otherPercentage = scanResult.costSummary.totalCost > 0
      ? ((otherTotal / scanResult.costSummary.totalCost) * 100).toFixed(1)
      : '0';

    let servicesRows = topServices.map(service => `
        <tr>
          <td>${this.escapeHtml(service.service)}</td>
          <td class="text-right">${this.formatCurrency(service.cost, scanResult.costSummary.currency)}</td>
          <td class="text-right">${service.percentage.toFixed(1)}%</td>
        </tr>`).join('');

    if (otherServices.length > 0) {
      servicesRows += `
        <tr class="other-row">
          <td><em>Other Services (${otherServices.length})</em></td>
          <td class="text-right">${this.formatCurrency(otherTotal, scanResult.costSummary.currency)}</td>
          <td class="text-right">${otherPercentage}%</td>
        </tr>`;
    }

    return `
    <section class="spend-breakdown">
      <h2>Monthly Spend Breakdown</h2>
      <p class="section-description">
        Analysis period: <strong>${scanResult.costSummary.period.start}</strong> to 
        <strong>${scanResult.costSummary.period.end}</strong> 
        (${scanResult.costSummary.period.days} days, normalized to monthly)
      </p>
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Service</th>
              <th class="text-right">Monthly Cost</th>
              <th class="text-right">% of Total</th>
            </tr>
          </thead>
          <tbody>
            ${servicesRows}
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td><strong>Total</strong></td>
              <td class="text-right"><strong>${this.formatCurrency(scanResult.costSummary.totalCost, scanResult.costSummary.currency)}</strong></td>
              <td class="text-right"><strong>100%</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>`;
  }

  /**
   * Generate detected issues section
   */
  private generateDetectedIssues(
    scanResult: ScanResult,
    issuesByRiskLevel: Record<string, DetectedIssue[]>,
    issuesByRule: Record<string, DetectedIssue[]>
  ): string {
    const riskLevelOrder = ['critical', 'high', 'medium', 'low'];
    const riskLevelLabels: Record<string, string> = {
      critical: 'Critical',
      high: 'High',
      medium: 'Medium',
      low: 'Low',
    };

    let issuesContent = '';

    // Summary by risk level
    issuesContent += `
      <div class="issues-summary">
        <h3>Issues by Risk Level</h3>
        <div class="risk-level-grid">`;

    for (const level of riskLevelOrder) {
      const issues = issuesByRiskLevel[level] || [];
      if (issues.length > 0) {
        issuesContent += `
          <div class="risk-level-card risk-${level}">
            <div class="risk-level-label">${riskLevelLabels[level]}</div>
            <div class="risk-level-count">${issues.length}</div>
          </div>`;
      }
    }

    issuesContent += `
        </div>
      </div>`;

    // Detailed issues table
    issuesContent += `
      <div class="issues-details">
        <h3>Detailed Issues</h3>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Risk</th>
                <th>Rule</th>
                <th>Resource ID</th>
                <th>Resource Type</th>
                <th>Issue Description</th>
                <th>Recommended Action</th>
              </tr>
            </thead>
            <tbody>`;

    for (const level of riskLevelOrder) {
      const issues = issuesByRiskLevel[level] || [];
      for (const issue of issues) {
        issuesContent += `
              <tr class="risk-${level}-row">
                <td><span class="risk-badge risk-${level}">${riskLevelLabels[level]}</span></td>
                <td>${this.escapeHtml(issue.ruleName)}</td>
                <td><code>${this.escapeHtml(issue.resourceId)}</code></td>
                <td>${this.escapeHtml(issue.resourceType)}</td>
                <td>${this.escapeHtml(issue.issueDescription)}</td>
                <td>${this.escapeHtml(issue.action)}</td>
              </tr>`;
      }
    }

    issuesContent += `
            </tbody>
          </table>
        </div>
      </div>`;

    return `
    <section class="detected-issues">
      <h2>Detected Issues</h2>
      <p class="section-description">
        Found <strong>${scanResult.issues.length}</strong> cost optimization opportunities across your AWS resources.
      </p>
      ${issuesContent}
    </section>`;
  }

  /**
   * Generate recommended actions section
   */
  private generateRecommendedActions(
    scanResult: ScanResult,
    issuesByRule: Record<string, DetectedIssue[]>
  ): string {
    const ruleIds = Object.keys(scanResult.savings.ruleBreakdown).sort((a, b) => {
      const savingsA = scanResult.savings.ruleBreakdown[a].monthlySavings;
      const savingsB = scanResult.savings.ruleBreakdown[b].monthlySavings;
      return savingsB - savingsA;
    });

    let actionsContent = '';

    for (const ruleId of ruleIds) {
      const breakdown = scanResult.savings.ruleBreakdown[ruleId];
      const issues = issuesByRule[ruleId] || [];
      const firstIssue = issues[0];
      const ruleName = firstIssue?.ruleName || ruleId;

      actionsContent += `
        <div class="action-card">
          <div class="action-header">
            <h3>${this.escapeHtml(ruleName)}</h3>
            <div class="action-savings">
              ${this.formatCurrency(breakdown.monthlySavings, scanResult.costSummary.currency)}/mo
            </div>
          </div>
          <div class="action-body">
            <div class="action-stats">
              <div class="stat">
                <span class="stat-label">Affected Resources:</span>
                <span class="stat-value">${breakdown.count}</span>
              </div>
              <div class="stat">
                <span class="stat-label">Monthly Savings:</span>
                <span class="stat-value">${this.formatCurrency(breakdown.monthlySavings, scanResult.costSummary.currency)}</span>
              </div>
              <div class="stat">
                <span class="stat-label">Annual Savings:</span>
                <span class="stat-value">${this.formatCurrency(breakdown.annualSavings, scanResult.costSummary.currency)}</span>
              </div>
            </div>
            <div class="action-description">
              <strong>Action:</strong> ${this.getActionDescription(firstIssue?.action || 'review')}
            </div>
            <div class="action-resources">
              <strong>Resources:</strong>
              <ul>
                ${issues.slice(0, 5).map(issue => `<li><code>${this.escapeHtml(issue.resourceId)}</code></li>`).join('')}
                ${issues.length > 5 ? `<li><em>... and ${issues.length - 5} more</em></li>` : ''}
              </ul>
            </div>
          </div>
        </div>`;
    }

    return `
    <section class="recommended-actions">
      <h2>Recommended Actions</h2>
      <p class="section-description">
        Prioritized list of actions to optimize your AWS costs, ordered by potential savings impact.
      </p>
      ${actionsContent}
    </section>`;
  }

  /**
   * Generate estimated savings section
   */
  private generateEstimatedSavings(scanResult: ScanResult): string {
    const topSavings = scanResult.savings.resourceBreakdown
      .sort((a, b) => b.potentialMonthlySavings - a.potentialMonthlySavings)
      .slice(0, 10);

    let savingsRows = topSavings.map(saving => `
        <tr>
          <td>${this.escapeHtml(saving.ruleName)}</td>
          <td><code>${this.escapeHtml(saving.resourceId)}</code></td>
          <td class="text-right">${this.formatCurrency(saving.currentMonthlyCost, scanResult.costSummary.currency)}</td>
          <td class="text-right savings-amount">${this.formatCurrency(saving.potentialMonthlySavings, scanResult.costSummary.currency)}</td>
          <td class="text-right">${saving.savingsPercentage.toFixed(1)}%</td>
        </tr>`).join('');

    return `
    <section class="estimated-savings">
      <h2>Estimated Savings</h2>
      <div class="savings-summary">
        <div class="savings-card">
          <div class="savings-label">Total Monthly Savings</div>
          <div class="savings-value">${this.formatCurrency(scanResult.savings.totalMonthlySavings, scanResult.costSummary.currency)}</div>
        </div>
        <div class="savings-card">
          <div class="savings-label">Total Annual Savings</div>
          <div class="savings-value">${this.formatCurrency(scanResult.savings.totalAnnualSavings, scanResult.costSummary.currency)}</div>
        </div>
      </div>
      <p class="section-description">
        Top 10 resources with highest potential savings:
      </p>
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Rule</th>
              <th>Resource ID</th>
              <th class="text-right">Current Cost</th>
              <th class="text-right">Potential Savings</th>
              <th class="text-right">Savings %</th>
            </tr>
          </thead>
          <tbody>
            ${savingsRows}
          </tbody>
        </table>
      </div>
    </section>`;
  }

  /**
   * Generate footer
   */
  private generateFooter(scanResult: ScanResult): string {
    return `
    <footer class="report-footer">
      <div class="footer-content">
        <p>
          <strong>Report Generated:</strong> ${new Date().toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
        <p>
          <strong>Scan ID:</strong> ${scanResult.scanId} | 
          <strong>Region:</strong> ${scanResult.region} |
          <strong>Resources Scanned:</strong> 
          ${scanResult.resourceInventory.ec2Instances} EC2 instances, 
          ${scanResult.resourceInventory.ebsVolumes} EBS volumes, 
          ${scanResult.resourceInventory.ebsSnapshots} EBS snapshots
        </p>
        <p class="footer-note">
          This report is generated automatically based on AWS Cost Explorer data and resource inventory.
          Actual savings may vary based on implementation and usage patterns.
        </p>
      </div>
    </footer>`;
  }

  /**
   * Get CSS styles (inline for email compatibility)
   */
  private getStyles(): string {
    return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
      padding: 20px;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      background-color: #ffffff;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    /* Header */
    .report-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      border-bottom: 4px solid #5568d3;
    }

    .header-content h1 {
      font-size: 32px;
      margin-bottom: 20px;
      font-weight: 600;
    }

    .header-meta {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      font-size: 14px;
    }

    .meta-item {
      opacity: 0.95;
    }

    /* Sections */
    section {
      padding: 40px;
      border-bottom: 1px solid #e0e0e0;
    }

    section:last-of-type {
      border-bottom: none;
    }

    h2 {
      font-size: 28px;
      color: #2d3748;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e2e8f0;
    }

    h3 {
      font-size: 20px;
      color: #4a5568;
      margin-bottom: 15px;
      margin-top: 25px;
    }

    .section-description {
      color: #718096;
      margin-bottom: 25px;
      font-size: 15px;
    }

    /* Executive Summary */
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .summary-card {
      padding: 25px;
      border-radius: 8px;
      text-align: center;
      border: 2px solid #e2e8f0;
    }

    .summary-card.primary {
      background-color: #ebf8ff;
      border-color: #90cdf4;
    }

    .summary-card.success {
      background-color: #f0fff4;
      border-color: #9ae6b4;
    }

    .summary-card.warning {
      background-color: #fffaf0;
      border-color: #fbd38d;
    }

    .summary-card.info {
      background-color: #f7fafc;
      border-color: #cbd5e0;
    }

    .summary-label {
      font-size: 14px;
      color: #718096;
      margin-bottom: 10px;
      font-weight: 500;
    }

    .summary-value {
      font-size: 32px;
      font-weight: 700;
      color: #2d3748;
      margin-bottom: 5px;
    }

    .summary-subtext {
      font-size: 12px;
      color: #a0aec0;
      margin-top: 5px;
    }

    .summary-text {
      background-color: #f7fafc;
      padding: 20px;
      border-radius: 6px;
      border-left: 4px solid #667eea;
    }

    .summary-text p {
      margin: 0;
      line-height: 1.8;
    }

    /* Tables */
    .table-container {
      overflow-x: auto;
      margin-top: 20px;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }

    .data-table thead {
      background-color: #f7fafc;
      border-bottom: 2px solid #e2e8f0;
    }

    .data-table th {
      padding: 12px;
      text-align: left;
      font-weight: 600;
      color: #4a5568;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .data-table th.text-right {
      text-align: right;
    }

    .data-table td {
      padding: 12px;
      border-bottom: 1px solid #e2e8f0;
    }

    .data-table tbody tr:hover {
      background-color: #f7fafc;
    }

    .data-table tfoot {
      background-color: #f7fafc;
      font-weight: 600;
    }

    .data-table code {
      background-color: #edf2f7;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 12px;
    }

    .text-right {
      text-align: right;
    }

    .total-row {
      background-color: #f7fafc;
      font-weight: 600;
    }

    .other-row {
      color: #718096;
      font-style: italic;
    }

    /* Risk Levels */
    .risk-level-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
      margin-bottom: 30px;
    }

    .risk-level-card {
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      border: 2px solid;
    }

    .risk-level-card.risk-critical {
      background-color: #fed7d7;
      border-color: #fc8181;
    }

    .risk-level-card.risk-high {
      background-color: #feebc8;
      border-color: #f6ad55;
    }

    .risk-level-card.risk-medium {
      background-color: #fefcbf;
      border-color: #ecc94b;
    }

    .risk-level-card.risk-low {
      background-color: #c6f6d5;
      border-color: #68d391;
    }

    .risk-level-label {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .risk-level-count {
      font-size: 32px;
      font-weight: 700;
    }

    .risk-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .risk-badge.risk-critical {
      background-color: #fc8181;
      color: white;
    }

    .risk-badge.risk-high {
      background-color: #f6ad55;
      color: white;
    }

    .risk-badge.risk-medium {
      background-color: #ecc94b;
      color: #744210;
    }

    .risk-badge.risk-low {
      background-color: #68d391;
      color: #22543d;
    }

    .risk-critical-row {
      background-color: #fed7d7;
    }

    .risk-high-row {
      background-color: #feebc8;
    }

    .risk-medium-row {
      background-color: #fefcbf;
    }

    .risk-low-row {
      background-color: #c6f6d5;
    }

    /* Action Cards */
    .action-card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      margin-bottom: 20px;
      overflow: hidden;
    }

    .action-header {
      background-color: #f7fafc;
      padding: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #e2e8f0;
    }

    .action-header h3 {
      margin: 0;
      color: #2d3748;
    }

    .action-savings {
      font-size: 20px;
      font-weight: 700;
      color: #38a169;
    }

    .action-body {
      padding: 20px;
    }

    .action-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
      margin-bottom: 20px;
    }

    .stat {
      display: flex;
      justify-content: space-between;
      padding: 10px;
      background-color: #f7fafc;
      border-radius: 4px;
    }

    .stat-label {
      color: #718096;
      font-size: 13px;
    }

    .stat-value {
      font-weight: 600;
      color: #2d3748;
    }

    .action-description {
      margin-bottom: 15px;
      padding: 15px;
      background-color: #edf2f7;
      border-radius: 4px;
      border-left: 4px solid #667eea;
    }

    .action-resources ul {
      list-style: none;
      padding-left: 0;
    }

    .action-resources li {
      padding: 5px 0;
      padding-left: 20px;
      position: relative;
    }

    .action-resources li:before {
      content: "•";
      position: absolute;
      left: 0;
      color: #667eea;
      font-weight: bold;
    }

    /* Savings */
    .savings-summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .savings-card {
      padding: 25px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 8px;
      text-align: center;
    }

    .savings-label {
      font-size: 14px;
      opacity: 0.9;
      margin-bottom: 10px;
    }

    .savings-value {
      font-size: 36px;
      font-weight: 700;
    }

    .savings-amount {
      color: #38a169;
      font-weight: 600;
    }

    /* Footer */
    .report-footer {
      background-color: #f7fafc;
      padding: 30px 40px;
      border-top: 2px solid #e2e8f0;
      font-size: 13px;
      color: #718096;
    }

    .footer-content p {
      margin-bottom: 10px;
    }

    .footer-note {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      font-style: italic;
      font-size: 12px;
    }

    /* Print Styles */
    @media print {
      body {
        background-color: white;
        padding: 0;
      }

      .container {
        box-shadow: none;
      }

      section {
        page-break-inside: avoid;
      }

      .action-card {
        page-break-inside: avoid;
      }

      .data-table {
        font-size: 11px;
      }

      .data-table th,
      .data-table td {
        padding: 8px;
      }

      .report-footer {
        page-break-inside: avoid;
      }
    }
    `;
  }

  /**
   * Helper methods
   */
  private groupIssuesByRiskLevel(issues: DetectedIssue[]): Record<string, DetectedIssue[]> {
    const grouped: Record<string, DetectedIssue[]> = {};
    for (const issue of issues) {
      const level = issue.riskLevel;
      if (!grouped[level]) {
        grouped[level] = [];
      }
      grouped[level].push(issue);
    }
    return grouped;
  }

  private groupIssuesByRule(issues: DetectedIssue[]): Record<string, DetectedIssue[]> {
    const grouped: Record<string, DetectedIssue[]> = {};
    for (const issue of issues) {
      const ruleId = issue.ruleId;
      if (!grouped[ruleId]) {
        grouped[ruleId] = [];
      }
      grouped[ruleId].push(issue);
    }
    return grouped;
  }

  private getIssuesBreakdownText(issues: DetectedIssue[]): string {
    const counts: Record<string, number> = {};
    for (const issue of issues) {
      counts[issue.riskLevel] = (counts[issue.riskLevel] || 0) + 1;
    }
    const parts: string[] = [];
    if (counts.critical) parts.push(`${counts.critical} critical`);
    if (counts.high) parts.push(`${counts.high} high`);
    if (counts.medium) parts.push(`${counts.medium} medium`);
    if (counts.low) parts.push(`${counts.low} low`);
    return parts.join(', ');
  }

  private getActionDescription(action: string): string {
    const descriptions: Record<string, string> = {
      stop: 'Stop the resource to eliminate compute costs. Data will be preserved.',
      delete: 'Delete the resource to eliminate storage costs. This action is irreversible.',
      review: 'Review the resource to determine if it\'s still needed.',
      resize: 'Resize the resource to match actual usage requirements.',
    };
    return descriptions[action.toLowerCase()] || `Perform action: ${action}`;
  }

  private formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }
}
