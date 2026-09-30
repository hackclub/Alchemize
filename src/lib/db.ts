import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { eq, and, gte, asc, desc } from 'drizzle-orm'
import { integer, pgTable, varchar, uuid, jsonb, boolean, real, timestamp } from "drizzle-orm/pg-core";
import type { Log } from './types'
import { CURRENCY_KEY, CURRENCY_NAME, hundredthsToUnits, formatAqua } from './currency'
import dotenv from 'dotenv';
dotenv.config();

let DATABASE_URL: string | undefined;

try {
    const svelteEnv = await import("$env/static/private");
    DATABASE_URL = svelteEnv.DATABASE_URL;
} catch (e) {
    const dotenv = await import('dotenv');
    dotenv.config();
    DATABASE_URL = process.env.DATABASE_URL;
}

if (!DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined");
}

// Schemas
export const userTable = pgTable("users", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userid: varchar({ length: 255 }).notNull(),
    email: varchar({ length: 455 }).notNull(),
    hackatime: varchar({ length: 1000 }),
    slackId: varchar({ length: 255 }),
    // Legacy multi-currency JSON, kept read-only until the Aqua Regia migration is verified; do not read or write it
    currency: varchar({ length: 2000 }).notNull().default("{}"),
    // Aqua Regia balance in hundredths of a unit (see $lib/currency)
    balanceHundredths: integer().notNull().default(0),
})
export const projectTable = pgTable("projects", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    Name: varchar({ length: 255 }).notNull(),
    type: varchar({ length: 255 }).notNull(),
    description: varchar({ length: 2000 }).notNull(),
    owner: varchar({ length: 455 }).notNull(),
    log: varchar({ length: 500000 }).notNull(),
    languages: varchar({ length: 1000 }).notNull(),
    journals: varchar({ length: 30000 }).notNull(),
    hackatime: varchar({ length: 1000 }).notNull(),
    update: varchar({ length: 255 }),
    code: varchar({ length: 1000 }),
    demo: varchar({ length: 1000 }),
    Theme: varchar({ length: 255 }).notNull(),
    address: varchar({ length: 10000 }).notNull(),
    birthdate: varchar({ length: 1000 }).notNull(),
    slackId: varchar({ length: 255 }).notNull(),
    status: varchar({ length: 255 }).notNull(),
    firstName: varchar({ length: 1000 }).notNull(),
    lastName: varchar({ length: 1000 }).notNull(),
    screenshot: varchar({ length: 1000 }).notNull().default(""),
    screenshot2: varchar({ length: 1000 }).notNull().default(""),
    unifiedId: uuid().notNull().unique().defaultRandom(),
    encryptionIv: varchar({ length: 255 }).notNull().default(""),
})
export const refersTable = pgTable("refers", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    referedEmail: varchar({ length: 455 }).notNull(),
    referer: varchar({ length: 355 }).notNull(),
    yswsEligible: varchar({ length: 255 }).notNull(),
    verified: varchar({ length: 255 }).notNull(),
    referedName: varchar({ length: 255 }).notNull(),
})
export const ordersTable = pgTable("orders", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    orderItem: varchar({ length: 255 }).notNull(),
    itemID: uuid().notNull(),
    qty: varchar({ length: 255 }).notNull(),
    ordererEmail: varchar({ length: 455 }).notNull(),
    ordererUid: varchar({ length: 255 }).notNull(),
    status: varchar({ length: 255 }).notNull(),
    fulfiller: varchar({ length: 255 }),
    moreData: varchar({ length: 3000 }),
    dateCreated: varchar({ length: 255 }).notNull().default(new Date().toISOString()),
})
export const adminTable = pgTable("admins", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    slackId: varchar({ length: 255 }).notNull(),
    email: varchar({ length: 455 }).notNull().unique(),
    roles: varchar({ length: 355 }).notNull(),
    name: varchar({ length: 255 }).notNull(),
    nda: varchar({ length: 255 }).notNull(),
})
export const justifications = pgTable("justifications", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar({ length: 255 }).notNull().default(""),
    projectId: varchar({ length: 255 }).notNull(),
    email: varchar({ length: 455 }).notNull(),
    demo: varchar({ length: 1000 }).notNull(),
    code: varchar({ length: 1000 }).notNull(),
    screenshot: varchar({ length: 1000 }).notNull(),
    screenshot2: varchar({ length: 1000 }).notNull().default(""),
    description: varchar({ length: 2000 }).notNull(),
    address: varchar({ length: 2000 }).notNull(),
    city: varchar({ length: 255 }).notNull(),
    state: varchar({ length: 255 }).notNull(),
    country: varchar({ length: 255 }).notNull(),
    zip: varchar({ length: 255 }).notNull(),
    birthdate: varchar({ length: 255 }).notNull(),
    overrideHoursSpent: varchar({ length: 255 }).notNull(),
    justification: varchar({ length: 5000 }).notNull(),
    firstName: varchar({ length: 255 }).notNull(),
    lastName: varchar({ length: 255 }).notNull(),
    iv: varchar({ length: 255 }).notNull().default(""),
})
export const shopItemsTable = pgTable("shop_items", {
    itemID: uuid().primaryKey().defaultRandom(),
    name: varchar({ length: 255 }).notNull(),
    description: varchar({ length: 1000 }).notNull(),
    // Legacy multi-currency price, kept read-only until the Aqua Regia migration is verified; do not read or write it
    itemPrice: jsonb().notNull().default({}),
    // Aqua Regia price in hundredths of a unit (see $lib/currency)
    priceHundredths: integer().notNull().default(0),
    cdnImage: varchar({ length: 1000 }).notNull(),
    priority: integer().notNull().default(0),
})
export const ledgerTable = pgTable("ledger", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    email: varchar({ length: 455 }).notNull(),
    slackId: varchar({ length: 255 }).notNull(),
    sign: boolean().notNull(), // true for credit, false for debit
    amount: real().notNull(), // display value in units; amountHundredths is authoritative for new entries
    amountHundredths: integer(),
    currencyType: varchar({ length: 255 }).notNull(),
    reason: varchar({ length: 455 }).notNull(),
    remarks: varchar({ length: 1000 }).notNull(),
})
export const userInternal = pgTable("user_internal_data", {
    userId: varchar({ length: 255 }).primaryKey(),
    email: varchar({ length: 455 }).notNull(),
    address: varchar().notNull(),
    birthdate: varchar({ length: 1000 }).notNull(),
    firstName: varchar({ length: 1000 }).notNull(),
    lastName: varchar({ length: 1000 }).notNull(),
    iv: varchar().notNull(),
})
export const rsvpTable = pgTable("rsvp", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    program: varchar({ length: 255 }).notNull(),
    slackId: varchar({ length: 255 }), // Not all RSVPs will have a Slack ID
    data: jsonb().notNull(),
    createdAt: timestamp().defaultNow().notNull()

})
// Response Interface
export interface DBResponse {
    ok: boolean;
    status: number;
    json: () => Promise<any>;
    text: () => Promise<string>;
}
export interface airtableReplication {
    id: string
    fields: any
}
const isNeon = DATABASE_URL?.includes("neon.tech");
const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: isNeon
        ? { rejectUnauthorized: false }
        : false
});

