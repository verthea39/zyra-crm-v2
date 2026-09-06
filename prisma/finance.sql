-- ==============================================================================
-- Finance & Transactions Module - SQL Constraints, Triggers, Views, and Seed
--
-- This project manages its schema with `prisma db push` (see package.json),
-- not `prisma migrate`, so Prisma never applies raw SQL like this on its own.
-- It is run explicitly on every build via `prisma db execute --file`. Every
-- statement below must stay safe to re-run (CREATE OR REPLACE / IF EXISTS /
-- ON CONFLICT DO NOTHING) since it runs on every deploy, not just once.
-- ==============================================================================

-- 1. Table-level Check Constraints
-- Note: Prisma will drop these if the table is recreated, but they are essential.
-- This file re-runs on every build (see package.json), so each constraint is
-- dropped first to keep it idempotent.
ALTER TABLE "Transaction" DROP CONSTRAINT IF EXISTS "chk_txn_amounts_positive";
ALTER TABLE "Transaction" DROP CONSTRAINT IF EXISTS "chk_txn_settled_limit";
ALTER TABLE "Transaction"
  ADD CONSTRAINT "chk_txn_amounts_positive" CHECK ("amountFils" >= 0 AND "taxFils" >= 0),
  ADD CONSTRAINT "chk_txn_settled_limit" CHECK ("settledFils" <= "amountFils" + "taxFils");

ALTER TABLE "Payment" DROP CONSTRAINT IF EXISTS "chk_payment_amounts_positive";
ALTER TABLE "Payment" DROP CONSTRAINT IF EXISTS "chk_payment_unapplied_limit";
ALTER TABLE "Payment"
  ADD CONSTRAINT "chk_payment_amounts_positive" CHECK ("amountFils" >= 0 AND "unappliedFils" >= 0),
  ADD CONSTRAINT "chk_payment_unapplied_limit" CHECK ("unappliedFils" <= "amountFils");

ALTER TABLE "PaymentAllocation" DROP CONSTRAINT IF EXISTS "chk_alloc_amount_positive";
ALTER TABLE "PaymentAllocation"
  ADD CONSTRAINT "chk_alloc_amount_positive" CHECK ("amountFils" > 0);

-- 2. Deferred Constraint Trigger for Over-Settlement
-- Ensures concurrent payment postings cannot over-settle an invoice.
CREATE OR REPLACE FUNCTION check_transaction_over_settlement()
RETURNS TRIGGER AS $$
DECLARE
  v_gross bigint;
  v_allocated bigint;
BEGIN
  -- We only care if we are inserting or updating an allocation
  SELECT "amountFils" + "taxFils" INTO v_gross
  FROM "Transaction" 
  WHERE "id" = NEW."transactionId";

  SELECT COALESCE(SUM("amountFils"), 0) INTO v_allocated
  FROM "PaymentAllocation"
  WHERE "transactionId" = NEW."transactionId";

  IF v_allocated > v_gross THEN
    RAISE EXCEPTION 'Transaction % cannot be over-settled. Gross: %, Allocated: %', NEW."transactionId", v_gross, v_allocated;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "trg_check_over_settlement" ON "PaymentAllocation";
CREATE CONSTRAINT TRIGGER "trg_check_over_settlement"
AFTER INSERT OR UPDATE ON "PaymentAllocation"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION check_transaction_over_settlement();

