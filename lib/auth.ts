import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { db } from "./db/drizzle";
import { authSchema } from "./db/auth-schema";
import { user } from "./db/auth-schema";


export const auth = betterAuth({
    //plugins: [ apiKey() ] ,
    rateLimit: {
        window: 10, // time window in seconds
        max: 100, // max requests in the window
    },
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: authSchema
    }),
    secret: process.env.AUTH_SECRET!,
    emailAndPassword: {    
        enabled: true,
        autoSignIn: true
    } 
})