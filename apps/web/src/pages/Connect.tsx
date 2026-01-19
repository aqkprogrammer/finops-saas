import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCustomer } from '../contexts/CustomerContext';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function Connect() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { customerId, setCustomerId, subscriptionStatus, refreshStatus } = useCustomer();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    region: 'us-east-1',
    roleArn: '',
    externalId: '',
  });

  // Handle checkout session completion
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      // Refresh subscription status after successful checkout
      refreshStatus().then(() => {
        navigate('/connect?subscribed=true');
      });
    }
  }, [searchParams, refreshStatus, navigate]);

  // Get or create customer on mount
  useEffect(() => {
    const initializeCustomer = async () => {
      if (!customerId) {
        try {
          const response = await fetch('/api/v1/subscription/customer', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({}),
          });
          if (response.ok) {
            const data = await response.json();
            setCustomerId(data.customerId);
          }
        } catch (err) {
          console.error('Failed to create customer:', err);
        }
      }
    };
    initializeCustomer();
  }, [customerId, setCustomerId]);

  const handleCheckout = async () => {
    if (!customerId) {
      setError('Please wait while we set up your account...');
      return;
    }

    try {
      const response = await fetch('/api/v1/subscription/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ customerId }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const data = await response.json();
      window.location.href = data.checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start checkout');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/v1/scan/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          region: formData.region,
          roleArn: formData.roleArn,
          ...(formData.externalId && { externalId: formData.externalId }),
          includeMetrics: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle subscription required error
        if (errorData.error === 'Subscription required') {
          setError('You have used your free scan. Please subscribe to continue.');
          return;
        }
        
        throw new Error(errorData.message || errorData.error || 'Failed to run scan');
      }

      const data = await response.json();
      await refreshStatus();
      navigate(`/results/${data.scanId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="py-12 px-4">
        <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Connect AWS Account</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Connect your AWS account securely using an IAM role. We never store or access your credentials.
          </p>
          
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-lg">
              <p className="text-purple-800 dark:text-purple-300 text-sm">
                <strong>💡 Development Tip:</strong> Set <code className="bg-purple-100 dark:bg-purple-800 px-1 rounded">MOCK_AWS=true</code> in your backend environment to use mock data. In mock mode, you can use any Role ARN (e.g., <code className="bg-purple-100 dark:bg-purple-800 px-1 rounded">arn:aws:iam::123456789012:role/MockRole</code>).
              </p>
            </div>
          )}

          {searchParams.get('subscribed') === 'true' && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-green-800 dark:text-green-300 text-sm font-medium">
                ✓ Subscription activated! You can now run unlimited scans.
              </p>
            </div>
          )}

          {subscriptionStatus && !subscriptionStatus.hasFullAccess && subscriptionStatus.freeScanUsed && (
            <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-yellow-800 dark:text-yellow-300 text-sm mb-3">
                You've used your free scan. Subscribe to continue running scans.
              </p>
              <button
                type="button"
                onClick={handleCheckout}
                className="px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors text-sm font-semibold"
              >
                Subscribe Now - $99/month
              </button>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-800 dark:text-red-300 text-sm">{error}</p>
              {error.includes('Subscription required') && (
                <button
                  type="button"
                  onClick={handleCheckout}
                  className="mt-3 px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors text-sm font-semibold"
                >
                  Subscribe Now - $99/month
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="region" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                AWS Region
              </label>
              <select
                id="region"
                name="region"
                value={formData.region}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400"
              >
                <option value="us-east-1">US East (N. Virginia)</option>
                <option value="us-east-2">US East (Ohio)</option>
                <option value="us-west-1">US West (N. California)</option>
                <option value="us-west-2">US West (Oregon)</option>
                <option value="eu-west-1">Europe (Ireland)</option>
                <option value="eu-central-1">Europe (Frankfurt)</option>
                <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                <option value="ap-southeast-2">Asia Pacific (Sydney)</option>
              </select>
            </div>

            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
                🔐 Secure IAM Role Connection
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-300 mb-3">
                Create a read-only IAM role in your AWS account and grant our service permission to assume it. 
                This is the industry-standard secure method—we never see or store your credentials.
              </p>
              <details className="text-sm text-blue-800 dark:text-blue-300">
                <summary className="cursor-pointer font-medium hover:text-blue-900 dark:hover:text-blue-200">
                  How to create the IAM role (click to expand)
                </summary>
                <div className="mt-3 ml-4 space-y-2 text-xs">
                  <p><strong>Step 1:</strong> In AWS IAM Console, create a new role:</p>
                  <ul className="list-disc list-inside ml-2 space-y-1">
                    <li>Trusted entity: <strong>Another AWS account</strong></li>
                    <li>Account ID: <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">YOUR_APP_ACCOUNT_ID</code></li>
                    <li>Require external ID: <strong>Optional</strong> (recommended for extra security)</li>
                  </ul>
                  <p className="mt-2"><strong>Step 2:</strong> Attach read-only permissions:</p>
                  <ul className="list-disc list-inside ml-2 space-y-1">
                    <li><code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">AmazonEC2ReadOnlyAccess</code></li>
                    <li><code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">AmazonRDSReadOnlyAccess</code></li>
                    <li><code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">AWSCloudWatchReadOnlyAccess</code></li>
                    <li><code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">AWSBillingReadOnlyAccess</code> (for Cost Explorer)</li>
                  </ul>
                  <p className="mt-2"><strong>Step 3:</strong> Copy the Role ARN and paste it below</p>
                </div>
              </details>
            </div>

            <div>
              <label htmlFor="roleArn" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                IAM Role ARN <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="roleArn"
                name="roleArn"
                value={formData.roleArn}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400"
                placeholder="arn:aws:iam::123456789012:role/FinOpsReadOnly"
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                The ARN of the IAM role you created in your AWS account
              </p>
            </div>

            <div>
              <label htmlFor="externalId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                External ID (Optional)
              </label>
              <input
                type="text"
                id="externalId"
                name="externalId"
                value={formData.externalId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400"
                placeholder="Optional security identifier"
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                If you configured your role to require an external ID, enter it here
              </p>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Running Scan...' : 'Run Scan'}
              </button>
            </div>
          </form>
        </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