-- 3. Views
-- client_balance: billed, collected, due, oldest open date, open count per client
CREATE OR REPLACE VIEW "client_balance" AS
WITH Billed AS (
  SELECT 
    "clientId",
    SUM("amountFils" + "taxFils") as billedFils,
    COUNT(*) FILTER (WHERE "status" IN ('UNPAID', 'PARTIAL')) as openCount,
    MIN("occurredAt") FILTER (WHERE "status" IN ('UNPAID', 'PARTIAL')) as oldestOpenDate
  FROM "Transaction"
  WHERE "clientId" IS NOT NULL AND "deletedAt" IS NULL AND "status" != 'VOID' AND "direction" = 'INCOME'
  GROUP BY "clientId"
),
Collected AS (
  SELECT 
    "clientId",
    SUM("amountFils") as collectedFils
  FROM "Payment"
  WHERE "clientId" IS NOT NULL AND "deletedAt" IS NULL AND "direction" = 'IN'
  GROUP BY "clientId"
)
SELECT 
  c."id" AS "clientId",
  COALESCE(b.billedFils, 0) AS "billedFils",
  COALESCE(col.collectedFils, 0) AS "collectedFils",
  GREATEST(COALESCE(b.billedFils, 0) - COALESCE(col.collectedFils, 0), 0) AS "dueFils",
  COALESCE(b.openCount, 0) AS "openCount",
  b.oldestOpenDate AS "oldestOpenDate"
FROM "Client" c
LEFT JOIN Billed b ON c."id" = b."clientId"
LEFT JOIN Collected col ON c."id" = col."clientId";

-- receivables_ageing: 0-30, 31-60, 61-90, 90+ buckets
CREATE OR REPLACE VIEW "receivables_ageing" AS
SELECT 
  "clientId",
  SUM(CASE WHEN days_old <= 30 THEN due ELSE 0 END) as "bucket_0_30",
  SUM(CASE WHEN days_old > 30 AND days_old <= 60 THEN due ELSE 0 END) as "bucket_31_60",
  SUM(CASE WHEN days_old > 60 AND days_old <= 90 THEN due ELSE 0 END) as "bucket_61_90",
  SUM(CASE WHEN days_old > 90 THEN due ELSE 0 END) as "bucket_90_plus"
FROM (
  SELECT 
    "clientId",
    EXTRACT(DAY FROM (NOW() - "occurredAt")) as days_old,
    ("amountFils" + "taxFils" - "settledFils") as due
  FROM "Transaction"
  WHERE "direction" = 'INCOME' AND "deletedAt" IS NULL AND "status" NOT IN ('PAID', 'VOID') AND "clientId" IS NOT NULL
) as OpenTxns
GROUP BY "clientId";

-- case_margin: billed, cost, government cost, margin per case
CREATE OR REPLACE VIEW "case_margin" AS
SELECT 
  cf."id" AS "caseFileId",
  COALESCE(SUM(t."amountFils") FILTER (WHERE t."direction" = 'INCOME'), 0) AS "billedFils",
  COALESCE(SUM(t."amountFils") FILTER (WHERE t."direction" = 'EXPENSE'), 0) AS "costFils",
  COALESCE(SUM(t."amountFils") FILTER (WHERE t."direction" = 'EXPENSE' AND cat."isGovernmentFee" = true), 0) AS "govCostFils",
  COALESCE(SUM(t."amountFils") FILTER (WHERE t."direction" = 'INCOME'), 0) - COALESCE(SUM(t."amountFils") FILTER (WHERE t."direction" = 'EXPENSE'), 0) AS "marginFils"
FROM "CaseFile" cf
LEFT JOIN "Transaction" t ON t."caseFileId" = cf."id" AND t."deletedAt" IS NULL AND t."status" != 'VOID'
LEFT JOIN "Category" cat ON t."categoryId" = cat."id"
GROUP BY cf."id";

-- account_balance: opening plus movements per account
CREATE OR REPLACE VIEW "account_balance" AS
SELECT 
  a."id" AS "accountId",
  a."name",
  a."type",
  a."openingBalanceFils" + COALESCE(SUM(
    CASE 
      WHEN p."direction" = 'IN' THEN p."amountFils" 
      WHEN p."direction" = 'OUT' THEN -p."amountFils" 
      ELSE 0 
    END
  ), 0) AS "currentBalanceFils"
FROM "Account" a
LEFT JOIN "Payment" p ON a."id" = p."accountId" AND p."deletedAt" IS NULL
GROUP BY a."id", a."name", a."type", a."openingBalanceFils";


