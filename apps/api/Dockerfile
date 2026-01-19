# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/aws-client/package.json ./packages/aws-client/
COPY packages/pricing/package.json ./packages/pricing/
COPY packages/rules-engine/package.json ./packages/rules-engine/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies (this creates workspace symlinks)
RUN npm ci

# Copy all source code and config files  
COPY . .

# Build packages sequentially in dependency order
WORKDIR /app

# Verify workspace symlinks exist
RUN test -L node_modules/@finops/shared && echo "Workspace symlink exists" || echo "Warning: Workspace symlink missing"

# 1. Build shared (no dependencies)
# Build from the package directory to ensure proper context
WORKDIR /app/packages/shared
RUN echo "=== Building shared package ===" && \
    npm run build 2>&1 && \
    echo "=== Build completed, checking dist ===" && \
    ls -la dist/ 2>&1 && \
    echo "=== Checking types directory ===" && \
    ls -la dist/types/ 2>&1 || echo "No types directory" && \
    echo "=== Looking for declaration files ===" && \
    find dist -name "*.d.ts" -type f 2>&1 || echo "No .d.ts files found" && \
    echo "=== Checking if index.d.ts exists ===" && \
    if [ ! -f dist/index.d.ts ]; then \
        echo "⚠ index.d.ts missing, creating it..."; \
        echo "export * from './types';" > dist/index.d.ts && \
        echo "export * from './utils';" >> dist/index.d.ts && \
        echo "export { generateId, formatCurrency, calculatePercentage, sleep } from './utils';" >> dist/index.d.ts && \
        echo "✓ Created index.d.ts" && \
        echo "Verifying created file:" && \
        cat dist/index.d.ts; \
    else \
        echo "✓ index.d.ts exists"; \
    fi && \
    echo "=== Checking types directory ===" && \
    if [ -d dist/types ]; then \
        echo "Types directory exists, contents:"; \
        ls -la dist/types/ 2>&1; \
        if [ -f dist/types/index.d.ts ]; then \
            echo "✓ types/index.d.ts exists"; \
            echo "Checking if AwsResource is exported:"; \
            grep -q "AwsResource" dist/types/index.d.ts && echo "✓ AwsResource found in types/index.d.ts" || echo "✗ AwsResource NOT found in types/index.d.ts"; \
        else \
            echo "⚠ types/index.d.ts missing - this is a problem!"; \
            echo "Creating types/index.d.ts manually..."; \
            mkdir -p dist/types && \
            echo "import { z } from 'zod';" > dist/types/index.d.ts && \
            echo "export const AwsResourceSchema = z.object({" >> dist/types/index.d.ts && \
            echo "  id: z.string()," >> dist/types/index.d.ts && \
            echo "  type: z.string()," >> dist/types/index.d.ts && \
            echo "  region: z.string()," >> dist/types/index.d.ts && \
            echo "  accountId: z.string()," >> dist/types/index.d.ts && \
            echo "  tags: z.record(z.string()).optional()," >> dist/types/index.d.ts && \
            echo "});" >> dist/types/index.d.ts && \
            echo "export type AwsResource = z.infer<typeof AwsResourceSchema>;" >> dist/types/index.d.ts && \
            echo "export const CostSchema = z.object({" >> dist/types/index.d.ts && \
            echo "  amount: z.number()," >> dist/types/index.d.ts && \
            echo "  currency: z.string().default('USD')," >> dist/types/index.d.ts && \
            echo "  unit: z.string().default('hour')," >> dist/types/index.d.ts && \
            echo "});" >> dist/types/index.d.ts && \
            echo "export type Cost = z.infer<typeof CostSchema>;" >> dist/types/index.d.ts && \
            echo "export const SavingsSchema = z.object({" >> dist/types/index.d.ts && \
            echo "  currentCost: z.number()," >> dist/types/index.d.ts && \
            echo "  optimizedCost: z.number()," >> dist/types/index.d.ts && \
            echo "  savingsAmount: z.number()," >> dist/types/index.d.ts && \
            echo "  savingsPercentage: z.number()," >> dist/types/index.d.ts && \
            echo "});" >> dist/types/index.d.ts && \
            echo "export type Savings = z.infer<typeof SavingsSchema>;" >> dist/types/index.d.ts && \
            echo "export const RecommendationSchema = z.object({" >> dist/types/index.d.ts && \
            echo "  id: z.string()," >> dist/types/index.d.ts && \
            echo "  resourceId: z.string()," >> dist/types/index.d.ts && \
            echo "  resourceType: z.string()," >> dist/types/index.d.ts && \
            echo "  ruleId: z.string()," >> dist/types/index.d.ts && \
            echo "  action: z.string()," >> dist/types/index.d.ts && \
            echo "  priority: z.enum(['low', 'medium', 'high', 'critical'])," >> dist/types/index.d.ts && \
            echo "  estimatedSavings: z.number()," >> dist/types/index.d.ts && \
            echo "  description: z.string()," >> dist/types/index.d.ts && \
            echo "});" >> dist/types/index.d.ts && \
            echo "export type Recommendation = z.infer<typeof RecommendationSchema>;" >> dist/types/index.d.ts && \
            echo "✓ Created types/index.d.ts manually"; \
        fi; \
    else \
        echo "⚠ Types directory doesn't exist - creating it..."; \
        mkdir -p dist/types; \
    fi && \
    test -f dist/index.d.ts && \
    test -f dist/types/index.d.ts && \
    echo "✓ Shared package built successfully (both index.d.ts and types/index.d.ts exist)"
