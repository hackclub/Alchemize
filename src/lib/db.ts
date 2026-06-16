import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { eq, and, gte } from 'drizzle-orm'
import { integer, pgTable, varchar, uuid, jsonb } from "drizzle-orm/pg-core";
import type { UserCurrency, Log } from './types'
import dotenv from 'dotenv';
dotenv.config();
import { DATABASE_URL } from "$env/static/private"
// const DATABASE_URL = process.env.DATABASE_URL;
// Schemas
export const userTable = pgTable("users", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userid: varchar({ length: 255 }).notNull(),
    email: varchar({ length: 455 }).notNull(),
    hackatime: varchar({ length: 1000 }),
    slackId: varchar({ length: 255 }),
    currency: varchar({ length: 2000 }).notNull(),
})
export const projectTable = pgTable("projects", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    Name: varchar({ length: 255 }).notNull(),
    type: varchar({ length: 255 }).notNull(),
    description: varchar({ length: 2000 }).notNull(),
    owner: varchar({ length: 455 }).notNull(),
    log: varchar({ length: 10000 }).notNull(),
    languages: varchar({ length: 1000 }).notNull(),
    journals: varchar({ length: 30000 }).notNull(),
    hackatime: varchar({ length: 1000 }).notNull(),
    update: varchar({ length: 255 }),
    code: varchar({ length: 1000 }),
    demo: varchar({ length: 1000 }),
    Theme: varchar({ length: 255 }).notNull(),
    address: varchar({ length: 2000 }).notNull(),
    birthdate: varchar({ length: 255 }).notNull(),
    slackId: varchar({ length: 255 }).notNull(),
    status: varchar({ length: 255 }).notNull(),
    firstName: varchar({ length: 255 }).notNull(),
    lastName: varchar({ length: 255 }).notNull(),
    screenshot: varchar({ length: 1000 }).notNull(),
    unifiedId: uuid().notNull().unique().defaultRandom(),

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
    itemID: varchar({ length: 255 }).notNull(),
    qty: varchar({ length: 255 }).notNull(),
    ordererEmail: varchar({ length: 455 }).notNull(),
    ordererUid: varchar({ length: 255 }).notNull(),
    status: varchar({ length: 255 }).notNull(),
    fulfiller: varchar({ length: 255 }),
    moreData: varchar({ length: 3000 }),
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
    projectId: varchar({ length: 255 }).notNull(),
    email: varchar({ length: 455 }).notNull(),
    demo: varchar({ length: 1000 }).notNull(),
    code: varchar({ length: 1000 }).notNull(),
    screenshot: varchar({ length: 1000 }).notNull(),
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
})
export const shopItemsTable = pgTable("shop_items", {
    itemID: uuid().primaryKey().defaultRandom(),
    name: varchar({ length: 255 }).notNull(),
    description: varchar({ length: 1000 }).notNull(),
    itemPrice: jsonb().notNull(),
    cdnImage: varchar({ length: 1000 }).notNull(),
    priority: integer().notNull().default(0),
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
        console.log(DATABASE_URL)

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
    const currency = JSON.stringify({ redstone: 0, glowstone: 0, aqua_regia: 0, potion_mix: 0 } as UserCurrency)
    try {
        const newUser = await db.insert(userTable).values({ email, userid: userid, slackId, hackatime: "", currency: currency }).returning();

        return {
            ok: true,
            status: 201,
            json: async () => ({ id: newUser[0].id + "", fields: { email, userid, slackId, hackatime: "", currency: "" } } as airtableReplication),
            text: async () => JSON.stringify({ id: newUser[0].id + "", fields: { email, userid, slackId, hackatime: "", currency: "" } } as airtableReplication),
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
export const patchUserCurrency = async (email: string, currency: UserCurrency): Promise<DBResponse> => {
    const currencyString = JSON.stringify(currency);
    const updatedUser = await db.update(userTable).set({ currency: currencyString }).where(eq(userTable.email, email)).returning();
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
export const getProjectsByOwner = async (owner: string): Promise<DBResponse> => {
    const projects = await db.select().from(projectTable).where(eq(projectTable.owner, owner));
    const records = projects.map(project => ({ id: project.id + "", fields: project }));
    return {
        ok: true,
        status: 200,
        json: async () => ({ records }),
        text: async () => JSON.stringify({ records }),
    } as DBResponse;
}

//Refer Functions
export const getAllRefers = async (): Promise<DBResponse> => {
    const refers = await db.select().from(refersTable);
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
export const getAllProjects = async (): Promise<DBResponse> => {
    const projects = await db.select().from(projectTable);
    const records = projects.map(project => ({ id: project.id + "", fields: project }));
    return {
        ok: true,
        status: 200,
        json: async () => ({ records }),
        text: async () => JSON.stringify({ records }),
    } as DBResponse;
}
export const createProject = async (projectData: any): Promise<DBResponse> => {
    const { Name, description, type, demo, code, status, log, hackatime, languages, update, journals, owner, Theme, address, birthdate, slackId, firstName, lastName, screenshot } = projectData
    const newProject = await db.insert(projectTable).values({ Name, description, type, demo, code, status, log, hackatime, languages, update, journals, owner, Theme, address, birthdate, slackId, firstName, lastName, screenshot }).returning();
    return {
        ok: true,
        status: 201,
        json: async () => ({ id: newProject[0].id + "", fields: newProject[0] } as airtableReplication),
        text: async () => JSON.stringify({ id: newProject[0].id + "", fields: newProject[0] } as airtableReplication),
    } as DBResponse;
}
export const updateProject = async (projectId: string, projectData: any, email: string): Promise<DBResponse> => {

    const allowedUpdates: Record<string, any> = {
        Name: projectData.Name,
        description: projectData.description,
        type: projectData.type,
        demo: projectData.demo,
        code: projectData.code,
        hackatime: projectData.hackatime,
        update: projectData.update,
    };


    const updatePayload = Object.fromEntries(
        Object.entries(allowedUpdates).filter(([_, value]) => value !== undefined && value !== "")
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
export const getProjectById = async (projectId: string): Promise<DBResponse> => {
    const project = await db.select().from(projectTable).where(eq(projectTable.id, parseInt(projectId)));
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
export const fetchAllItems = async (): Promise<DBResponse> => {
    //Soft Hides items with priority less than 0, so we can keep them in the database for record-keeping purposes without showing them in the shop
    const items = await db.select().from(shopItemsTable).where(gte(shopItemsTable.priority, 0));
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
    itemPrice: any,
    cdnImage: string
}, itemID: string | null): Promise<DBResponse> => {
    const { name, description, itemPrice, cdnImage } = itemData
    const newItem = await db.insert(shopItemsTable).values({ ...(itemID ? { itemID } : {}), name, description, itemPrice, cdnImage }).onConflictDoUpdate({
        target: shopItemsTable.itemID,
        set: {
            name,
            description,
            itemPrice,
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
    const users = await db.select().from(userTable);
    const records = users.map(user => ({ id: user.id + "", fields: user }));
    return {
        ok: true,
        status: 200,
        json: async () => ({ records }),
        text: async () => JSON.stringify({ records }),
    } as DBResponse;
}
export const addToJustifications = async (justificationData: {
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
    lastName: string
}): Promise<DBResponse> => {
    const { projectId, email, demo, code, screenshot, description, address, city, state, country, zip, birthdate, overrideHoursSpent, justification, firstName, lastName } = justificationData
    const newJustification = await db.insert(justifications).values({ projectId, email, demo, code, screenshot, description, address, city, state, country, zip, birthdate, overrideHoursSpent, justification, firstName, lastName }).returning();
    return {
        ok: true,
        status: 201,
        json: async () => ({ id: newJustification[0].id + "", fields: newJustification[0] } as airtableReplication),
        text: async () => JSON.stringify({ id: newJustification[0].id + "", fields: newJustification[0] } as airtableReplication),
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
    const project = await db.select().from(projectTable).where(eq(projectTable.unifiedId, unifiedId));
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
