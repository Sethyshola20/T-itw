import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { db } from "./db/drizzle";
import { authSchema } from "./db/auth-schema";
import { apiKey } from "better-auth/plugins";

export const auth = betterAuth({
  plugins: [
    apiKey({
      enableSessionForAPIKeys: true,
      apiKeyHeaders: ["chat-api-key"],
      rateLimit: {
        enabled: true,
        timeWindow: 1000 * 60, // 1 hour
        maxRequests: 100,
      },
    }),
  ],
  rateLimit: {
    window: 10, // time window in seconds
    max: 1000, // max requests in the window
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day (every 1 day the session expiration is updated)
  },

  database: drizzleAdapter(db, {
    provider: "pg",
    schema: authSchema,
  }),
  secret: process.env.AUTH_SECRET!,
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
});
