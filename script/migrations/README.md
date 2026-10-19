# Hand-written migrations (historical)

These ran by hand with `psql` before migrations moved to drizzle-kit, and are kept as the record of what they did.
Don't add new files here: new migrations live in `drizzle/` (see "Database migrations" in the top-level README).

`drizzle/0000_baseline.sql` is the schema these produced (together with `drizzle-kit push`). On a database that
predates drizzle migrations, `npm run db:migrate` records it as applied after checking that every table and column
it declares exists, so all of these must have run on that database first.

`2026-10-telescreen.sql` was replaced by `drizzle/0001_telescreen.sql`, which creates the same objects under the same
names and skips them if they already exist. Running either is fine; don't run both by hand.