const db = drizzle(pool); //Database Connection

// Export pool for transaction support
export { pool };

// Transaction helper: performs a callback within a database transaction with row-level locking
export const withTransaction = async <T>(callback: (client: import('pg').PoolClient) => Promise<T>): Promise<T> => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

// Ledger insert bound to a transaction client, so the entry commits or rolls back with the balance change
export const insertLedgerEntryTx = async (client: import('pg').PoolClient, ledgerData: {
    email: string,
    slackId: string,
    sign: boolean,
    amountHundredths: number,
    reason: string,
    remarks: string
}) => {
    const { email, slackId, sign, amountHundredths, reason, remarks } = ledgerData
    await client.query(
        'INSERT INTO ledger (email, "slackId", sign, amount, "amountHundredths", "currencyType", reason, remarks) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [email, slackId, sign, hundredthsToUnits(amountHundredths), amountHundredths, CURRENCY_KEY, reason, remarks]
    );
};

// Error thrown inside a transaction callback to roll back and surface an HTTP status to the caller
export class TransactionAbort extends Error {
    status: number
    constructor(status: number, message: string) {
        super(message)
        this.status = status
    }
}

// Atomic shop purchase: deduct Aqua Regia, create the order and record the ledger debit in a single transaction.
// The balance check and the deduction are one conditional UPDATE, so the balance can never go negative.
export const atomicPurchaseItem = async (
    email: string,
    totalPriceHundredths: number,
    quantity: number,
    itemName: string,
    itemID: string,
    ordererUid: string,
    slackId: string,
    moreData: string,
): Promise<DBResponse> => {
    try {
        return await withTransaction(async (client) => {
            const deduction = await client.query(
                'UPDATE users SET "balanceHundredths" = "balanceHundredths" - $1 WHERE email = $2 AND "balanceHundredths" >= $1 RETURNING "balanceHundredths"',
                [totalPriceHundredths, email]
            );
            if (deduction.rows.length === 0) {
                const exists = await client.query('SELECT 1 FROM users WHERE email = $1', [email]);
                const status = exists.rows.length === 0 ? 404 : 400;
                const message = status === 404 ? "User not found" : `Insufficient ${CURRENCY_NAME}`;
                return {
                    ok: false,
                    status,
                    json: async () => ({ message }),
                    text: async () => JSON.stringify({ message }),
                };
            }
            const balanceHundredths: number = deduction.rows[0].balanceHundredths;
            const orderResult = await client.query(
                'INSERT INTO orders ("orderItem", "itemID", qty, "ordererEmail", "ordererUid", status, fulfiller, "moreData") VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
                [itemName, itemID, String(quantity), email, ordererUid, 'pending', '', moreData]
            );
            await insertLedgerEntryTx(client, {
                email,
                slackId: slackId,
                sign: false,
                amountHundredths: totalPriceHundredths,
                reason: `shop purchase`,
                remarks: `Deducted ${formatAqua(totalPriceHundredths)} for purchase of ${quantity} x ${itemName}`
            });
            return {
                ok: true,
                status: 200,
                json: async () => ({ message: "Purchase successful", balanceHundredths, orderId: String(orderResult.rows[0].id) }),
                text: async () => JSON.stringify({ message: "Purchase successful", balanceHundredths, orderId: String(orderResult.rows[0].id) }),
            };
        });
    } catch (error) {
        console.error("Atomic purchase failed:", error);
        return {
            ok: false,
            status: 500,
            json: async () => ({ message: "Purchase failed" }),
            text: async () => JSON.stringify({ message: "Purchase failed" }),
        };
    }
};

