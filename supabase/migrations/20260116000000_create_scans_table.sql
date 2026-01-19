-- CreateTable: scans
-- Matches Prisma schema (apps/api/prisma/schema.prisma) and existing migration.
-- Run this in Supabase: SQL Editor > New query > paste > Run.
--
-- If you use Supabase as your API's Postgres, set DATABASE_URL in apps/api to:
--   postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
-- (Connection string from: Supabase Dashboard > Project Settings > Database)

CREATE TABLE IF NOT EXISTS "scans" (
  "id" TEXT NOT NULL,
  "scanId" TEXT NOT NULL,
  "customerId" TEXT,
  "timestamp" TIMESTAMP(3) NOT NULL,
  "region" TEXT NOT NULL,
  "costSummary" JSONB NOT NULL,
  "resourceInventory" JSONB NOT NULL,
  "issues" JSONB NOT NULL,
  "savings" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "scans_pkey" PRIMARY KEY ("id")
);

-- Indexes (match Prisma)
CREATE UNIQUE INDEX IF NOT EXISTS "scans_scanId_key" ON "scans" ("scanId");
CREATE INDEX IF NOT EXISTS "scans_scanId_idx" ON "scans" ("scanId");
CREATE INDEX IF NOT EXISTS "scans_customerId_idx" ON "scans" ("customerId");
CREATE INDEX IF NOT EXISTS "scans_timestamp_idx" ON "scans" ("timestamp");

-- Optional: keep updatedAt in sync when row is updated (Prisma already sets it; useful for raw SQL / Supabase client)
CREATE OR REPLACE FUNCTION "update_updated_at"()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "scans_updated_at" ON "scans";
CREATE TRIGGER "scans_updated_at"
  BEFORE UPDATE ON "scans"
  FOR EACH ROW
  EXECUTE FUNCTION "update_updated_at"();

-- Optional: Row Level Security (RLS)
-- Uncomment if you want to query scans from the frontend via Supabase client (e.g. supabase.from('scans').select()).
-- You’ll likely need a user_id column and policies; customerId can be mapped from your auth later.
--
-- ALTER TABLE "scans" ENABLE ROW LEVEL SECURITY;
--
-- CREATE POLICY "Users can read own scans"
--   ON "scans" FOR SELECT
--   USING (auth.uid()::text = "customerId" OR "customerId" IS NULL);
--
-- CREATE POLICY "Service role can do anything"
--   ON "scans" FOR ALL
--   USING (auth.role() = 'service_role');
