import Stripe from 'stripe';
import { env } from '../config/env.js';
import { customerStorage, type Customer, type Subscription } from '../storage/customer-storage.js';
import { prisma } from '../db/prisma.js';

// Lazy initialization of Stripe client
function getStripeClient(): Stripe {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
  }
  return new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-11-20.acacia',
  });
}

export class SubscriptionService {
  /**
   * Create a customer in Stripe and our system
   */
  async createCustomer(email?: string): Promise<Customer> {
    if (!env.STRIPE_SECRET_KEY) {
      throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
    }
    
    const stripe = getStripeClient();
    const stripeCustomer = await stripe.customers.create({
      email,
      metadata: {
        created_at: new Date().toISOString(),
      },
    });

    const customer: Customer = {
      customerId: `cust_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      stripeCustomerId: stripeCustomer.id,
      email: email || stripeCustomer.email || undefined,
      createdAt: new Date(),
      freeScanUsed: false,
    };

    customerStorage.upsertCustomer(customer);
    return customer;
  }

  /**
   * Create a checkout session for subscription
   */
  async createCheckoutSession(customerId: string, returnUrl?: string): Promise<string> {
    if (!env.STRIPE_SECRET_KEY || !env.STRIPE_PRICE_ID) {
      throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY and STRIPE_PRICE_ID environment variables.');
    }
    
    const customer = customerStorage.getCustomer(customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    // Use provided returnUrl or default to results page
    const successUrl = returnUrl 
      ? `${env.FRONTEND_URL}${returnUrl}?session_id={CHECKOUT_SESSION_ID}`
      : `${env.FRONTEND_URL}/results?session_id={CHECKOUT_SESSION_ID}`;

    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.create({
      customer: customer.stripeCustomerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: returnUrl 
        ? `${env.FRONTEND_URL}${returnUrl}?canceled=true`
        : `${env.FRONTEND_URL}/connect?canceled=true`,
      metadata: {
        customerId,
      },
    });

    return session.url || '';
  }

  /**
   * Get customer by Stripe customer ID
   */
  getCustomerByStripeId(stripeCustomerId: string): Customer | undefined {
    return customerStorage.getCustomerByStripeId(stripeCustomerId);
  }

  /**
   * Get active subscription for customer
   */
  getActiveSubscription(customerId: string): Subscription | undefined {
    return customerStorage.getActiveSubscription(customerId);
  }

  /**
   * Check if customer has access to full scan results
   */
  hasFullAccess(customerId: string): boolean {
    const subscription = this.getActiveSubscription(customerId);
    return subscription?.status === 'active';
  }

  /**
   * Check if customer can use free scan
   * Checks database for existing scans since customer storage is in-memory
   */
  async canUseFreeScan(customerId: string): Promise<boolean> {
    // First check if they have full access (subscription)
    if (this.hasFullAccess(customerId)) {
      return true; // Subscribed users can always scan
    }

    // Check in-memory storage first (for backwards compatibility)
    const customer = customerStorage.getCustomer(customerId);
    if (customer && customer.freeScanUsed) {
      return false;
    }

    // Check database for existing scans - if they have scans, they've used their free scan
    const scanCount = await prisma.scan.count({
      where: { customerId },
    });

    return scanCount === 0;
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.metadata?.customerId;
        
        if (customerId && session.subscription) {
          await this.syncSubscription(session.subscription as string, customerId);
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customer = customerStorage.getCustomerByStripeId(subscription.customer as string);
        
        if (customer) {
          await this.syncSubscription(subscription.id, customer.customerId);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const existingSub = customerStorage.getSubscriptionByStripeId(subscription.id);
        
        if (existingSub) {
          customerStorage.deleteSubscription(existingSub.subscriptionId);
        }
        break;
      }
    }
  }

  /**
   * Sync subscription from Stripe
   */
  private async syncSubscription(stripeSubscriptionId: string, customerId: string): Promise<void> {
    if (!env.STRIPE_SECRET_KEY) {
      throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
    }
    
    const stripe = getStripeClient();
    const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
    
    const subscription: Subscription = {
      subscriptionId: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      customerId,
      stripeSubscriptionId: stripeSubscription.id,
      status: stripeSubscription.status as Subscription['status'],
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      createdAt: new Date(stripeSubscription.created * 1000),
    };

    customerStorage.upsertSubscription(subscription);
  }

  /**
   * Get or create customer (for anonymous users)
   */
  getOrCreateCustomer(customerId?: string): Customer {
    if (customerId) {
      const existing = customerStorage.getCustomer(customerId);
      if (existing) {
        return existing;
      }
      
      // Create customer with the provided ID
      const newCustomer: Customer = {
        customerId,
        stripeCustomerId: '', // Will be created when they subscribe
        createdAt: new Date(),
        freeScanUsed: false,
      };
      customerStorage.upsertCustomer(newCustomer);
      return newCustomer;
    }

    // Create new anonymous customer
    const newCustomer: Customer = {
      customerId: `cust_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      stripeCustomerId: '', // Will be created when they subscribe
      createdAt: new Date(),
      freeScanUsed: false,
    };
    customerStorage.upsertCustomer(newCustomer);
    return newCustomer;
  }
}

export const subscriptionService = new SubscriptionService();
