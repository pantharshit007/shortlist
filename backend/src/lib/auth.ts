import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { anonymous, genericOAuth } from "better-auth/plugins";
import { env } from "../config/env.js";
import { db } from "../db/index.js";
import * as schema from "../db/schema/index.js";
import { generateUsername } from "../modules/users/usernames.js";

const socialProviders = {
  ...(env.GOOGLE_CLIENT_ID &&
    env.GOOGLE_CLIENT_SECRET && {
      google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET },
    }),
  ...(env.GITHUB_CLIENT_ID &&
    env.GITHUB_CLIENT_SECRET && {
      github: { clientId: env.GITHUB_CLIENT_ID, clientSecret: env.GITHUB_CLIENT_SECRET },
    }),
};

// "Sign in with ChatGPT" is a standard OpenID Connect provider, so it goes through generic OAuth.
const chatgptProvider =
  env.CHATGPT_CLIENT_ID && env.CHATGPT_CLIENT_SECRET
    ? [
        {
          providerId: "chatgpt",
          clientId: env.CHATGPT_CLIENT_ID,
          clientSecret: env.CHATGPT_CLIENT_SECRET,
          discoveryUrl: env.CHATGPT_DISCOVERY_URL,
          scopes: ["openid", "profile", "email"],
          pkce: true,
        },
      ]
    : [];

export const guestLoginEnabled = env.ENABLE_GUEST_LOGIN ?? env.NODE_ENV !== "production";

export const auth = betterAuth({
  appName: "Resume Builder",
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [env.FRONTEND_URL],
  database: drizzleAdapter(db, { provider: "pg", schema, usePlural: true }),
  socialProviders,
  user: {
    additionalFields: {
      username: { type: "string", required: false, input: false },
      plan: { type: "string", required: false, input: false, defaultValue: "free" },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => ({
          data: { ...user, username: await generateUsername(user.name, user.email) },
        }),
      },
    },
  },
  plugins: [
    ...(guestLoginEnabled ? [anonymous({ generateName: () => "Guest", emailDomainName: "guest.invalid" })] : []),
    genericOAuth({ config: chatgptProvider }),
  ],
  advanced: {
    database: { generateId: "uuid" },
    ...(env.COOKIE_DOMAIN && {
      crossSubDomainCookies: { enabled: true, domain: env.COOKIE_DOMAIN },
    }),
  },
});

export type AuthUser = typeof auth.$Infer.Session.user;
export type AuthSession = typeof auth.$Infer.Session.session;
