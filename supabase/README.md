# Supabase setup

## Creating the `scans` table in Supabase

### Option 1: Supabase SQL Editor (simplest)

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. Go to **SQL Editor** → **New query**.
3. Copy the contents of `migrations/20260116000000_create_scans_table.sql` and run it.

### Option 2: Supabase CLI

If you use [Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
# Link to your project (once)
supabase link --project-ref <your-project-ref>

# Run migrations
supabase db push
```

---

## Using Supabase as your API database

To point your API (Prisma) at Supabase Postgres:

1. **Supabase Dashboard** → **Project Settings** → **Database**.
2. Copy the **Connection string** (URI). Use the **Transaction** pooler for Prisma (port `6543`), or the **Session** (port `5432`) if you prefer.
3. In `apps/api`, set `DATABASE_URL` in `.env`:

   ```
   DATABASE_URL="postgresql://postgres.[ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
   ```

   For `pgbouncer=true` (pooler), you need to run migrations with the **direct** connection (port `5432`) because Prisma migrations don’t work well with PgBouncer. Use the non-pooled URL when running `prisma migrate deploy`.

4. Run Prisma migrations (if this DB is empty and you’re not using the SQL above):

   ```bash
   cd apps/api && npx prisma migrate deploy
   ```

---

## Table: `scans`

| Column            | Type         | Description                                      |
|------------------|--------------|--------------------------------------------------|
| `id`             | TEXT (PK)   | UUID                                           |
| `scanId`        | TEXT (unique)| Business ID, e.g. `scan-1737...-abc123`         |
| `customerId`     | TEXT (nullable) | Links to your customer/subscription system  |
| `timestamp`      | TIMESTAMP(3) | When the scan ran                               |
| `region`         | TEXT         | AWS region                                      |
| `costSummary`    | JSONB        | `{ totalCost, currency, period, services }`     |
| `resourceInventory` | JSONB     | `{ ec2Instances, ebsVolumes, ebsSnapshots }`    |
| `issues`         | JSONB        | `Array<DetectedIssue>`                          |
| `savings`        | JSONB        | `{ totalMonthlySavings, totalAnnualSavings, ... }` |
| `createdAt`      | TIMESTAMP(3) | Set on insert                                   |
| `updatedAt`      | TIMESTAMP(3) | Set on insert and update (trigger)              |
