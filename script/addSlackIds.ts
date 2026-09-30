import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { eq } from "drizzle-orm";
import { pgTable, integer, varchar } from "drizzle-orm/pg-core";
import { WebClient } from "@slack/web-api";
import pLimit from "p-limit";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.production") });

const DB_URL = process.env.DATABASE_URL;
const slackToken = process.env.SLACK_BOT_TOKEN;

if (!DB_URL) {
    throw new Error("Missing DATABASE_URL environment variable");
}

if (!slackToken) {
    throw new Error("Missing SLACK_BOT_TOKEN environment variable");
}

export const userTable = pgTable("users", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userid: varchar({ length: 255 }).notNull(),
    email: varchar({ length: 455 }).notNull(),
    hackatime: varchar({ length: 1000 }),
    slackId: varchar({ length: 255 }),
    currency: varchar({ length: 2000 }).notNull().default("{}"),
    balanceHundredths: integer().notNull().default(0),
});

const pool = new pg.Pool({
    connectionString: DB_URL,
});

const db = drizzle(pool);
const slackWebClient = new WebClient(slackToken);

const main = async () => {
    console.log("Fetching users from database...");

    const users = await db.select().from(userTable);
    const usersToUpdate = users.filter(user => !user.slackId);

    console.log(`Found ${usersToUpdate.length} users without Slack IDs`);

    // Change this depending on Slack rate limits
    const limit = pLimit(5);

    await Promise.all(
        usersToUpdate.map(user =>
            limit(async () => {
                try {
                    const result = await slackWebClient.users.lookupByEmail({
                        email: user.email,
                    });

                    if (result.user?.id) {
                        const slackId = result.user.id;

                        await db
                            .update(userTable)
                            .set({ slackId })
                            .where(eq(userTable.id, user.id));

                        console.log(
                            `✓ Updated ${user.email} -> ${slackId}`
                        );
                    } else {
                        console.warn(
                            `⚠ No Slack user found for ${user.email}`
                        );
                    }
                } catch (error) {
                    console.error(
                        `✗ Error looking up ${user.email}:`,
                        error
                    );
                }
            })
        )
    );
};

main()
    .then(async () => {
        console.log("Finished updating Slack IDs");
        await pool.end();
    })
    .catch(async (error) => {
        console.error("Fatal error:", error);
        await pool.end();
        process.exit(1);
    });