# Admin Panel V1 Plan

## Purpose

Internal tooling for:
- **Monitoring**: Track key SaaS metrics and health
- **Support**: Debug user issues and investigate problems
- **Operations**: Basic user and subscription management

**Not for**: Customer-facing features, advanced analytics, or user management workflows.

---

## V1 Pages

### 1. Dashboard

**Purpose**: High-level overview of platform health and growth

**Data Shown**:
- User metrics: total users, new users (7d), free vs paid breakdown
- Scan metrics: total scans, scans (24h/7d), average scans per user
- Revenue metrics: active subscriptions, canceled subscriptions
- Health signals: % users with scans, failed scans count

**Actions**: None (read-only)

**Source**: `/api/v1/admin/metrics`

---

### 2. Users List

**Purpose**: View all users for support and debugging

**Data Shown**:
- User ID, email, created date
- Scan count per user
- Subscription status (free/paid)
- Last scan date

**Actions**:
- View user details (read-only)
- Filter by: subscription status, has scans

**Source**: New endpoint `/api/v1/admin/users` (list with counts)

---

### 3. Scans List

**Purpose**: Monitor scan activity and debug scan issues

**Data Shown**:
- Scan ID, customer ID, timestamp, region
- Cost summary (total cost)
- Savings summary (monthly savings)
- Created date

**Actions**:
- View scan details (read-only)
- Filter by: date range, customer ID, region
- Sort by: date (newest first)

**Source**: New endpoint `/api/v1/admin/scans` (paginated list)

---

### 4. Subscriptions Overview

**Purpose**: Monitor subscription health and revenue

**Data Shown**:
- Active subscriptions count
- Canceled subscriptions count
- Subscription details: customer ID, status, created date, period end
- Stripe subscription ID (for support)

**Actions**:
- View subscription details (read-only)
- Filter by: status (active/canceled)

**Source**: New endpoint `/api/v1/admin/subscriptions` (list from customerStorage)

---

### 5. Error Logs

**Purpose**: Basic error monitoring for debugging

**Data Shown**:
- Recent errors (last 100)
- Error type, message, timestamp
- Associated user/scan ID (if available)
- Stack trace (development only)

**Actions**:
- View error details (read-only)
- Filter by: error type, date range

**Source**: New endpoint `/api/v1/admin/errors` (from application logs)

---

## What NOT Included in V1

- User impersonation
- User editing/deletion
- Subscription management (create/cancel)
- Advanced analytics/charts
- Export functionality
- Search across all entities
- Bulk operations
- Audit logs
- Role management (beyond admin check)

---

## Build Triggers

Build admin UI when:
- **User count**: > 100 active users
- **Support load**: > 5 support requests/week requiring admin access
- **Operational need**: Recurring manual database queries for support

**Current state**: API endpoints exist; defer UI until triggers met.

---

## Tech Stack

**Frontend**:
- Reuse existing React + TypeScript + Vite setup
- Reuse existing Tailwind CSS styling
- Reuse existing auth context (add admin check)

**Routing**:
- Add `/admin/*` routes protected by admin middleware
- Redirect non-admins to main app

**API**:
- Extend existing `/api/v1/admin/*` endpoints
- Reuse existing admin middleware
- Add pagination for list endpoints

**Design**:
- Minimal UI (tables, basic filters)
- No heavy design system
- Focus on function over form

---

## Implementation Order

1. **Dashboard** (highest value, metrics exist)
2. **Scans List** (most support requests)
3. **Users List** (user investigation)
4. **Subscriptions Overview** (revenue monitoring)
5. **Error Logs** (debugging tool)

---

## Future Considerations (Post-V1)

- User search
- Scan comparison
- Export to CSV
- Basic charts/graphs
- Error alerting
- User activity timeline
