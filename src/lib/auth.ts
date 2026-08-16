import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { authConfig } from "@/lib/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: String(credentials.email).toLowerCase().trim() },
          include: {
            roles: {
              include: {
                role: { include: { permissions: { include: { permission: true } } } },
              },
            },
          },
        });
        if (!user) return null;

        const valid = await bcrypt.compare(String(credentials.password), user.password);
        if (!valid) return null;
        if (user.status !== "ACTIVE") return null;

        const roles = user.roles.map((r) => r.role.name);
        const permissions = user.roles.flatMap((r) =>
          r.role.permissions.map((p) => p.permission.key)
        );

        return {
          id: String(user.id),
          email: user.email,
          name: user.name,
          roles,
          permissions,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.roles = user.roles;
        token.permissions = user.permissions;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? "";
        session.user.roles = (token.roles as string[]) ?? [];
        session.user.permissions = (token.permissions as string[]) ?? [];
      }
      return session;
    },
  },
});
