import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "ADMIN",
        input: false, // Prevents client from injecting role during signup
      },
      isActive: {
        type: "boolean",
        defaultValue: true,
        input: false, // Prevents client from modifying active status
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24,      // 1 day rolling renewal
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes — avoid DB round-trips on every request
    },
  },
});