// Atomic T2 ship + award: locks the project and owner rows, hands the locked log to `ship` (which validates,
// computes the award and performs the external Unified submission), then writes the new log, credits the
// owner and records the ledger entry. If anything throws, nothing is written, and a concurrent ship of the
// same project blocks on the row lock and then sees the logs already pushed.
export const atomicShipProjectAndAward = async (
    projectId: number,
    ship: (locked: { log: Log[], owner: string, theme: string }) => Promise<{
        newLog: Log[],
        amountHundredths: number,
        remarks: string
    }>
): Promise<DBResponse> => {
    try {
        return await withTransaction(async (client) => {
            const projectResult = await client.query(
                'SELECT log, owner, "Theme" FROM projects WHERE id = $1 FOR UPDATE',
                [projectId]
            );
            if (projectResult.rows.length === 0) {
                throw new TransactionAbort(404, "Project not found");
            }
            const { log, owner, Theme } = projectResult.rows[0];
            // Lock the owner before any external side effect, so a missing user fails before Unified is contacted
            const userResult = await client.query(
                'SELECT "slackId" FROM users WHERE email = $1 FOR UPDATE',
                [owner]
            );
            if (userResult.rows.length === 0) {
                throw new TransactionAbort(404, "Project owner not found");
            }

            const { newLog, amountHundredths, remarks } = await ship({ log: JSON.parse(log || "[]") as Log[], owner, theme: Theme });
            if (!Number.isSafeInteger(amountHundredths) || amountHundredths < 0) {
                throw new TransactionAbort(500, "Invalid award amount");
            }

            await client.query(
                'UPDATE projects SET log = $1, status = $2 WHERE id = $3',
                [JSON.stringify(newLog), "accepted_t2", projectId]
            );
            if (amountHundredths > 0) {
                await client.query(
                    'UPDATE users SET "balanceHundredths" = "balanceHundredths" + $1 WHERE email = $2',
                    [amountHundredths, owner]
                );
                await insertLedgerEntryTx(client, {
                    email: owner,
                    slackId: userResult.rows[0].slackId ?? "",
                    sign: true,
                    amountHundredths,
                    reason: "review-accept",
                    remarks
                });
            }
            return {
                ok: true,
                status: 200,
                json: async () => ({ message: "Project shipped and currency awarded", amountHundredths, newLog }),
                text: async () => JSON.stringify({ message: "Project shipped and currency awarded", amountHundredths, newLog }),
            };
        });
    } catch (error) {
        const status = error instanceof TransactionAbort ? error.status : 500;
        const message = error instanceof TransactionAbort ? error.message : "Ship and award failed";
        if (!(error instanceof TransactionAbort)) {
            console.error("Atomic ship and award failed:", error);
        }
        return {
            ok: false,
            status,
            json: async () => ({ message }),
            text: async () => JSON.stringify({ message }),
        };
    }
};

// Database Compatiblity Layer

//User Functions
export const getUserByEmail = async (email: string): Promise<DBResponse> => {

    try {
        const users = await db.select().from(userTable).where(eq(userTable.email, email));
        const records = users.map(user => ({ id: user.id + "", fields: user })) as airtableReplication[];
        return {
            ok: true,
            status: 200,
            json: async () => ({ records }),
            text: async () => JSON.stringify({ records }),
        }
    } catch (error) {


        console.error("Database read failed:", error);
        return {
            ok: false,
            status: 500,
            json: async () => ({ message: "Database read failed" }),
            text: async () => JSON.stringify({ message: "Database read failed" }),
        };
    }
}

export const createNewUser = async (email: string, userid: string, slackId: string): Promise<DBResponse> => {
    try {
        const newUser = await db.insert(userTable).values({ email, userid: userid, slackId, hackatime: "" }).returning();

        return {
            ok: true,
            status: 201,
            json: async () => ({ id: newUser[0].id + "", fields: { email, userid, slackId, hackatime: "", balanceHundredths: 0 } } as airtableReplication),
            text: async () => JSON.stringify({ id: newUser[0].id + "", fields: { email, userid, slackId, hackatime: "", balanceHundredths: 0 } } as airtableReplication),
        } as DBResponse;
    } catch (error) {
        console.error("Database insert failed:", error);
        return {
            ok: false,
            status: 500,
            json: async () => ({ message: "Database insert failed" }),
            text: async () => JSON.stringify({ message: "Database insert failed" }),
        };
    }
}
export const patchUserHackatime = async (email: string, hackatimeToken: string): Promise<DBResponse> => {
    const updatedUser = await db.update(userTable).set({ hackatime: hackatimeToken }).where(eq(userTable.email, email)).returning();
    if (updatedUser.length === 0) {
        return {
            ok: false,
            status: 404,
            json: async () => ({ message: "User not found" }),
            text: async () => JSON.stringify({ message: "User not found" }),
        }
    }
    return {
        ok: true,
        status: 200,
        json: async () => ({ id: updatedUser[0].id + "", fields: updatedUser[0] } as airtableReplication),
        text: async () => JSON.stringify({ id: updatedUser[0].id + "", fields: updatedUser[0] } as airtableReplication),
    } as DBResponse;
}
export const getAllRefers = async (): Promise<DBResponse> => {
    const refers = await db.select({
        id: refersTable.id,
        referer: refersTable.referer,
        referedName: refersTable.referedName
    }).from(refersTable);
    const records = refers.map(refer => ({ id: refer.id + "", fields: refer }));
    return {
        ok: true,
        status: 200,
        json: async () => ({ records }),
        text: async () => JSON.stringify({ records }),
    } as DBResponse;
}
export const createReferRecord = async (referedEmail: string, referer: string, yswsEligible: string, verified: string, referedName: string): Promise<DBResponse> => {
    const newRefer = await db.insert(refersTable).values({ referedEmail, referer, yswsEligible, verified, referedName }).returning();
    return {
        ok: true,
        status: 201,
        json: async () => ({ id: newRefer[0].id + "", fields: { referedEmail, referer, yswsEligible, verified, referedName } } as airtableReplication),
        text: async () => JSON.stringify({ id: newRefer[0].id + "", fields: { referedEmail, referer, yswsEligible, verified, referedName } } as airtableReplication),
    } as DBResponse;
}

