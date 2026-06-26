import crypto from "crypto"
import dotenv from "dotenv"
import { encryptAES } from "../src/lib/utils.server"
import { projectTable} from "../src/lib/db"
 import { drizzle } from "drizzle-orm/node-postgres"
 import {eq} from "drizzle-orm"
import { Pool } from "pg"
dotenv.config()
const { DATABASE_URL } = process.env
const main = async () => {
    const isNeon = DATABASE_URL?.includes("neon.tech");
    const pool = new Pool({
        connectionString: DATABASE_URL,
        ssl: isNeon
            ? { rejectUnauthorized: false }
            : false
    });
    
    const db = drizzle(pool); //Database Connection
    //Read all projects
    const projects = await db.select().from(projectTable);
    projects.forEach(async (project) => {
        const iv = crypto.randomBytes(16);
        const encryptedAddress = encryptAES(project.address, iv);
        const encryptedBirthdate = encryptAES(project.birthdate, iv);
        const encryptedFirstName = encryptAES(project.firstName, iv);
        const encryptedLastName = encryptAES(project.lastName, iv);
        const updatedProject = await db.update(projectTable).set({
            encryptionIv: iv.toString("hex"),
            address: encryptedAddress.finalString,
            birthdate: encryptedBirthdate.finalString,
            firstName: encryptedFirstName.finalString,
            lastName: encryptedLastName.finalString
        }).where(eq(projectTable.id, project.id)).returning();
    });
}
main();