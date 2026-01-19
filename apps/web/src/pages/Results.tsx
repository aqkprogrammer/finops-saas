import { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCustomer } from '../contexts/CustomerContext';
import Header from '../components/Header';
import Footer from '../components/Footer';

interface ScanResult {
  scanId: string;
  timestamp: string;
  region: string;
  costSummary: {
    totalCost: number;
    currency: string;
    period: {
      start: string;
      end: string;
      days: number;
    };
  };
  savings: {
    totalMonthlySavings: number;
    totalAnnualSavings: number;
  };
  issues: Array<{
    ruleId: string;
    ruleName: string;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    resourceId: string;
    resourceType: string;
    issueDescription: string;
    action: string;
  }>;
  limited?: boolean;
  message?: string;
}

// Test data for demonstration
const getTestData = (): ScanResult => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return {
    scanId: 'test-scan-12345',
    timestamp: now.toISOString(),
    region: 'us-east-1',
    costSummary: {
      totalCost: 12450.75,
      currency: 'USD',
      period: {
        start: thirtyDaysAgo.toISOString(),
        end: now.toISOString(),
        days: 30,
      },
    },
    savings: {
      totalMonthlySavings: 3420.50,
      totalAnnualSavings: 41046.00,
    },
    issues: [
      {
        ruleId: 'ec2-idle-instances',
        ruleName: 'Idle EC2 Instances',
        riskLevel: 'critical',
        resourceId: 'i-0123456789abcdef0',
        resourceType: 'EC2 Instance',
        issueDescription: 'EC2 instance has been running for 90+ days with less than 5% CPU utilization. This instance appears to be idle and is incurring unnecessary costs.',
        action: 'Consider stopping or terminating this instance if it\'s no longer needed. Alternatively, migrate to a smaller instance type or use EC2 Auto Scaling.',
      },
      {
        ruleId: 'rds-overprovisioned',
        ruleName: 'Overprovisioned RDS Instance',
        riskLevel: 'high',
        resourceId: 'db-prod-mysql-001',
        resourceType: 'RDS Database',
        issueDescription: 'RDS instance db-prod-mysql-001 is using only 15% of allocated memory and 20% of CPU capacity. Current instance type: db.r5.2xlarge.',
        action: 'Downsize to db.r5.xlarge or db.t3.large to reduce costs by approximately $200/month while maintaining adequate performance headroom.',
      },
      {
        ruleId: 'ebs-unattached',
        ruleName: 'Unattached EBS Volumes',
        riskLevel: 'high',
        resourceId: 'vol-0abcdef1234567890',
        resourceType: 'EBS Volume',
        issueDescription: 'EBS volume vol-0abcdef1234567890 has been unattached for 45 days. It\'s incurring storage costs without being used.',
        action: 'Review and delete this volume if it\'s no longer needed, or attach it to an instance if it contains important data. Estimated savings: $15/month.',
      },
      {
        ruleId: 's3-old-versions',
        ruleName: 'Excessive S3 Object Versions',
        riskLevel: 'medium',
        resourceId: 'my-backup-bucket',
        resourceType: 'S3 Bucket',
        issueDescription: 'S3 bucket contains 50,000+ object versions older than 90 days. Versioning is enabled but old versions are not being cleaned up.',
        action: 'Configure S3 Lifecycle policies to transition old versions to Glacier or delete them after a retention period. Estimated savings: $80/month.',
      },
      {
        ruleId: 'cloudwatch-logs-retention',
        ruleName: 'Extended CloudWatch Logs Retention',
        riskLevel: 'medium',
        resourceId: '/aws/lambda/my-function',
        resourceType: 'CloudWatch Logs',
        issueDescription: 'CloudWatch Logs group has retention set to "Never Expire" and contains 500GB of logs. Logs older than 90 days are rarely accessed.',
        action: 'Set log retention to 30-90 days for non-critical logs. Consider archiving important logs to S3 Glacier. Estimated savings: $45/month.',
      },
      {
        ruleId: 'ec2-reserved-instance',
        ruleName: 'Reserved Instance Optimization Opportunity',
        riskLevel: 'medium',
        resourceId: 'i-0987654321fedcba0',
        resourceType: 'EC2 Instance',
        issueDescription: 'Instance has been running continuously for 6+ months. Purchasing a Reserved Instance could save 30-40% compared to On-Demand pricing.',
        action: 'Purchase a 1-year Standard Reserved Instance for this instance type to reduce costs. Estimated savings: $120/month.',
      },
      {
        ruleId: 'elb-idle',
        ruleName: 'Idle Load Balancer',
        riskLevel: 'low',
        resourceId: 'arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/my-app/50dc6c495c0c9188',
        resourceType: 'Application Load Balancer',
        issueDescription: 'Load balancer has received minimal traffic (<100 requests/day) over the past 30 days. ALB charges apply regardless of traffic.',
        action: 'Consider consolidating multiple low-traffic ALBs or switching to a Network Load Balancer for internal services. Estimated savings: $20/month.',
      },
      {
        ruleId: 'nat-gateway-underutilized',
        ruleName: 'Underutilized NAT Gateway',
        riskLevel: 'low',
        resourceId: 'nat-0123456789abcdef0',
        resourceType: 'NAT Gateway',
        issueDescription: 'NAT Gateway is processing less than 1GB of data per day. NAT Gateway charges include both hourly fees and data processing fees.',
        action: 'Consider using NAT Instances for low-traffic scenarios or consolidating multiple NAT Gateways. Estimated savings: $35/month.',
      },
    ],
    limited: false,
  };
};