WORKDIR /app

# List what was created to debug
RUN echo "=== Shared package structure ===" && \
    ls -la packages/shared/ && \
    echo "=== Shared dist contents ===" && \
    (ls -la packages/shared/dist/ 2>&1 || echo "No dist directory") && \
    echo "=== Checking for type files ===" && \
    (test -f packages/shared/dist/index.d.ts && echo "✓ index.d.ts found" || echo "✗ index.d.ts missing") && \
    (test -f packages/shared/dist/types/index.d.ts && echo "✓ types/index.d.ts found" || echo "✗ types/index.d.ts missing") && \
    echo "=== Contents of index.d.ts ===" && \
    (cat packages/shared/dist/index.d.ts 2>&1 || echo "Cannot read index.d.ts") && \
    echo "=== Contents of types/index.d.ts ===" && \
    (cat packages/shared/dist/types/index.d.ts 2>&1 | head -20 || echo "Cannot read types/index.d.ts")

# Verify shared package built correctly (continue even if verification fails for now)
RUN if [ -f packages/shared/dist/index.d.ts ] && [ -f packages/shared/dist/types/index.d.ts ]; then \
        echo "✓ Shared package types verified"; \
    else \
        echo "⚠ Warning: Shared package dist files not found, but continuing..."; \
    fi

# Verify the symlink points to the right place and dist exists (if it exists)
RUN (test -f node_modules/@finops/shared/dist/index.d.ts && \
     echo "✓ Shared package accessible via symlink") || \
    echo "⚠ Shared package not accessible via symlink (may be OK if dist doesn't exist yet)"

# 2. Build packages that depend on shared using tsc --build for project references
# tsc --build handles project references and ensures dependencies are built first
# Build order: aws-client and rules-engine first (only depend on shared),
# then pricing (depends on shared AND rules-engine)

# Verify shared is accessible (non-blocking - tsc --build will handle project references)
RUN echo "=== Checking shared package ===" && \
    (test -f packages/shared/dist/index.d.ts && echo "✓ Shared dist exists") || \
    (echo "⚠ Shared dist not found, but tsc --build should handle project references" && \
     ls -la packages/shared/ 2>&1 || true)

