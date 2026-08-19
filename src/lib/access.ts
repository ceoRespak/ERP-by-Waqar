import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import type { AuthUser } from "@/lib/permissions";

// =====================================================================
// PROJECT-AWARE PERMISSION ENGINE
// Replaces the fixed role system. Access is decided by:
//   1. SUPER_ADMIN — always allowed (no assignment needed)
//   2. UserProjectPermission grants (projectId = null → company-wide)
//   3. Legacy fallback: role-derived permissions baked into the JWT at
//      login (compatibility bridge while modules migrate).
// =====================================================================

export const SUPER_ADMIN_ROLE = "SUPER_ADMIN";

export function isSuperAdmin(user: Pick<AuthUser, "roles">): boolean {
  return (user.roles ?? []).includes(SUPER_ADMIN_ROLE);
}

/**
 * True if the user may perform `key` within `projectId`.
 * - projectId given  → checks (user, project) grant, then global (null) grant
 * - projectId null/undefined → checks the global (null) grant
 * Super Admin always passes.
 */
export async function userHasPermission(user: Pick<AuthUser, "id" | "roles" | "permissions">, key: string, projectId?: number | null): Promise<boolean> {
  if (isSuperAdmin(user)) return true;
  const userId = Number(user.id);

  const grants = await prisma.userProjectPermission.findMany({
    where: {
      userId,
      permission: { key, isActive: true },
      // project-specific grant, or company-wide (null) grant
      OR: [{ projectId: projectId ?? null }, { projectId: null }],
    },
    select: { id: true },
  });
  if (grants.length > 0) return true;

  // Legacy compatibility bridge: role-derived permission from the JWT.
  return (user.permissions ?? []).includes(key);
}

/** Server-page guard (redirects when not permitted). Returns the user. */
export async function requireProjectPermission(key: string, projectId?: number | null): Promise<AuthUser> {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const user = session.user as AuthUser;
  if (await userHasPermission(user, key, projectId)) return user;
  redirect("/dashboard");
}

/** API guard — returns the user when permitted, else null. */
export async function apiRequireProjectPermission(key: string, projectId?: number | null): Promise<AuthUser | null> {
  const session = await auth();
  if (!session?.user) return null;
  const user = session.user as AuthUser;
  if (await userHasPermission(user, key, projectId)) return user;
  return null;
}

/**
 * Section access: does the user have ANY permission belonging to `section`
 * for `projectId` (or globally)? Super Admin passes.
 */
export async function hasSectionAccess(user: Pick<AuthUser, "id" | "roles" | "permissions">, section: string, projectId?: number | null): Promise<boolean> {
  if (isSuperAdmin(user)) return true;
  const userId = Number(user.id);

  const sectionPerms = await prisma.permission.findMany({
    where: { section, isActive: true },
    select: { key: true },
  });
  const sectionKeys = new Set(sectionPerms.map((p) => p.key));
  if (sectionKeys.size === 0) return false;

  const grantCount = await prisma.userProjectPermission.count({
    where: {
      userId,
      OR: [{ projectId: projectId ?? null }, { projectId: null }],
      permission: { section, isActive: true },
    },
  });
  if (grantCount > 0) return true;

  // Legacy fallback
  return (user.permissions ?? []).some((k) => sectionKeys.has(k));
}

/** Server-page section guard. */
export async function requireSectionAccess(section: string, projectId?: number | null): Promise<AuthUser> {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const user = session.user as AuthUser;
  if (await hasSectionAccess(user, section, projectId)) return user;
  redirect("/dashboard");
}

/** API section guard. */
export async function apiRequireSectionAccess(section: string, projectId?: number | null): Promise<AuthUser | null> {
  const session = await auth();
  if (!session?.user) return null;
  const user = session.user as AuthUser;
  if (await hasSectionAccess(user, section, projectId)) return user;
  return null;
}

/** Project membership check (for assignment visibility), Super Admin passes. */
export async function isProjectMember(user: Pick<AuthUser, "id" | "roles">, projectId: number): Promise<boolean> {
  if (isSuperAdmin(user)) return true;
  const member = await prisma.projectUser.findUnique({
    where: { projectId_userId: { projectId, userId: Number(user.id) } },
    select: { id: true },
  });
  return !!member;
}
