# FinOpsGuard - AWS Cost Optimization Platform

A monorepo-based SaaS platform for AWS cost optimization and FinOps management.

## 📁 Project Structure

```
finopsguard/
├── apps/
│   ├── api/          # Node.js + TypeScript + Fastify API server
│   └── web/           # React + Vite frontend application
├── packages/
│   ├── aws-client/    # AWS SDK wrappers for EC2, RDS, Cost Explorer
│   ├── rules-engine/  # JSON-driven rules engine for cost optimization
│   ├── pricing/       # Cost and savings calculation logic
│   └── shared/        # Shared types and utilities
├── package.json       # Root workspace configuration
└── tsconfig.json      # Base TypeScript configuration
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation

```bash
# Install all dependencies
npm install

# Build all packages and apps
npm run build
```

### Development

```bash
# Run all apps in development mode
npm run dev

# Or run individually:
# API server (port 3000)
cd apps/api && npm run dev

# Web app (port 5173)
cd apps/web && npm run dev
```

## 📦 Packages

### `@finopsguard/shared`
Shared types and utilities used across the monorepo.
- Types: `AwsResource`, `Cost`, `Savings`, `Recommendation`
- Utils: Currency formatting, percentage calculations, ID generation

### `@finopsguard/aws-client`
AWS SDK wrappers for interacting with AWS services.
- `Ec2Client` - EC2 instance management
- `RdsClient` - RDS instance management
- `CostExplorerClient` - Cost and usage data retrieval

### `@finopsguard/rules-engine`
JSON-driven rules engine for evaluating AWS resources against optimization rules.
- Rule evaluation against resources
- JSON-based rule configuration
- Extensible condition and action system

### `@finopsguard/pricing`
Cost calculation and savings estimation logic.
- Current cost calculation
- Optimized cost projection
- Savings calculation

## 🏗️ Architecture

### Separation of Concerns

- **apps/api**: Handles HTTP requests, business logic orchestration
- **apps/web**: User interface and API communication
- **packages/aws-client**: AWS service abstraction layer
- **packages/rules-engine**: Business rules evaluation
- **packages/pricing**: Financial calculations
- **packages/shared**: Common types and utilities

### TypeScript Project References

The monorepo uses TypeScript project references for:
- Type safety across packages
- Incremental builds
- Better IDE support

## 📝 Scripts

- `npm run dev` - Start all apps in development mode
- `npm run build` - Build all packages and apps
- `npm run test` - Run tests across all workspaces
- `npm run lint` - Lint all workspaces
- `npm run clean` - Clean all build artifacts

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the `apps/api` directory (or set environment variables) with the following:

#### Required Variables

- `DATABASE_URL` - PostgreSQL connection string (e.g., `postgresql://user:password@localhost:5432/finopsguard_db`)
- `JWT_SECRET` - Secret key for JWT tokens (minimum 32 characters)

#### Stripe Configuration (Required for Subscription Features)

To enable subscription features, you need to configure Stripe:

1. **Get Stripe API Keys:**
   - Sign up at https://stripe.com
   - Go to https://dashboard.stripe.com/apikeys
   - Copy your **Secret key** (starts with `sk_test_` for test mode or `sk_live_` for production)

2. **Create a Price:**
   - Go to https://dashboard.stripe.com/products
   - Create a product with a recurring price (e.g., $99/month)
   - Copy the **Price ID** (starts with `price_`)

3. **Set Environment Variables:**
   ```bash
   STRIPE_SECRET_KEY=sk_test_your_secret_key_here
   STRIPE_PRICE_ID=price_your_price_id_here
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here  # Optional, for webhook verification
   ```

#### Optional Variables

- `PORT` - Server port (default: 3000)
- `HOST` - Server host (default: 0.0.0.0)
- `FRONTEND_URL` - Frontend URL (default: http://localhost:5173)
- `LOG_LEVEL` - Logging level (default: info)
- `AWS_ACCESS_KEY_ID` - AWS access key (optional, uses default credential chain if not set)
- `AWS_SECRET_ACCESS_KEY` - AWS secret key (optional)
- `MOCK_AWS` - Set to `true` to use mock AWS clients for testing

#### Example `.env` File

```bash
# Database
DATABASE_URL=postgresql://finopsguard:finopsguard_password@localhost:5432/finopsguard_db?schema=public

# JWT Secret (generate a random string, at least 32 characters)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars

# Stripe (Required for subscriptions)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PRICE_ID=price_your_stripe_price_id_here

# Frontend
FRONTEND_URL=http://localhost:5173
```

## 📚 Next Steps

1. Add database integration (PostgreSQL/MySQL)
2. Implement authentication and authorization
3. Add unit and integration tests
4. Set up CI/CD pipeline
5. Integrate AWS Pricing API for accurate cost calculations
6. Add more rule types and conditions

## 🤝 Contributing

This is an MVP-focused monorepo. Keep changes simple and maintain clear separation of concerns.