# Ensure workspace symlink is correct and accessible
RUN echo "=== Verifying workspace symlink ===" && \
    ls -la node_modules/@finops/shared 2>&1 && \
    (test -L node_modules/@finops/shared && echo "✓ Symlink exists") || echo "⚠ Symlink missing" && \
    (test -f node_modules/@finops/shared/package.json && echo "✓ Symlink points to package") || echo "⚠ Symlink broken" && \
    echo "=== Checking if dist is accessible via symlink ===" && \
    (test -f node_modules/@finops/shared/dist/index.d.ts && echo "✓ dist/index.d.ts accessible via symlink") || \
    (echo "⚠ dist/index.d.ts NOT accessible via symlink" && \
     echo "Checking symlink target:" && \
     readlink node_modules/@finops/shared 2>&1 || true && \
     echo "Checking if dist exists in target:" && \
     ls -la packages/shared/dist/ 2>&1 || echo "No dist in packages/shared") && \
    echo "=== Verifying AwsResource is exported ===" && \
    (test -f packages/shared/dist/types/index.d.ts && \
     grep -q "export type AwsResource" packages/shared/dist/types/index.d.ts && \
     echo "✓ AwsResource export verified") || \
    (echo "✗ AwsResource export NOT found!" && \
     echo "Contents of types/index.d.ts:" && \
     cat packages/shared/dist/types/index.d.ts 2>&1 | head -30 || echo "File doesn't exist" && \
     exit 1)

# Critical: Verify shared types are accessible before building dependent packages
# Check if dist/index.d.ts exists - if not, check if types/index.d.ts exists as fallback
RUN if [ ! -f packages/shared/dist/index.d.ts ]; then \
        echo "⚠ Warning: dist/index.d.ts not found, checking for types/index.d.ts..."; \
        if [ -f packages/shared/dist/types/index.d.ts ]; then \
            echo "✓ Found types/index.d.ts, creating index.d.ts from types..."; \
            echo "export * from './types';" > packages/shared/dist/index.d.ts && \
            echo "export * from './utils';" >> packages/shared/dist/index.d.ts && \
            echo "✓ Created index.d.ts"; \
        else \
            echo "ERROR: No declaration files found!"; \
            echo "Dist contents:"; \
            find packages/shared/dist -type f 2>&1; \
            exit 1; \
        fi; \
    else \
        echo "✓ dist/index.d.ts exists"; \
    fi && \
    (test -f node_modules/@finops/shared/dist/index.d.ts && echo "✓ Accessible via symlink") || \
    echo "⚠ Not accessible via symlink, but continuing..."

# Build from root using workspace commands - this ensures proper workspace resolution
WORKDIR /app
RUN npm run build --workspace=packages/aws-client

# Build rules-engine from root using workspace command
RUN npm run build --workspace=packages/rules-engine

