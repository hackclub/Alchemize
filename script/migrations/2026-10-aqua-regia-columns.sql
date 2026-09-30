-- Step 1 of the single-currency (Aqua Regia) migration. Purely additive: safe to run while the old code is live.
-- Step 2 is `script/migrateToAquaRegia.ts`, which converts the legacy balances and prices into these columns.
-- The legacy columns (users.currency, shop_items."itemPrice", ledger.amount) are dropped in a later release,
-- only after the migration has been verified against the backup tables it creates.
BEGIN;

-- Aqua Regia balance, in hundredths of a unit. The CHECK is a last line of defence against overdrafts.
ALTER TABLE users ADD COLUMN IF NOT EXISTS "balanceHundredths" integer NOT NULL DEFAULT 0;
DO $$ BEGIN
    ALTER TABLE users ADD CONSTRAINT users_balance_hundredths_nonnegative CHECK ("balanceHundredths" >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
-- New code no longer writes the legacy JSON, so give it a default
ALTER TABLE users ALTER COLUMN currency SET DEFAULT '{}';

-- Aqua Regia price, in hundredths of a unit
ALTER TABLE shop_items ADD COLUMN IF NOT EXISTS "priceHundredths" integer NOT NULL DEFAULT 0;
DO $$ BEGIN
    ALTER TABLE shop_items ADD CONSTRAINT shop_items_price_hundredths_nonnegative CHECK ("priceHundredths" >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE shop_items ALTER COLUMN "itemPrice" SET DEFAULT '{}'::jsonb;

-- Exact ledger amount for every entry written from now on; NULL on historical rows, which keep their `amount`
ALTER TABLE ledger ADD COLUMN IF NOT EXISTS "amountHundredths" integer;
DO $$ BEGIN
    ALTER TABLE ledger ADD CONSTRAINT ledger_amount_hundredths_nonnegative CHECK ("amountHundredths" IS NULL OR "amountHundredths" >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMIT;