-- 4. P&L Function for trend reports (generates empty months)
CREATE OR REPLACE FUNCTION get_monthly_pl(months_back INT)
RETURNS TABLE (
  month DATE,
  revenue BIGINT,
  expense BIGINT,
  net BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE months(m) AS (
    SELECT DATE_TRUNC('month', NOW() - (months_back || ' months')::interval)::DATE
    UNION ALL
    SELECT (m + INTERVAL '1 month')::DATE
    FROM months
    WHERE m < DATE_TRUNC('month', NOW())::DATE
  ),
  monthly_txns AS (
    SELECT 
      DATE_TRUNC('month', "occurredAt")::DATE as txn_month,
      SUM("amountFils") FILTER (WHERE "direction" = 'INCOME') as rev,
      SUM("amountFils") FILTER (WHERE "direction" = 'EXPENSE') as exp
    FROM "Transaction"
    WHERE "deletedAt" IS NULL AND "status" != 'VOID'
    GROUP BY DATE_TRUNC('month', "occurredAt")::DATE
  )
  SELECT 
    m.m AS month,
    COALESCE(t.rev, 0)::BIGINT AS revenue,
    COALESCE(t.exp, 0)::BIGINT AS expense,
    (COALESCE(t.rev, 0) - COALESCE(t.exp, 0))::BIGINT AS net
  FROM months m
  LEFT JOIN monthly_txns t ON m.m = t.txn_month
  ORDER BY m.m ASC;
END;
$$ LANGUAGE plpgsql;

-- 5. Seed Data (Categories)
INSERT INTO "Category" ("id", "name", "direction", "isGovernmentFee", "isActive", "sortOrder") VALUES
  (gen_random_uuid()::text, 'Service Fee', 'INCOME', false, true, 10),
  (gen_random_uuid()::text, 'Government Fee Recovery', 'INCOME', false, true, 20),
  (gen_random_uuid()::text, 'Urgent/Same-day Fee', 'INCOME', false, true, 30),
  (gen_random_uuid()::text, 'Typing Charges', 'INCOME', false, true, 40),
  (gen_random_uuid()::text, 'Immigration Fee', 'EXPENSE', true, true, 10),
  (gen_random_uuid()::text, 'MOHRE Fee', 'EXPENSE', true, true, 20),
  (gen_random_uuid()::text, 'Emirates ID Fee', 'EXPENSE', true, true, 30),
  (gen_random_uuid()::text, 'Medical Fitness', 'EXPENSE', true, true, 40),
  (gen_random_uuid()::text, 'Trade Licence Fee', 'EXPENSE', true, true, 50),
  (gen_random_uuid()::text, 'Fine/Penalty', 'EXPENSE', true, true, 60),
  (gen_random_uuid()::text, 'Typing Centre (Outsourced)', 'EXPENSE', false, true, 70),
  (gen_random_uuid()::text, 'Translation', 'EXPENSE', false, true, 80),
  (gen_random_uuid()::text, 'Courier', 'EXPENSE', false, true, 90),
  (gen_random_uuid()::text, 'Office Rent', 'EXPENSE', false, true, 100),
  (gen_random_uuid()::text, 'Salaries', 'EXPENSE', false, true, 110),
  (gen_random_uuid()::text, 'Utilities', 'EXPENSE', false, true, 120),
  (gen_random_uuid()::text, 'Marketing', 'EXPENSE', false, true, 130)
ON CONFLICT ("name", "direction") DO NOTHING;

-- Also seed some basic accounts if none exist
INSERT INTO "Account" ("id", "name", "type", "openingBalanceFils", "isActive") VALUES
  (gen_random_uuid()::text, 'Office Cash Drawer', 'CASH', 0, true),
  (gen_random_uuid()::text, 'Main Bank Account', 'BANK', 0, true),
  (gen_random_uuid()::text, 'Amer Portal', 'PORTAL', 0, true),
  (gen_random_uuid()::text, 'Tasheel Portal', 'PORTAL', 0, true)
ON CONFLICT ("name") DO NOTHING;
