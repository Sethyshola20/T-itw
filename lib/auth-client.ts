import { createAuthClient } from "better-auth/react";
import { apiKeyClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_SITE_URL,
  plugins: [apiKeyClient()],
});