export default function Results() {
  const { scanId } = useParams<{ scanId: string }>();
  const [searchParams] = useSearchParams();
  const { user, accessToken } = useAuth();
  const { customerId, refreshStatus } = useCustomer();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [expandedIssues, setExpandedIssues] = useState<Set<string>>(new Set());

  // Handle checkout session completion
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      // Refresh subscription status after successful checkout
      refreshStatus().then(() => {
        // Reload the scan results to show full data
        if (scanId) {
          window.location.href = `/results/${scanId}`;
        }
      });
    }
  }, [searchParams, refreshStatus, scanId]);

  useEffect(() => {
    if (!scanId) return;

    // Use test data for demo/test scan IDs
    if (scanId === 'test' || scanId === 'demo') {
      // Simulate loading delay for realism
      setTimeout(() => {
        setResult(getTestData());
        setLoading(false);
      }, 500);
      return;
    }

    const fetchResults = async () => {
      try {
        if (!accessToken) {
          throw new Error('Not authenticated');
        }

        const response = await fetch(`/api/v1/scan/${scanId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        if (!response.ok) {
          // Try to parse error response from API
          let errorMessage = 'Failed to fetch scan results';
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch {
            // If error response is not JSON, use default message
          }
          throw new Error(errorMessage);
        }
        const data = await response.json();
        setResult(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [scanId, accessToken]);

  const handleCheckout = async () => {
    try {
      if (!accessToken) {
        setError('Please log in to subscribe');
        return;
      }

      // Build return URL to come back to this scan after checkout
      const returnUrl = scanId ? `/results/${scanId}` : '/results';

      const response = await fetch(`/api/v1/subscription/checkout?returnUrl=${encodeURIComponent(returnUrl)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ 
          customerId: customerId || undefined,
          email: user?.email || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Failed to create checkout session');
      }

      const data = await response.json();
      
      if (!data.checkoutUrl) {
        throw new Error('No checkout URL received');
      }

      // Redirect to Stripe checkout
      window.location.href = data.checkoutUrl;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start checkout';
      setError(errorMessage);
      console.error('Checkout error:', err);
    }
  };

  const toggleIssue = (issueId: string) => {
    const newExpanded = new Set(expandedIssues);
    if (newExpanded.has(issueId)) {
      newExpanded.delete(issueId);
    } else {
      newExpanded.add(issueId);
    }
    setExpandedIssues(newExpanded);
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getSeverityColor = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case 'critical':
      case 'high':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex items-center justify-center flex-1">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading scan results...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex items-center justify-center flex-1 px-4">
          <div className="text-center max-w-2xl">
            <div className="mb-6">
              <svg className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Scan Not Found</h2>
            <p className="text-gray-600 mb-2">{error || 'Scan results not found'}</p>
            <p className="text-sm text-gray-500 mb-6">
              Scans are currently stored in memory and may be lost when the server restarts. 
              Please run a new scan to generate fresh results.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/connect"
                className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
              >
                Run New Scan
              </Link>
              <Link
                to="/"
                className="inline-block bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
              >
                Return to Home
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="py-8 px-4">
        <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link
            to="/"
            className="text-indigo-600 hover:text-indigo-700 mb-4 inline-block"
          >
            ← Back to home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Scan Results</h1>
          <p className="text-gray-600 mt-1">
            Region: {result.region} • {new Date(result.timestamp).toLocaleString()}
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-sm font-medium text-gray-500 mb-2">Total Spend</h2>
            <p className="text-3xl font-bold text-gray-900">
              {formatCurrency(result.costSummary.totalCost, result.costSummary.currency)}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Last {result.costSummary.period.days} days
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-sm font-medium text-gray-500 mb-2">Potential Monthly Savings</h2>
            <p className="text-3xl font-bold text-green-600">
              {formatCurrency(result.savings.totalMonthlySavings, result.costSummary.currency)}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {formatCurrency(result.savings.totalAnnualSavings, result.costSummary.currency)} annually
            </p>
          </div>
        </div>

        {/* Limited Results Banner */}
        {result.limited && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                  Free Scan Results (Limited)
                </h3>
                <p className="text-yellow-800 mb-4">
                  {result.message || 'You\'re viewing a limited preview. Subscribe to see all issues and full details.'}
                </p>
                <p className="text-sm text-yellow-700 mb-4">
                  Showing {result.issues.length} of {result.issues.length}+ issues detected.
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleCheckout();
                  }}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
                >
                  Subscribe to See All Issues - $99/month
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Issues List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Detected Issues {result.limited ? `(${result.issues.length} shown)` : `(${result.issues.length})`}
          </h2>

          {result.issues.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No issues detected. Your AWS infrastructure looks optimized!
            </p>
          ) : (
            <div className="space-y-3">
              {result.issues.map((issue, index) => {
                const issueId = `${issue.ruleId}-${issue.resourceId}-${index}`;
                const isExpanded = expandedIssues.has(issueId);

                return (
                  <div
                    key={issueId}
                    className="border border-gray-200 rounded-lg overflow-hidden"
                  >
                    <button
                      onClick={() => toggleIssue(issueId)}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded border ${getSeverityColor(
                            issue.riskLevel
                          )}`}
                        >
                          {issue.riskLevel}
                        </span>
                        <div>
                          <p className="font-medium text-gray-900">{issue.ruleName}</p>
                          <p className="text-sm text-gray-500">
                            {issue.resourceType}: {issue.resourceId}
                          </p>
                        </div>
                      </div>
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${
                          isExpanded ? 'transform rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {isExpanded && (
                      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                        <p className="text-sm text-gray-700 mb-2">
                          <span className="font-medium">Description:</span> {issue.issueDescription}
                        </p>
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Action:</span> {issue.action}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-6 text-center space-x-4">
          <Link
            to="/connect"
            className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Run Another Scan
          </Link>
          {result.limited && customerId && (
            <button
              onClick={handleCheckout}
              className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Upgrade to Pro
            </button>
          )}
        </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
