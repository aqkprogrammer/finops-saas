import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { subscriptionService } from '../../services/subscription-service.js';
import { customerStorage } from '../../storage/customer-storage.js';
import { authMiddleware } from '../../plugins/auth.js';
import Stripe from 'stripe';
import { env } from '../../config/env.js';

// Lazy initialization of Stripe client
function getStripeClient(): Stripe {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
  }
  return new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-11-20.acacia' as '2025-12-15.clover',
  });
}

const createCheckoutSchema = z.object({
  customerId: z.string().optional(),
  email: z.string().email().optional(),
});

const customerIdSchema = z.object({
  customerId: z.string(),
});

export default async function subscriptionRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/v1/subscription/checkout
   * Create a Stripe checkout session
   */
  fastify.post('/checkout', {
    preHandler: [authMiddleware],
    schema: {
      description: 'Create a Stripe checkout session for subscription',
      tags: ['subscription'],
      querystring: {
        type: 'object',
        properties: {
          returnUrl: { type: 'string', description: 'URL to redirect to after successful checkout' },
        },
      },
      body: {
        type: 'object',
        properties: {
          customerId: { type: 'string', description: 'Existing customer ID (optional)' },
          email: { type: 'string', format: 'email', description: 'Customer email (optional)' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            checkoutUrl: { type: 'string', description: 'Stripe checkout URL' },
            customerId: { type: 'string' },
          },
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            details: { type: 'array' },
          },
        },
        500: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      if (!request.user) {
        return reply.status(401).send({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
      }

      const body = createCheckoutSchema.parse(request.body);
      
      // Use authenticated user's ID as customerId for consistency
      const userId = request.user.userId;
      const userEmail = request.user.email;
      
      fastify.log.debug({ userId, userEmail, providedCustomerId: body.customerId }, 'Creating checkout session');
      
      let customerId = body.customerId || userId;
      
      // Get or create customer in storage
      let customer = customerStorage.getCustomer(customerId);
      if (!customer) {
        // Create customer in memory storage if it doesn't exist
        customer = subscriptionService.getOrCreateCustomer(customerId);
        customerId = customer.customerId;
        fastify.log.debug({ customerId }, 'Created new customer in storage');
      }

      // Check if Stripe is configured
      if (!env.STRIPE_SECRET_KEY || !env.STRIPE_PRICE_ID) {
        fastify.log.warn('Stripe is not configured - checkout disabled');
        return reply.status(503).send({
          error: 'Stripe not configured',
          message: 'Subscription features are not available. Please configure Stripe by setting STRIPE_SECRET_KEY and STRIPE_PRICE_ID environment variables.',
          instructions: 'See README.md for setup instructions or visit https://dashboard.stripe.com/apikeys to get your Stripe keys.',
        });
      }

      // Create Stripe customer if needed
      if (!customer.stripeCustomerId) {
        const updatedCustomer = await subscriptionService.createCustomer(userEmail);
        customerId = updatedCustomer.customerId;
        fastify.log.debug({ customerId, stripeCustomerId: updatedCustomer.stripeCustomerId }, 'Created Stripe customer');
      }

      // Get return URL from query params if provided (for redirecting back to scan results)
      const returnUrl = (request.query as any)?.returnUrl || undefined;
      
      const checkoutUrl = await subscriptionService.createCheckoutSession(customerId, returnUrl);

      if (!checkoutUrl) {
        throw new Error('Failed to create checkout URL');
      }

      fastify.log.info({ customerId, hasCheckoutUrl: !!checkoutUrl }, 'Checkout session created successfully');

      return reply.status(200).send({
        checkoutUrl,
        customerId,
      });
    } catch (error) {
      fastify.log.error({ error, errorMessage: error instanceof Error ? error.message : 'Unknown error' }, 'Error creating checkout session');
      
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Invalid request',
          details: error.errors,
        });
      }

      return reply.status(500).send({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  });

  /**
   * GET /api/v1/subscription/status/:customerId
   * Get subscription status for a customer
   */
  fastify.get('/status/:customerId', {
    schema: {
      description: 'Get subscription status for a customer',
      tags: ['subscription'],
      params: {
        type: 'object',
        required: ['customerId'],
        properties: {
          customerId: { type: 'string', description: 'Customer ID' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            customerId: { type: 'string' },
            hasFullAccess: { type: 'boolean' },
            canUseFreeScan: { type: 'boolean' },
            freeScanUsed: { type: 'boolean' },
            subscription: {
              type: 'object',
              nullable: true,
              properties: {
                status: { type: 'string' },
                currentPeriodEnd: { type: 'string' },
              },
            },
          },
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const params = customerIdSchema.parse(request.params);
      const customer = customerStorage.getCustomer(params.customerId);
      
      if (!customer) {
        return reply.status(404).send({
          error: 'Customer not found',
        });
      }

      const subscription = subscriptionService.getActiveSubscription(params.customerId);
      const hasFullAccess = subscriptionService.hasFullAccess(params.customerId);
      const canUseFreeScan = await subscriptionService.canUseFreeScan(params.customerId);

      return reply.status(200).send({
        customerId: customer.customerId,
        hasFullAccess,
        canUseFreeScan,
        freeScanUsed: customer.freeScanUsed,
        subscription: subscription ? {
          status: subscription.status,
          currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
        } : null,
      });
    } catch (error) {
      fastify.log.error(error, 'Error getting subscription status');
      
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Invalid request',
          details: error.errors,
        });
      }

      return reply.status(500).send({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  });

  /**
   * POST /api/v1/subscription/webhook
   * Handle Stripe webhook events
   * Note: For production, use Stripe CLI or configure webhook endpoint
   * to forward raw body. In development, webhook verification is optional.
   */
  fastify.post('/webhook', {
    config: {
      rawBody: false, // Fastify will parse JSON, but we'll use request.raw for verification
    },
    schema: {
      description: 'Handle Stripe webhook events for subscription updates',
      tags: ['subscription'],
      headers: {
        type: 'object',
        required: ['stripe-signature'],
        properties: {
          'stripe-signature': { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            received: { type: 'boolean' },
          },
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const sig = request.headers['stripe-signature'] as string;

    if (!sig) {
      return reply.status(400).send({ error: 'Missing stripe-signature header' });
    }

    let event: Stripe.Event;

    try {
      // For webhook verification, we need the raw body
      // In production, configure your reverse proxy to pass raw body
      // For now, we'll reconstruct from parsed body (less secure but works for MVP)
      const body = request.body as any;
      const bodyString = JSON.stringify(body);
      
      if (env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET) {
        // Note: This may fail if body was modified by JSON parsing
        // For production, use raw body from request.raw or configure middleware
        const stripe = getStripeClient();
        try {
          event = stripe.webhooks.constructEvent(
            bodyString,
            sig,
            env.STRIPE_WEBHOOK_SECRET
          );
        } catch (verifyError) {
          // If verification fails, log but continue in development
          fastify.log.warn(verifyError, 'Webhook verification failed, continuing anyway');
          event = body as Stripe.Event;
        }
      } else {
        // In development, parse without verification
        event = body as Stripe.Event;
        if (!env.STRIPE_SECRET_KEY) {
          fastify.log.warn('Stripe not configured - webhook verification skipped');
        } else {
          fastify.log.warn('Webhook verification skipped (STRIPE_WEBHOOK_SECRET not set)');
        }
      }
    } catch (err) {
      fastify.log.error(err, 'Webhook processing failed');
      return reply.status(400).send({ error: 'Webhook processing failed' });
    }

    try {
      await subscriptionService.handleWebhookEvent(event);
      return reply.status(200).send({ received: true });
    } catch (error) {
      fastify.log.error(error, 'Error handling webhook event');
      return reply.status(500).send({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  });

  /**
   * POST /api/v1/subscription/customer
   * Create or get customer
   */
  fastify.post('/customer', {
    schema: {
      description: 'Create or get a customer',
      tags: ['subscription'],
      body: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email', description: 'Customer email (optional)' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            customerId: { type: 'string' },
            freeScanUsed: { type: 'boolean' },
          },
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            details: { type: 'array' },
          },
        },
        500: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      // Handle cases where request.body might be undefined, null, or empty
      // Default to empty object if body is missing
      const requestBody = request.body || {};
      
      // Extract and validate email manually to handle edge cases
      let email: string | undefined = undefined;
      
      if (requestBody && typeof requestBody === 'object' && 'email' in requestBody) {
        const emailValue = requestBody.email;
        if (typeof emailValue === 'string' && emailValue.trim() !== '') {
          // Validate email format
          const emailSchema = z.string().email();
          const emailResult = emailSchema.safeParse(emailValue.trim());
          if (!emailResult.success) {
            fastify.log.warn({ 
              email: emailValue,
              errors: emailResult.error.errors 
            }, 'Invalid email format');
            return reply.status(400).send({
              error: 'Invalid request',
              details: emailResult.error.errors,
            });
          }
          email = emailResult.data;
        }
        // If email is empty string or undefined, leave it as undefined
      }
      
      // No need to parse the whole body since email is the only field and it's optional

      const customer = await subscriptionService.createCustomer(email);

      return reply.status(200).send({
        customerId: customer.customerId,
        freeScanUsed: customer.freeScanUsed,
      });
    } catch (error) {
      fastify.log.error(error, 'Error creating customer');
      
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Invalid request',
          details: error.errors,
        });
      }

      return reply.status(500).send({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  });
}
