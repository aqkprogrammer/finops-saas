/**
 * Simple in-memory storage for customers and subscriptions (MVP)
 * In production, this would be replaced with a database
 */

export interface Customer {
  customerId: string;
  stripeCustomerId: string;
  email?: string;
  createdAt: Date;
  freeScanUsed: boolean;
}

export interface Subscription {
  subscriptionId: string;
  customerId: string;
  stripeSubscriptionId: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
  currentPeriodEnd: Date;
  createdAt: Date;
}

class CustomerStorage {
  private customers: Map<string, Customer> = new Map();
  private subscriptions: Map<string, Subscription> = new Map();
  private customerSubscriptions: Map<string, string[]> = new Map(); // customerId -> subscriptionIds[]

  /**
   * Create or update a customer
   */
  upsertCustomer(customer: Customer): void {
    this.customers.set(customer.customerId, customer);
  }

  /**
   * Get customer by ID
   */
  getCustomer(customerId: string): Customer | undefined {
    return this.customers.get(customerId);
  }

  /**
   * Get customer by Stripe customer ID
   */
  getCustomerByStripeId(stripeCustomerId: string): Customer | undefined {
    return Array.from(this.customers.values()).find(
      (c) => c.stripeCustomerId === stripeCustomerId
    );
  }

  /**
   * Mark free scan as used
   */
  markFreeScanUsed(customerId: string): void {
    const customer = this.customers.get(customerId);
    if (customer) {
      customer.freeScanUsed = true;
      this.customers.set(customerId, customer);
    }
  }

  /**
   * Create or update a subscription
   */
  upsertSubscription(subscription: Subscription): void {
    this.subscriptions.set(subscription.subscriptionId, subscription);
    
    // Track customer subscriptions
    const existing = this.customerSubscriptions.get(subscription.customerId) || [];
    if (!existing.includes(subscription.subscriptionId)) {
      existing.push(subscription.subscriptionId);
      this.customerSubscriptions.set(subscription.customerId, existing);
    }
  }

  /**
   * Get subscription by ID
   */
  getSubscription(subscriptionId: string): Subscription | undefined {
    return this.subscriptions.get(subscriptionId);
  }

  /**
   * Get subscription by Stripe subscription ID
   */
  getSubscriptionByStripeId(stripeSubscriptionId: string): Subscription | undefined {
    return Array.from(this.subscriptions.values()).find(
      (s) => s.stripeSubscriptionId === stripeSubscriptionId
    );
  }

  /**
   * Get active subscription for a customer
   */
  getActiveSubscription(customerId: string): Subscription | undefined {
    const subscriptionIds = this.customerSubscriptions.get(customerId) || [];
    
    for (const subId of subscriptionIds) {
      const sub = this.subscriptions.get(subId);
      if (sub && sub.status === 'active') {
        return sub;
      }
    }
    
    return undefined;
  }

  /**
   * Delete subscription
   */
  deleteSubscription(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      this.subscriptions.delete(subscriptionId);
      const customerSubs = this.customerSubscriptions.get(subscription.customerId) || [];
      const filtered = customerSubs.filter((id) => id !== subscriptionId);
      if (filtered.length === 0) {
        this.customerSubscriptions.delete(subscription.customerId);
      } else {
        this.customerSubscriptions.set(subscription.customerId, filtered);
      }
    }
  }

  /**
   * Get all active subscriptions
   */
  getAllActiveSubscriptions(): Subscription[] {
    return Array.from(this.subscriptions.values()).filter(
      (sub) => sub.status === 'active'
    );
  }

  /**
   * Get all subscriptions
   */
  getAllSubscriptions(): Subscription[] {
    return Array.from(this.subscriptions.values());
  }

  /**
   * Clear all data (useful for testing)
   */
  clear(): void {
    this.customers.clear();
    this.subscriptions.clear();
    this.customerSubscriptions.clear();
  }
}

export const customerStorage = new CustomerStorage();
