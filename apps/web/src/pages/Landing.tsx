import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Header />
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Cut AWS Costs Without<br />
            <span className="text-indigo-600 dark:text-indigo-400">Cutting Corners</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 mb-4 max-w-3xl mx-auto">
            Find hidden savings in your AWS infrastructure in minutes. 
            <span className="font-semibold"> Read-only access</span> means zero risk, maximum insight.
          </p>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            Built for startup founders and CTOs who need to optimize costs without slowing down engineering.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-4">
            <Link
              to="/signup"
              className="inline-block bg-indigo-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-indigo-700 transition-colors shadow-lg"
            >
              Get Started →
            </Link>
            <Link
              to="/results/test"
              className="inline-block bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-lg border-2 border-indigo-600 dark:border-indigo-400"
            >
              View Sample Results
            </Link>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">No credit card required • Results in 2 minutes</p>
        </div>

        {/* Key Benefits */}
        <div className="grid md:grid-cols-3 gap-8 mb-16 max-w-5xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl mb-3">💰</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Find Hidden Savings</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Automatically identify underutilized resources, oversized instances, and orphaned volumes that drain your budget.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl mb-3">🔒</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">100% Read-Only</h3>
            <p className="text-gray-600 dark:text-gray-300">
              We never modify, delete, or change anything. Your infrastructure stays exactly as it is—we only analyze.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Instant Insights</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Get actionable recommendations in minutes, not weeks. No consultants, no meetings, just results.
            </p>
          </div>
        </div>

        {/* What We Analyze */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 md:p-12 mb-16 max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-8">What We Analyze</h2>
          <p className="text-gray-600 dark:text-gray-300 text-center mb-8 max-w-3xl mx-auto">
            Our comprehensive scan evaluates your AWS infrastructure across multiple dimensions to identify cost optimization opportunities.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border-l-4 border-indigo-500 dark:border-indigo-400 pl-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">EC2 Instances</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-2">
                Analyze CPU utilization patterns, instance types, and running states to identify:
              </p>
              <ul className="text-gray-600 dark:text-gray-300 space-y-1 text-sm">
                <li>• Idle instances with &lt;5% CPU utilization</li>
                <li>• Oversized instances that can be downsized</li>
                <li>• Instances running 24/7 that could use scheduling</li>
                <li>• Cost breakdown by instance type and region</li>
              </ul>
            </div>
            <div className="border-l-4 border-indigo-500 pl-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">EBS Volumes</h3>
              <p className="text-gray-600 mb-2">
                Scan all EBS volumes to detect:
              </p>
              <ul className="text-gray-600 dark:text-gray-300 space-y-1 text-sm">
                <li>• Unattached volumes costing money</li>
                <li>• Over-provisioned storage capacity</li>
                <li>• Underutilized volumes that can be optimized</li>
                <li>• Volume type recommendations (gp3 vs gp2)</li>
              </ul>
            </div>
            <div className="border-l-4 border-indigo-500 pl-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">EBS Snapshots</h3>
              <p className="text-gray-600 mb-2">
                Review snapshot lifecycle and costs:
              </p>
              <ul className="text-gray-600 dark:text-gray-300 space-y-1 text-sm">
                <li>• Old snapshots older than 30 days</li>
                <li>• Orphaned snapshots with no active volumes</li>
                <li>• Snapshot storage costs and trends</li>
                <li>• Retention policy recommendations</li>
              </ul>
            </div>
            <div className="border-l-4 border-indigo-500 pl-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Cost Data</h3>
              <p className="text-gray-600 mb-2">
                Analyze AWS Cost Explorer data:
              </p>
              <ul className="text-gray-600 dark:text-gray-300 space-y-1 text-sm">
                <li>• Last 30 days cost breakdown by service</li>
                <li>• Cost trends and anomalies</li>
                <li>• Monthly and annual cost projections</li>
                <li>• Service-level cost optimization opportunities</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Common Issues Found */}
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-lg shadow-md p-8 md:p-12 mb-16 max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-4">Common Issues We Find</h2>
          <p className="text-gray-600 dark:text-gray-300 text-center mb-8 max-w-2xl mx-auto">
            These are the most frequent cost optimization opportunities discovered in AWS infrastructure scans.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm">
              <div className="text-2xl mb-2">🛑</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Idle EC2 Instances</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                Instances running 24/7 with minimal CPU usage, costing hundreds per month.
              </p>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                Typical savings: $50-500/month per instance
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm">
              <div className="text-2xl mb-2">💾</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Unattached EBS Volumes</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                Storage volumes left behind after instance termination, still incurring charges.
              </p>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                Typical savings: $10-100/month per volume
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm">
              <div className="text-2xl mb-2">📸</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Old Snapshots</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                Backup snapshots accumulating over time, often forgotten but still costing money.
              </p>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                Typical savings: $5-50/month per snapshot
              </p>
            </div>
          </div>
        </div>

        {/* Use Cases */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 md:p-12 mb-16 max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-4">Perfect For</h2>
          <p className="text-gray-600 dark:text-gray-300 text-center mb-8 max-w-2xl mx-auto">
            Whether you're preparing for a funding round or optimizing runway, our service helps you make data-driven cost decisions.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center mr-4">
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">🚀</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Startup Founders</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Extend your runway by identifying unnecessary AWS costs. Get quick insights without hiring consultants or slowing down your team.
                </p>
              </div>
            </div>
            <div className="flex items-start p-4 border border-gray-200 rounded-lg">
              <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-4">
                <span className="text-indigo-600 font-bold">👔</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">CTOs & Engineering Leaders</h3>
                <p className="text-sm text-gray-600">
                  Get a comprehensive view of infrastructure costs and optimization opportunities without manual analysis or complex tooling.
                </p>
              </div>
            </div>
            <div className="flex items-start p-4 border border-gray-200 rounded-lg">
              <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-4">
                <span className="text-indigo-600 font-bold">💰</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Finance Teams</h3>
                <p className="text-sm text-gray-600">
                  Understand AWS spending patterns and identify cost reduction opportunities to improve unit economics and profitability.
                </p>
              </div>
            </div>
            <div className="flex items-start p-4 border border-gray-200 rounded-lg">
              <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-4">
                <span className="text-indigo-600 font-bold">📊</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Companies Preparing for Scale</h3>
                <p className="text-sm text-gray-600">
                  Establish cost optimization practices early. Identify waste before it becomes a significant expense as you grow.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 md:p-12 mb-16 max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-8">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-indigo-600 dark:text-indigo-400 font-bold text-xl">1</span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Connect Securely</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Provide read-only AWS credentials. We scan your infrastructure without making any changes.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-indigo-600 font-bold text-xl">2</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">We Analyze</h3>
              <p className="text-gray-600 text-sm">
                Our engine evaluates EC2 instances, EBS volumes, snapshots, and cost data against FinOps best practices.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-indigo-600 font-bold text-xl">3</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Get Results</h3>
              <p className="text-gray-600 text-sm">
                See potential monthly savings, prioritized issues, and specific recommendations you can act on today.
              </p>
            </div>
          </div>
        </div>

        {/* What You'll Get */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 md:p-12 mb-16 max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-4">What You'll Get</h2>
          <p className="text-gray-600 dark:text-gray-300 text-center mb-8 max-w-2xl mx-auto">
            Your comprehensive scan report includes everything you need to start optimizing costs immediately.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-4">
                <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Cost Summary</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Complete breakdown of your AWS spending over the last 30 days, organized by service and region.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-green-600 font-bold">✓</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Savings Potential</h3>
                <p className="text-sm text-gray-600">
                  Estimated monthly and annual savings with specific dollar amounts for each optimization opportunity.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-green-600 font-bold">✓</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Prioritized Issues</h3>
                <p className="text-sm text-gray-600">
                  Issues ranked by potential savings and impact, so you know where to focus first.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-green-600 font-bold">✓</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Actionable Recommendations</h3>
                <p className="text-sm text-gray-600">
                  Specific steps to resolve each issue, including resource IDs and exact actions to take.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-green-600 font-bold">✓</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Resource Inventory</h3>
                <p className="text-sm text-gray-600">
                  Complete list of EC2 instances, EBS volumes, and snapshots with their current state and costs.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-green-600 font-bold">✓</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Risk Assessment</h3>
                <p className="text-sm text-gray-600">
                  Each recommendation includes risk level (low, medium, high) to help you make informed decisions.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Security & Privacy */}
        <div className="bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-lg shadow-md p-8 md:p-12 mb-16 max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-4">Security & Privacy</h2>
          <p className="text-gray-600 dark:text-gray-300 text-center mb-8 max-w-2xl mx-auto">
            Your security is our top priority. We've designed our service with enterprise-grade security practices.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-5">
              <div className="text-2xl mb-2">🔐</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Read-Only Access</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                We only request read-only permissions. Our IAM policy prevents any modifications, deletions, or changes to your infrastructure.
              </p>
            </div>
            <div className="bg-white rounded-lg p-5">
              <div className="text-2xl mb-2">🔑</div>
              <h3 className="font-semibold text-gray-900 mb-2">Credential Handling</h3>
              <p className="text-sm text-gray-600">
                Credentials are encrypted in transit and at rest. We never store your AWS credentials permanently—only during the scan session.
              </p>
            </div>
            <div className="bg-white rounded-lg p-5">
              <div className="text-2xl mb-2">🛡️</div>
              <h3 className="font-semibold text-gray-900 mb-2">No Data Retention</h3>
              <p className="text-sm text-gray-600">
                Scan results are available for your review, but we don't retain your infrastructure data beyond what's necessary for your report.
              </p>
            </div>
            <div className="bg-white rounded-lg p-5">
              <div className="text-2xl mb-2">✅</div>
              <h3 className="font-semibold text-gray-900 mb-2">IAM Best Practices</h3>
              <p className="text-sm text-gray-600">
                We provide IAM policy templates following AWS security best practices. You maintain full control over access permissions.
              </p>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 md:p-12 mb-16 max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Simple, Transparent Pricing</h2>
            <p className="text-gray-600 dark:text-gray-300">Start free. Scale as you grow.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Free Scan</h3>
              <p className="text-4xl font-bold text-gray-900 dark:text-white mb-1">$0</p>
              <p className="text-gray-600 dark:text-gray-300 mb-6">One-time analysis</p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <span className="text-green-500 dark:text-green-400 mr-2">✓</span>
                  <span className="text-gray-700 dark:text-gray-300">Full infrastructure scan</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-gray-700">Cost analysis & savings potential</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-gray-700">Prioritized issue list</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-gray-700">Actionable recommendations</span>
                </li>
              </ul>
              <Link
                to="/connect"
                className="block w-full text-center bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
              >
                Run Free Scan
              </Link>
            </div>
            <div className="border-2 border-indigo-500 dark:border-indigo-400 rounded-lg p-6 relative">
              <div className="absolute top-0 right-0 bg-indigo-600 dark:bg-indigo-500 text-white px-3 py-1 text-sm font-semibold rounded-bl-lg">
                Coming Soon
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Pro</h3>
              <p className="text-4xl font-bold text-gray-900 dark:text-white mb-1">$99<span className="text-lg text-gray-600 dark:text-gray-400">/mo</span></p>
              <p className="text-gray-600 dark:text-gray-300 mb-6">Continuous monitoring</p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <span className="text-green-500 dark:text-green-400 mr-2">✓</span>
                  <span className="text-gray-700 dark:text-gray-300">Everything in Free</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-gray-700">Weekly automated scans</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-gray-700">Cost trend tracking</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-gray-700">Email alerts for new issues</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-gray-700">Export reports & API access</span>
                </li>
              </ul>
              <button
                disabled
                className="block w-full text-center bg-gray-300 text-gray-600 px-6 py-3 rounded-lg font-semibold cursor-not-allowed"
              >
                Coming Soon
              </button>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 md:p-12 mb-16 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">How long does a scan take?</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Most scans complete in 2-5 minutes, depending on the size of your infrastructure. We analyze EC2 instances, EBS volumes, snapshots, and cost data in parallel for speed.
              </p>
            </div>
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">What AWS permissions do I need?</h3>
              <p className="text-gray-600">
                You'll need read-only access to EC2, EBS, CloudWatch, and Cost Explorer services. We provide a ready-to-use IAM policy template that follows AWS security best practices.
              </p>
            </div>
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Can this scan affect my running infrastructure?</h3>
              <p className="text-gray-600">
                Absolutely not. Our service uses 100% read-only permissions. We cannot modify, delete, or change anything in your AWS account. Your infrastructure remains completely untouched.
              </p>
            </div>
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">What regions do you support?</h3>
              <p className="text-gray-600">
                We support all AWS regions. You can scan resources in any region you specify. Cost Explorer data is retrieved from us-east-1 (as required by AWS), but we analyze resources in your chosen region.
              </p>
            </div>
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">How accurate are the savings estimates?</h3>
              <p className="text-gray-600">
                Our savings calculations are based on current AWS pricing and actual resource usage patterns. Estimates reflect potential monthly savings if recommendations are implemented. Actual savings may vary based on your specific usage patterns.
              </p>
            </div>
            <div className="pb-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Do you store my AWS credentials?</h3>
              <p className="text-gray-600">
                No. We only use your credentials during the active scan session. Credentials are encrypted in transit and never stored permanently. Once the scan completes, we don't retain access to your AWS account.
              </p>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Trusted by Startup Teams</h2>
          <div className="grid md:grid-cols-2 gap-6 text-left">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <p className="text-gray-700 dark:text-gray-300 mb-4 italic">
                "Found $2,400/month in savings we didn't know existed. The read-only access made our security team happy, and the recommendations were spot-on."
              </p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">— CTO, Series A SaaS Company</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <p className="text-gray-700 dark:text-gray-300 mb-4 italic">
                "As a founder wearing multiple hats, I needed something fast. Got actionable insights in under 5 minutes. Game changer."
              </p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">— Founder, Seed-Stage Startup</p>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center bg-indigo-600 rounded-lg shadow-lg p-12 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Optimize Your AWS Costs?
          </h2>
          <p className="text-xl text-indigo-100 mb-8">
            Join startup teams already saving thousands on AWS infrastructure.
          </p>
          <Link
            to="/connect"
            className="inline-block bg-white text-indigo-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-colors shadow-lg"
          >
            Start Your Free Scan Now →
          </Link>
          <p className="text-indigo-200 text-sm mt-4">No credit card • No commitment • Results in minutes</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
