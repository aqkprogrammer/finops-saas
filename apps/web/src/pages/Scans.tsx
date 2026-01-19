import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiUrl } from '../lib/api';
import Header from '../components/Header';
import Footer from '../components/Footer';

interface Scan {
  scanId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: string;
  totalCost: number;
  totalSavings: number;
}

export default function Scans() {
  const navigate = useNavigate();
  const { isAuthenticated, accessToken } = useAuth();
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasRunningScans, setHasRunningScans] = useState(false);

  const fetchScans = async () => {
    try {
      if (!accessToken) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(apiUrl('/api/v1/scans'), {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch scans');
      }

      const data = await response.json();
      setScans(data.scans || []);
      setHasRunningScans(data.scans?.some((s: Scan) => s.status === 'running') || false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchScans();
  }, [isAuthenticated, navigate, accessToken]);

  useEffect(() => {
    if (!hasRunningScans) return;

    const interval = setInterval(() => {
      fetchScans();
    }, 3000);

    return () => clearInterval(interval);
  }, [hasRunningScans]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-800 border border-gray-300">
            Preparing
          </span>
        );
      case 'running':
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-1">
            <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Running
          </span>
        );
      case 'completed':
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800 border border-green-300">
            Completed
          </span>
        );
      case 'failed':
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-800 border border-red-300">
            Failed
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-800 border border-gray-300">
            {status}
          </span>
        );
    }
  };

  const handleViewScan = (scan: Scan) => {
    if (scan.status === 'completed') {
      navigate(`/results/${scan.scanId}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex items-center justify-center flex-1">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading scans...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="flex-1 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">My Scans</h1>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {scans.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No scans yet</h2>
              <p className="text-gray-600 mb-6">Run your first scan.</p>
              <button
                onClick={() => navigate('/connect')}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
              >
                Run Scan
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date/Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Savings
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {scans.map((scan) => (
                      <tr key={scan.scanId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(scan.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(scan.status)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(scan.totalSavings)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {scan.status === 'completed' ? (
                            <button
                              onClick={() => handleViewScan(scan)}
                              className="text-indigo-600 hover:text-indigo-900 font-semibold"
                            >
                              View
                            </button>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
