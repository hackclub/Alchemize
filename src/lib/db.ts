import { drizzle } from 'drizzle-orm/neon-http'
import { eq } from 'drizzle-orm'
import { integer, pgTable, varchar,  } from "drizzle-orm/pg-core";
import { DATABASE_URL} from '$env/static/private'
import type {UserCurrency} from './types'
// Schemas
export const userTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userid: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 455 }).notNull(),
  hackatime: varchar({ length: 1000 }).notNull(),
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
    email: varchar({ length: 455 }).notNull(),
    roles: varchar({ length: 355 }).notNull(),
    name: varchar({ length: 255 }).notNull(),
    nda: varchar({ length: 255 }).notNull(),
})

// Response Interface
export interface DBResponse {
    ok: boolean;
    status: number;
    json: () => Promise<any>;
    text: () => Promise<string>;
}
export interface airtableReplication{
    id: string
    fields:any
} 
const db = drizzle(DATABASE_URL); //Database Connection

// Database Compatiblity Layer
export const getUserByEmail = async (email: string): Promise<DBResponse> => {
    const users = await db.select().from(userTable).where(eq(userTable.email, email));
    const records = users.map(user => ({ id: user.id + "", fields: user }));
    return {
        ok: true,
        status: 200,
        json: async () => ({ records }),
        text: async () => JSON.stringify({ records }),
    }
}
export const createNewUser = async (email: string, userid: string): Promise<DBResponse> => {
    const currency = JSON.stringify({redstone:0,glowstone:0,aqua_regia:0,potion_mix:0} as UserCurrency)
    const newUser = await db.insert(userTable).values({email, userid: userid, hackatime: "", currency: ""}).returning();
    return {
        ok: true,
        status: 201,
        json: async () => ({id: newUser[0].id + "", fields: {email, userid, hackatime: "", currency: ""}} as airtableReplication),
        text: async () => JSON.stringify({id: newUser[0].id + "", fields: {email, userid, hackatime: "", currency: ""}} as airtableReplication),
    } as DBResponse;
}
export const createReferRecord = async (referedEmail: string, referer: string, yswsEligible: string, verified: string, referedName: string): Promise<DBResponse> => {
    const newRefer = await db.insert(refersTable).values({referedEmail, referer, yswsEligible, verified, referedName}).returning();
    return {
        ok: true,
        status: 201,
        json: async () => ({id: newRefer[0].id + "", fields: {referedEmail, referer, yswsEligible, verified, referedName}} as airtableReplication),
        text: async () => JSON.stringify({id: newRefer[0].id + "", fields: {referedEmail, referer, yswsEligible, verified, referedName}} as airtableReplication),
    } as DBResponse;
}
export const patchUserHackatime = async (email: string, hackatimeToken: string): Promise<DBResponse> => {
    const updatedUser = await db.update(userTable).set({hackatime: hackatimeToken}).where(eq(userTable.email, email)).returning();
    if (updatedUser.length === 0) {
        return {
            ok: false,
            status: 404,
            json: async () => ({message: "User not found"}),
            text: async () => JSON.stringify({message: "User not found"}),
        }
    }
    return {
        ok: true,
        status: 200,
        json: async () => ({id: updatedUser[0].id + "", fields: updatedUser[0]} as airtableReplication),
        text: async () => JSON.stringify({id: updatedUser[0].id + "", fields: updatedUser[0]} as airtableReplication),
    } as DBResponse;
}