//Project Functions
export const getProjectsByOwner = async (owner: string): Promise<DBResponse> => {
    const projects = await db.select(
        {
            id: projectTable.id,
            Name: projectTable.Name,
            type: projectTable.type,
            description: projectTable.description,
            owner: projectTable.owner,
            log: projectTable.log,
            languages: projectTable.languages,
            journals: projectTable.journals,
            hackatime: projectTable.hackatime,
            update: projectTable.update,
            code: projectTable.code,
            demo: projectTable.demo,
            Theme: projectTable.Theme,
            slackId: projectTable.slackId,
            status: projectTable.status,
            screenshot: projectTable.screenshot,
            screenshot2: projectTable.screenshot2,
        }
    ).from(projectTable).where(eq(projectTable.owner, owner));
    const records = projects.map(project => ({ id: project.id + "", fields: project }));
    return {
        ok: true,
        status: 200,
        json: async () => ({ records }),
        text: async () => JSON.stringify({ records }),
    } as DBResponse;
}
export const getProjectWithHackatime = async (projectId: string): Promise<DBResponse> => {
    const projects = await db.select({
        id: projectTable.id,
        Name: projectTable.Name,
        hackatime: projectTable.hackatime,
        slackId: projectTable.slackId,
        hackatimeToken: userTable.hackatime,

    }).from(projectTable).where(eq(projectTable.id, parseInt(projectId))).leftJoin(userTable, eq(projectTable.owner, userTable.email));
    if (projects.length === 0) {
        return {
            ok: false,
            status: 404,
            json: async () => ({ message: "Project not found" }),
            text: async () => JSON.stringify({ message: "Project not found" }),
        }
    }

    const records = projects.map(project => ({ id: project.id + "", fields: project }));
    return {
        ok: true,
        status: 200,
        json: async () => ({ records }),
        text: async () => JSON.stringify({ records }),
    } as DBResponse;
}
export const getAllProjects = async (): Promise<DBResponse> => {
    // Explicitly select only non-sensitive fields
    const projects = await db.select({
        id: projectTable.id,
        Name: projectTable.Name,
        type: projectTable.type,
        description: projectTable.description,
        owner: projectTable.owner,
        log: projectTable.log,
        languages: projectTable.languages,
        journals: projectTable.journals,
        hackatime: projectTable.hackatime,
        update: projectTable.update,
        code: projectTable.code,
        demo: projectTable.demo,
        Theme: projectTable.Theme,
        slackId: projectTable.slackId,
        status: projectTable.status,
        screenshot: projectTable.screenshot,
    }).from(projectTable);

    const records = projects.map(project => ({ id: project.id + "", fields: project }));

    return {
        ok: true,
        status: 200,
        json: async () => ({ records }),
        text: async () => JSON.stringify({ records }),
    } as DBResponse;
}
export const getAllProjectsAdmin = async (): Promise<DBResponse> => {
    // Explicitly select only non-sensitive fields
    const projects = await db.select({
        id: projectTable.id,
        Name: projectTable.Name,
        type: projectTable.type,
        description: projectTable.description,
        owner: projectTable.owner,
        log: projectTable.log,
        languages: projectTable.languages,
        journals: projectTable.journals,
        hackatime: projectTable.hackatime,
        update: projectTable.update,
        code: projectTable.code,
        demo: projectTable.demo,
        Theme: projectTable.Theme,
        slackId: projectTable.slackId,
        status: projectTable.status,
        screenshot: projectTable.screenshot,
        screenshot2: projectTable.screenshot2,
        unifiedId: projectTable.unifiedId
    }).from(projectTable);

    const records = projects.map(project => ({ id: project.id + "", fields: project }));

    return {
        ok: true,
        status: 200,
        json: async () => ({ records }),
        text: async () => JSON.stringify({ records }),
    } as DBResponse;
}
export const createProject = async (projectData: any): Promise<DBResponse> => {
    const { Name, description, type, demo, code, status, log, hackatime, languages, update, journals, owner, Theme, address, birthdate, slackId, firstName, lastName, screenshot, iv, screenshot2 } = projectData
    const newProject = await db.insert(projectTable).values({ Name, description, type, demo, code, status, log, hackatime, languages, update, journals, owner, Theme, address, birthdate, slackId, firstName, lastName, screenshot, screenshot2, encryptionIv: iv }).returning();
    return {
        ok: true,
        status: 201,
        json: async () => ({ id: newProject[0].id + "", fields: newProject[0] } as airtableReplication),
        text: async () => JSON.stringify({ id: newProject[0].id + "", fields: newProject[0] } as airtableReplication),
    } as DBResponse;
}
export const updateProject = async (projectId: string, projectData: any, email: string): Promise<DBResponse> => {
    const allowedFields = ['Name', 'description', 'type', 'demo', 'code', 'hackatime', 'update', 'screenshot', 'Theme', 'screenshot2'];

    const updatePayload = Object.fromEntries(
        Object.entries(projectData)
            .filter(([key, value]) => allowedFields.includes(key) && value !== undefined && value !== "")
    );

    if (Object.keys(updatePayload).length === 0) {
        return {
            ok: false,
            status: 400,
            json: async () => ({ message: "No valid fields provided for update" }),
            text: async () => JSON.stringify({ message: "No valid fields provided for update" }),
        };
    }

    try {
        const updatedProject = await db
            .update(projectTable)
            .set(updatePayload)
            .where(and(eq(projectTable.id, parseInt(projectId)), eq(projectTable.owner, email)))
            .returning();

        if (updatedProject.length === 0) {
            return {
                ok: false,
                status: 404,
                json: async () => ({ message: "Project not found/project not yours" }),
                text: async () => JSON.stringify({ message: "Project not found/project not yours" }),
            };
        }

        const responsePayload = { id: updatedProject[0].id + "", fields: updatedProject[0] };

        return {
            ok: true,
            status: 200,
            json: async () => responsePayload as airtableReplication,
            text: async () => JSON.stringify(responsePayload),
        } as DBResponse;

    } catch (error) {
        console.error("Database write failed:", error);
        return {
            ok: false,
            status: 500,
            json: async () => ({ message: "Database update failed" }),
            text: async () => JSON.stringify({ message: "Database update failed" }),
        };
    }
};
// POWERFUL FUNCTION: Returns PII too, use with Caution. For use in APIs only, data never to be sent to client
export const getProjectById = async (projectId: string): Promise<DBResponse> => {
    const project = await db.select({
        id: projectTable.id,
        Name: projectTable.Name,
        type: projectTable.type,
        description: projectTable.description,
        owner: projectTable.owner,
        log: projectTable.log,
        languages: projectTable.languages,
        journals: projectTable.journals,
        hackatime: projectTable.hackatime,
        update: projectTable.update,
        code: projectTable.code,
        demo: projectTable.demo,
        Theme: projectTable.Theme,
        slackId: projectTable.slackId,
        status: projectTable.status,
        screenshot: projectTable.screenshot,
        screenshot2: projectTable.screenshot2,
        unifiedId: projectTable.unifiedId,
        address: userInternal.address,
        birthdate: userInternal.birthdate,
        firstName: userInternal.firstName,
        lastName: userInternal.lastName,
        iv: userInternal.iv
    }).from(projectTable).where(eq(projectTable.id, parseInt(projectId))).leftJoin(userInternal, eq(projectTable.owner, userInternal.email));
    if (project.length === 0) {
        return {
            ok: false,
            status: 404,
            json: async () => ({ message: "Project not found" }),
            text: async () => JSON.stringify({ message: "Project not found" }),
        };
    }
    return {
        ok: true,
        status: 200,
        json: async () => ({ id: project[0].id + "", fields: project[0] } as airtableReplication),
        text: async () => JSON.stringify({ id: project[0].id + "", fields: project[0] } as airtableReplication),
    } as DBResponse;
};
export const patchProjectForShip = async (projectId: string, log: Log[], status: string): Promise<DBResponse> => {
    const updatePayload = {
        log: JSON.stringify(log),
        status: status
    };
    try {
        const updatedProject = await db
            .update(projectTable)
            .set(updatePayload)
            .where(eq(projectTable.id, parseInt(projectId)))
            .returning();
        if (updatedProject.length === 0) {
            return {
                ok: false,
                status: 404,
                json: async () => ({ message: "Project not found" }),
                text: async () => JSON.stringify({ message: "Project not found" }),
            };
        }
        return {
            ok: true,
            status: 200,
            json: async () => ({ id: updatedProject[0].id + "", fields: updatedProject[0] } as airtableReplication),
            text: async () => JSON.stringify({ id: updatedProject[0].id + "", fields: updatedProject[0] } as airtableReplication),
        } as DBResponse;
    } catch (error) {
        console.error("Database write failed:", error);
        return {
            ok: false,
            status: 500,
            json: async () => ({ message: "Database update failed" }),
            text: async () => JSON.stringify({ message: "Database update failed" }),
        };
    }
};
export const deleteProject = async (projectId: string, email: string): Promise<DBResponse> => {
    try {
        const deletedProject = await db
            .delete(projectTable)
            .where(and(eq(projectTable.id, parseInt(projectId)), eq(projectTable.owner, email)))
            .returning();
        if (deletedProject.length === 0) {
            return {
                ok: false,
                status: 404,
                json: async () => ({ message: "Project not found" }),
                text: async () => JSON.stringify({ message: "Project not found" }),
            };
        }
        return {
            ok: true,
            status: 200,
            json: async () => ({ id: deletedProject[0].id + "", fields: deletedProject[0] } as airtableReplication),
            text: async () => JSON.stringify({ id: deletedProject[0].id + "", fields: deletedProject[0] } as airtableReplication),
        } as DBResponse;
    } catch (error) {
        console.error("Database write failed:", error);
        return {
            ok: false,
            status: 500,
            json: async () => ({ message: "Database update failed" }),
            text: async () => JSON.stringify({ message: "Database update failed" }),
        };
    }
};
//Shop Functions
export const createOrder = async (orderData: any): Promise<DBResponse> => {
    try {
        const { orderItem, itemID, qty, ordererEmail, ordererUid, status, fulfiller, moreData } = orderData
        const newOrder = await db.insert(ordersTable).values({ orderItem, itemID, qty, ordererEmail, ordererUid, status, fulfiller, moreData }).returning();
        return {
            ok: true,
            status: 201,
            json: async () => ({ id: newOrder[0].id + "", fields: newOrder[0] } as airtableReplication),
            text: async () => JSON.stringify({
                id: newOrder
                [0].id + "", fields: newOrder[0]
            } as airtableReplication),
        } as DBResponse;
    }
    catch (error) {
        console.error("Database insert failed:", error);
        return {
            ok: false,
            status: 500,
            json: async () => ({ message: "Database insert failed" }),
            text: async () => JSON.stringify({ message: "Database insert failed" }),
        }
    }
}
export const getOrdersByEmail = async (email: string): Promise<DBResponse> => {
    const orders = await db.select({
        id: ordersTable.id,
        orderItem: ordersTable.orderItem,
        itemID: ordersTable.itemID,
        qty: ordersTable.qty,
        ordererEmail: ordersTable.ordererEmail,
        fulfiller: ordersTable.fulfiller,
        itemName: shopItemsTable.name,
        cdnImage: shopItemsTable.cdnImage,
        priceHundredths: shopItemsTable.priceHundredths
    }).from(ordersTable).where(eq(ordersTable.ordererEmail, email)).leftJoin(shopItemsTable, eq(ordersTable.itemID, shopItemsTable.itemID));
    const records = orders.map(order => ({ id: order.id + "", fields: order }));
    return {
        ok: true,
        status: 200,
        json: async () => ({ records }),
        text: async () => JSON.stringify({ records }),
    } as DBResponse;
}
export const fetchAllItems = async (): Promise<DBResponse> => {
    //Soft Hides items with priority less than 0, so we can keep them in the database for record-keeping purposes without showing them in the shop
    const items = await db.select().from(shopItemsTable).where(gte(shopItemsTable.priority, 0)).orderBy(asc(shopItemsTable.priority));
    const records = items.map(item => ({ id: item.itemID + "", fields: item }));
    return {
        ok: true,
        status: 200,
        json: async () => ({ records }),
        text: async () => JSON.stringify({ records }),
    } as DBResponse;
}
export const adminFetchItemsById = async (itemId: string): Promise<DBResponse> => {
    const items = await db.select().from(shopItemsTable).where(eq(shopItemsTable.itemID, itemId));
    const records = items.map(item => ({ id: item.itemID + "", fields: item }));
    return {
        ok: true,
        status: 200,
        json: async () => ({ records }),
        text: async () => JSON.stringify({ records }),
    } as DBResponse;
}
export const upsertShopItem = async (itemData: {
    name: string,
    description: string,
    priceHundredths: number,
    cdnImage: string
}, itemID: string | null): Promise<DBResponse> => {
    const { name, description, priceHundredths, cdnImage } = itemData
    const newItem = await db.insert(shopItemsTable).values({ ...(itemID ? { itemID } : {}), name, description, priceHundredths, cdnImage }).onConflictDoUpdate({
        target: shopItemsTable.itemID,
        set: {
            name,
            description,
            priceHundredths,
            cdnImage
        }
    }).returning();
    return {
        ok: true,
        status: 201,
        json: async () => ({ id: newItem[0].itemID + "", fields: newItem[0] } as airtableReplication),
        text: async () => JSON.stringify({ id: newItem[0].itemID + "", fields: newItem[0] } as airtableReplication),
    } as DBResponse;
}

