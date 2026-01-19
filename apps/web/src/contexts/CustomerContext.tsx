import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SubscriptionStatus {
  customerId: string;
  hasFullAccess: boolean;
  canUseFreeScan: boolean;
  freeScanUsed: boolean;
  subscription: {
    status: string;
    currentPeriodEnd: string;
  } | null;
}

interface CustomerContextType {
  customerId: string | null;
  subscriptionStatus: SubscriptionStatus | null;
  loading: boolean;
  refreshStatus: () => Promise<void>;
  setCustomerId: (id: string) => void;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export function CustomerProvider({ children }: { children: ReactNode }) {
  const [customerId, setCustomerIdState] = useState<string | null>(() => {
    return localStorage.getItem('customerId');
  });
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const setCustomerId = (id: string) => {
    setCustomerIdState(id);
    localStorage.setItem('customerId', id);
  };

  const refreshStatus = async () => {
    if (!customerId) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/v1/subscription/status/${customerId}`);
      if (response.ok) {
        const status = await response.json();
        setSubscriptionStatus(status);
      }
    } catch (error) {
      console.error('Failed to fetch subscription status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customerId) {
      refreshStatus();
    } else {
      setLoading(false);
    }
  }, [customerId]);

  return (
    <CustomerContext.Provider
      value={{
        customerId,
        subscriptionStatus,
        loading,
        refreshStatus,
        setCustomerId,
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomer() {
  const context = useContext(CustomerContext);
  if (context === undefined) {
    throw new Error('useCustomer must be used within a CustomerProvider');
  }
  return context;
}
