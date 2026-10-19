import dotenv from 'dotenv';
import { defineConfig } from 'drizzle-kit';

dotenv.config({ path: ['.env.local', '.env'] });

// Migrations: `npm run db:generate` after changing the schema in src/lib/db.ts, `npm run db:migrate` to apply them.
// Don't use `drizzle-kit push` on a shared database: it makes the database match db.ts and drops what db.ts doesn't
// declare (e.g. CHECK constraints added by the hand-written SQL in script/migrations/).
export default defineConfig({
  out: './drizzle',
  schema: './src/lib/db.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  // script/drizzleBaseline.mjs writes to the same table
  migrations: {
    schema: 'drizzle',
    table: '__drizzle_migrations',
  },
});