export const getShopItemById = async (itemId: string): Promise<DBResponse> => {
    //Does not consider items with priority less than 0, so we can keep "deleted" items in the database without showing them in the shop
    const item = await db.select().from(shopItemsTable).where(and(eq(shopItemsTable.itemID, itemId), gte(shopItemsTable.priority, 0)));
    if (item.length === 0) {
        return {
            ok: false,
            status: 404,
            json: async () => ({ message: "Item not found" }),
            text: async () => JSON.stringify({ message: "Item not found" }),
        };
    }
    return {
        ok: true,
        status: 200,
        json: async () => ({ id: item[0].itemID + "", fields: item[0] } as airtableReplication),
        text: async () => JSON.stringify({ id: item[0].itemID + "", fields: item[0] } as airtableReplication),
    } as DBResponse;
}
export const deleteShopItem = async (itemId: string): Promise<DBResponse> => {
    //This function does not actually delete the item, just sets its priority to -1 so it doesn't show up in the shop but we keep the data for record-keeping purposes
    //All the functions that do not care about priority being less than 0 are strictly Admin and fulfillment functions, so they can still access the data if needed
    const updatedItem = await db.update(shopItemsTable).set({ priority: -1 }).where(eq(shopItemsTable.itemID, itemId)).returning();
    if (updatedItem.length === 0) {
        return {
            ok: false,
            status: 404,
            json: async () => ({ message: "Item not found" }),
            text: async () => JSON.stringify({ message: "Item not found" }),
        };
    }
    return {
        ok: true,
        status: 200,
        json: async () => ({ id: updatedItem[0].itemID + "", fields: updatedItem[0] } as airtableReplication),
        text: async () => JSON.stringify({ id: updatedItem[0].itemID + "", fields: updatedItem[0] } as airtableReplication),
    } as DBResponse;
}
//Admin Functions
export const doesAdminExist = async (slackId: string): Promise<DBResponse> => {
    const admins = await db.select().from(adminTable).where(eq(adminTable.slackId, slackId));
    const records = admins.map(admin => ({ id: admin.id + "", fields: admin }));
    return {
        ok: true,
        status: 200,
        json: async () => ({ records }),
        text: async () => JSON.stringify({ records }),
    } as DBResponse;
}
export const getAllUsers = async (): Promise<DBResponse> => {
    const users = await db.select({
        email: userTable.email,
        id: userTable.id,
        userid: userTable.userid,
        slackId: userTable.slackId,
        balanceHundredths: userTable.balanceHundredths
    }).from(userTable);
    const records = users.map(user => ({ id: user.id + "", fields: user }));
    return {
        ok: true,
        status: 200,
        json: async () => ({ records }),
        text: async () => JSON.stringify({ records }),
    } as DBResponse;
}
export const addToJustifications = async (justificationData: {
    name: string,
    projectId: string,
    email: string,
    demo: string,
    code: string,
    screenshot: string,
    description: string,
    address: string,
    city: string,
    state: string,
    country: string,
    zip: string,
    birthdate: string,
    overrideHoursSpent: string,
    justification: string,
    firstName: string,
    lastName: string,
    screenshot2: string,
    iv: string
}): Promise<DBResponse> => {
    const { name, projectId, email, demo, code, screenshot, description, address, city, state, country, zip, birthdate, overrideHoursSpent, justification, firstName, lastName, screenshot2, iv } = justificationData
    const newJustification = await db.insert(justifications).values({ name, projectId, email, demo, code, screenshot, description, address, city, state, country, zip, birthdate, overrideHoursSpent, justification, firstName, lastName, screenshot2, iv }).returning();
    return {
        ok: true,
        status: 201,
        json: async () => ({ id: newJustification[0].id + "", fields: newJustification[0] } as airtableReplication),
        text: async () => JSON.stringify({ id: newJustification[0].id + "", fields: newJustification[0] } as airtableReplication),
    } as DBResponse;
}
export const getLatestJustificationByProjectId = async (projectId: string): Promise<DBResponse> => {
    // Only non-sensitive columns — never select the encrypted PII fields on this table
    const rows = await db.select({
        id: justifications.id,
        name: justifications.name,
        projectId: justifications.projectId,
        overrideHoursSpent: justifications.overrideHoursSpent,
        justification: justifications.justification,
    }).from(justifications).where(eq(justifications.projectId, projectId)).orderBy(desc(justifications.id)).limit(1);
    if (rows.length === 0) {
        return {
            ok: false,
            status: 404,
            json: async () => ({ message: "No justification found for this project" }),
            text: async () => JSON.stringify({ message: "No justification found for this project" }),
        } as DBResponse;
    }
    const records = rows.map(row => ({ id: row.id + "", fields: row }));
    return {
        ok: true,
        status: 200,
        json: async () => ({ records }),
        text: async () => JSON.stringify({ records }),
    } as DBResponse;
}
export const getAdminByEmail = async (email: string): Promise<DBResponse> => {
    const admins = await db.select().from(adminTable).where(eq(adminTable.email, email.trim()));

    const records = admins.map(admin => ({ id: admin.id + "", fields: admin }));
    return {
        ok: true,
        status: 200,
        json: async () => ({ records }),
        text: async () => JSON.stringify({ records }),
    } as DBResponse;
}
export const upsertAdmin = async (slackId: string, email: string, roles: string, name: string, nda: string): Promise<DBResponse> => {
    try {
        const adminRes = db.insert(adminTable).values({ slackId, email, roles, name, nda }).onConflictDoUpdate({
            target: adminTable.email,
            set: {
                slackId,
                roles,
                name,
                nda
            }
        }).returning();
        const admin = await adminRes;
        return {
            ok: true,
            status: 200,
            json: async () => ({ id: admin[0].id + "", fields: admin[0] } as airtableReplication),
            text: async () => JSON.stringify({ id: admin[0].id + "", fields: admin[0] } as airtableReplication),
        } as DBResponse;
    } catch (error) {
        console.error("Database upsert failed:", error);
        return {
            ok: false,
            status: 500,
            json: async () => ({ message: "Database upsert failed" }),
            text: async () => JSON.stringify({ message: "Database upsert failed" }),
        };
    }
}
export const fetchProjectFromUnifiedUUID = async (unifiedId: string): Promise<DBResponse> => {
    const project = await db.select({
        id: projectTable.id,
        Name: projectTable.Name,
        type: projectTable.type,
        description: projectTable.description,
        log: projectTable.log,
        languages: projectTable.languages,
        journals: projectTable.journals,
        hackatime: projectTable.hackatime,
        update: projectTable.update,
        code: projectTable.code,
        demo: projectTable.demo,
        Theme: projectTable.Theme,
        status: projectTable.status,
        screenshot: projectTable.screenshot
    }).from(projectTable).where(eq(projectTable.unifiedId, unifiedId));
    if (project.length === 0) {
        return {
            ok: false,
            status: 404,
            json: async () => ({ message: "Project not found" }),
            text: async () => JSON.stringify({ message: "Project not found" }),
        };
    }
    return {
        ok: true,
        status: 200,
        json: async () => ({ records: project }),
        text: async () => JSON.stringify({ records: project }),
    } as DBResponse;
}
// SUB FUNCTIONS ADMIN:- Fulfillers' functions