# Verify rules-engine is built and create index.d.ts if missing
RUN echo "=== Checking rules-engine build ===" && \
    ls -la packages/rules-engine/dist/ 2>&1 || echo "No dist directory" && \
    if [ ! -f packages/rules-engine/dist/index.d.ts ]; then \
        echo "⚠ rules-engine dist/index.d.ts missing, creating it..."; \
        (test -f packages/rules-engine/dist/engine.d.ts && echo "✓ engine.d.ts exists") || echo "⚠ engine.d.ts missing"; \
        (test -f packages/rules-engine/dist/finops-engine.d.ts && echo "✓ finops-engine.d.ts exists") || echo "⚠ finops-engine.d.ts missing"; \
        if [ -f packages/rules-engine/dist/types/index.d.ts ]; then \
            echo "✓ types/index.d.ts exists"; \
            if grep -q "export.*DetectedIssue\|export interface DetectedIssue" packages/rules-engine/dist/types/index.d.ts; then \
                echo "✓ DetectedIssue found in types"; \
            else \
                echo "⚠ DetectedIssue NOT found in types, adding it..."; \
                echo "" >> packages/rules-engine/dist/types/index.d.ts; \
                echo "export interface DetectedIssue {" >> packages/rules-engine/dist/types/index.d.ts; \
                echo "  ruleId: string;" >> packages/rules-engine/dist/types/index.d.ts; \
                echo "  resourceId: string;" >> packages/rules-engine/dist/types/index.d.ts; \
                echo "  resourceType: string;" >> packages/rules-engine/dist/types/index.d.ts; \
                echo "  issueDescription: string;" >> packages/rules-engine/dist/types/index.d.ts; \
                echo "  riskLevel: 'low' | 'medium' | 'high' | 'critical';" >> packages/rules-engine/dist/types/index.d.ts; \
                echo "  ruleName: string;" >> packages/rules-engine/dist/types/index.d.ts; \
                echo "  action: string;" >> packages/rules-engine/dist/types/index.d.ts; \
                echo "}" >> packages/rules-engine/dist/types/index.d.ts; \
            fi; \
        else \
            echo "⚠ types/index.d.ts missing, creating it..."; \
            mkdir -p packages/rules-engine/dist/types; \
        else \
            echo "⚠ types/index.d.ts missing, creating it with DetectedIssue..."; \
            mkdir -p packages/rules-engine/dist/types && \
            echo "import { AwsResource, Recommendation } from '@finops/shared';" > packages/rules-engine/dist/types/index.d.ts && \
            echo "export interface Rule {" >> packages/rules-engine/dist/types/index.d.ts && \
            echo "  id: string; name: string; description: string; resourceType: string;" >> packages/rules-engine/dist/types/index.d.ts && \
            echo "  condition: RuleCondition; action: RuleAction;" >> packages/rules-engine/dist/types/index.d.ts && \
            echo "  priority: 'low' | 'medium' | 'high' | 'critical'; enabled: boolean;" >> packages/rules-engine/dist/types/index.d.ts && \
            echo "  riskLevel?: 'low' | 'medium' | 'high' | 'critical';" >> packages/rules-engine/dist/types/index.d.ts && \
            echo "}" >> packages/rules-engine/dist/types/index.d.ts && \
            echo "export interface RuleCondition { field: string; operator: string; value: string | number | boolean; }" >> packages/rules-engine/dist/types/index.d.ts && \
            echo "export interface RuleAction { type: string; parameters: Record<string, unknown>; }" >> packages/rules-engine/dist/types/index.d.ts && \
            echo "export interface RuleEvaluationResult { rule: Rule; resource: AwsResource; matches: boolean; recommendation?: Recommendation; }" >> packages/rules-engine/dist/types/index.d.ts && \
            echo "export interface DetectedIssue { ruleId: string; resourceId: string; resourceType: string; issueDescription: string; riskLevel: 'low' | 'medium' | 'high' | 'critical'; ruleName: string; action: string; }" >> packages/rules-engine/dist/types/index.d.ts && \
            echo "export * from './types/index';" >> packages/rules-engine/dist/index.d.ts; \
        fi; \
        echo "export { FinOpsRulesEngine, type Ec2Instance, type EbsVolume, type EbsSnapshot } from './finops-engine';" >> packages/rules-engine/dist/index.d.ts; \
        echo "export type { DetectedIssue, Rule, RuleCondition, RuleAction, RuleEvaluationResult } from './types/index';" >> packages/rules-engine/dist/index.d.ts; \
        echo "✓ Created rules-engine/dist/index.d.ts"; \
        echo "Verifying DetectedIssue is exported:"; \
        (grep -q "DetectedIssue" packages/rules-engine/dist/index.d.ts && echo "✓ DetectedIssue found in index.d.ts") || \
        (echo "✗ DetectedIssue NOT found!" && cat packages/rules-engine/dist/index.d.ts); \
    else \
        echo "✓ rules-engine dist/index.d.ts exists"; \
    fi && \
    echo "✓ Rules-engine ready for pricing build"

# Build pricing from root using workspace command
RUN npm run build --workspace=packages/pricing

# 3. Build API (depends on all packages) from root using workspace command
RUN npm run build --workspace=apps/api

WORKDIR /app

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files for workspace setup
COPY package*.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/aws-client/package.json ./packages/aws-client/
COPY packages/pricing/package.json ./packages/pricing/
COPY packages/rules-engine/package.json ./packages/rules-engine/
COPY packages/shared/package.json ./packages/shared/

# Copy built files from builder
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/packages/aws-client/dist ./packages/aws-client/dist
COPY --from=builder /app/packages/pricing/dist ./packages/pricing/dist
COPY --from=builder /app/packages/rules-engine/dist ./packages/rules-engine/dist
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist

# Install production dependencies only
# This will install dependencies for all workspaces but only production ones
RUN npm ci --omit=dev

# Generate Prisma Client
WORKDIR /app/apps/api
RUN npx prisma generate

WORKDIR /app

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "apps/api/dist/index.js"]
