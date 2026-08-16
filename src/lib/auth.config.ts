import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe NextAuth config used ONLY in middleware.
 * No Prisma / bcrypt here — the full providers config lives in lib/auth.ts
 * (Node runtime). The JWT carries the session, so middleware can authorize
 * requests without touching the database.
 */
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [],
} satisfies NextAuthConfig;