export const getAllOrders = async (): Promise<DBResponse> => {
    const orders = await db.select().from(ordersTable);
    const records = orders.map(order => ({ id: order.id + "", fields: order }));
    return {
        ok: true,
        status: 200,
        json: async () => ({ records }),
        text: async () => JSON.stringify({ records }),
    } as DBResponse;
}
export const getOrderDetailsById = async (orderId: string): Promise<DBResponse> => {
    try {
        const order = await db.select({
            id: ordersTable.id,
            orderItem: ordersTable.orderItem,
            itemID: ordersTable.itemID,
            qty: ordersTable.qty,
            ordererEmail: ordersTable.ordererEmail,
            ordererUid: ordersTable.ordererUid,
            status: ordersTable.status,
            fulfiller: ordersTable.fulfiller,
            moreData: ordersTable.moreData,
            dateCreated: ordersTable.dateCreated,

            itemName: shopItemsTable.name,
            itemDescription: shopItemsTable.description,
            priceHundredths: shopItemsTable.priceHundredths,
            cdnImage: shopItemsTable.cdnImage,
            priority: shopItemsTable.priority,

            userBirthdate: userInternal.birthdate,
            userFirstName: userInternal.firstName,
            userLastName: userInternal.lastName,
            iv: userInternal.iv,
        }).from(ordersTable).where(eq(ordersTable.id, parseInt(orderId))).leftJoin(shopItemsTable, eq(ordersTable.itemID, shopItemsTable.itemID)).leftJoin(userInternal, eq(ordersTable.ordererEmail, userInternal.email));
        if (order.length === 0) {
            return {
                ok: false,
                status: 404,
                json: async () => ({ message: "Order not found" }),
                text: async () => JSON.stringify({ message: "Order not found" }),
            };
        }

        return {
            ok: true,
            status: 200,
            json: async () => ({ id: order[0].id + "", fields: order[0] } as airtableReplication),
            text: async () => JSON.stringify({ id: order[0].id + "", fields: order[0] } as airtableReplication),
        } as DBResponse;
    } catch (e) {
        console.error("Database read failed:", e);
        throw new Error("Database read failed");
    }
}

