-- Data integrity constraints. Idempotent; run BEFORE deploying the code from the same PR.
-- It refuses to run (and changes nothing) while duplicate users.email or admins."slackId" values exist, and
-- prints the query that lists them. Resolve those rows by hand first (merge balances/projects, fix Slack IDs).
BEGIN;

-- 1. One users row per email. Balances are credited/debited with UPDATE ... WHERE email = $1, so a duplicate
--    row (possible from two concurrent first logins) would double every credit.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM users GROUP BY email HAVING count(*) > 1) THEN
        RAISE EXCEPTION 'Duplicate users.email values exist. List them with: SELECT email, array_agg(id ORDER BY id) FROM users GROUP BY email HAVING count(*) > 1;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_email_unique') THEN
        ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);
    END IF;
END $$;

-- 2. Admin login matches on Slack ID: it must be present on new rows and unique among non-empty values.
--    NOT VALID: existing rows with an empty Slack ID don't block this migration (they can no longer log in),
--    but no new empty one can be written.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM admins WHERE "slackId" <> '' GROUP BY "slackId" HAVING count(*) > 1) THEN
        RAISE EXCEPTION 'Duplicate admins."slackId" values exist. List them with: SELECT "slackId", array_agg(email) FROM admins WHERE "slackId" <> '''' GROUP BY "slackId" HAVING count(*) > 1;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'admins_slack_id_not_empty') THEN
        ALTER TABLE admins ADD CONSTRAINT admins_slack_id_not_empty CHECK ("slackId" <> '') NOT VALID;
    END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS admins_slack_id_unique ON admins ("slackId") WHERE "slackId" <> '';

-- 3. orders."dateCreated" defaulted to the literal timestamp of when the schema was pushed, so every order got
--    the same date. Default to the insert time instead, in the same ISO-8601 string format as before.
ALTER TABLE orders ALTER COLUMN "dateCreated" SET DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');

-- 4. Price actually paid per unit, in hundredths of Aqua Regia. NULL on historical orders, which fall back to the
--    item's current price.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS "priceHundredths" integer;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_price_hundredths_nonnegative') THEN
        ALTER TABLE orders ADD CONSTRAINT orders_price_hundredths_nonnegative CHECK ("priceHundredths" IS NULL OR "priceHundredths" >= 0);
    END IF;
END $$;

COMMIT;