//Special Auth Functions
export const addUserToAuthTable = async (email: string, address: string, birthdate: string, firstName: string, lastName: string, iv: string, uid: string): Promise<DBResponse> => {
    try {
        const newAuthUser = await db.insert(userInternal).values({ email, address, birthdate, firstName, lastName, iv, userId: uid }).onConflictDoUpdate({
            target: userInternal.userId,
            set: {
                address,
                birthdate,
                firstName,
                lastName,
                iv
            }
        }).returning();
        return {
            ok: true,
            status: 201,
            json: async () => ({ id: newAuthUser[0].userId + "", fields: newAuthUser[0] } as airtableReplication),
            text: async () => JSON.stringify({ id: newAuthUser[0].userId + "", fields: newAuthUser[0] } as airtableReplication),
        } as DBResponse;
    } catch (e) {
        console.error("Database insert failed:", e);
        throw new Error("Database insert failed");
    }
}
export const getUserFromAuthTable = async (uid: string): Promise<DBResponse> => {
    try {
        const user = await db.select().from(userInternal).where(eq(userInternal.userId, uid));
        if (user.length === 0) {
            return {
                ok: false,
                status: 404,
                json: async () => ({ message: "User not found" }),
                text: async () => JSON.stringify({ message: "User not found" }),
            };
        }
        return {
            ok: true,
            status: 200,
            json: async () => ({ id: user[0].userId + "", fields: user[0] } as airtableReplication),
            text: async () => JSON.stringify({ id: user[0].userId + "", fields: user[0] } as airtableReplication),
        }
    } catch (e) {
        console.error("Database read failed:", e);
        throw new Error("Database read failed");
    }


}
export const checkConfigByEmail = async (email: string): Promise<DBResponse> => {
    const dbRes = await db.select().from(userInternal).where(eq(userInternal.email, email));
    if (dbRes.length === 0) {
        return {
            ok: false,
            status: 404,
            json: async () => ({ message: "User not found" }),
            text: async () => JSON.stringify({ message: "User not found" }),
        };
    }
    return {
        ok: true,
        status: 200,
        json: async () => ({ address: dbRes[0].address !== "null", birthdate: dbRes[0].birthdate !== "null", firstName: dbRes[0].firstName !== "null", lastName: dbRes[0].lastName !== "null" }),
        text: async () => JSON.stringify({})
    }
}
export const markOrderAsFulfilled = async (orderId: string, fulfiller: string): Promise<DBResponse> => {
    const updatedOrder = await db.update(ordersTable).set({ status: "fulfilled", fulfiller }).where(eq(ordersTable.id, parseInt(orderId))).returning();
    if (updatedOrder.length === 0) {
        return {
            ok: false,
            status: 404,
            json: async () => ({ message: "Order not found" }),
            text: async () => JSON.stringify({ message: "Order not found" }),
        };
    }
    return {
        ok: true,
        status: 200,
        json: async () => ({ message: "Order marked as fulfilled" }),
        text: async () => JSON.stringify({ message: "Order marked as fulfilled" }),
    };
}
//RSVP Functions
export const createRSVP = async (rsvpData: {
    name: string,
    slackId: string,
    moreData: any,
}) => {
    const { name, slackId, moreData } = rsvpData
    const newRSVP = await db.insert(rsvpTable).values({ program: name, slackId, data: moreData }).returning();
    return {
        ok: true,
        status: 201,
        json: async () => ({ id: newRSVP[0].id + "", fields: newRSVP[0] } as airtableReplication),
        text: async () => JSON.stringify({ id: newRSVP[0].id + "", fields: newRSVP[0] } as airtableReplication),
    } as DBResponse;
}
export const getNPSResults = async (): Promise<DBResponse> => {
    const npsResults = await db.select().from(rsvpTable).where(eq(rsvpTable.program, "NPS"));
    return {
        ok: true,
        status: 200,
        json: async () => ({ results: npsResults }),
        text: async () => JSON.stringify({ results: npsResults }),
    };
}