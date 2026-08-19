import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { userHasPermission } from "@/lib/access";

export const SUPER_ADMIN_ROLE = "SUPER_ADMIN";
export const ADMIN_ROLE = "ADMIN";

/**
 * Roles that bypass permission checks.
 * Per the dynamic permission model ONLY Super Admin bypasses all checks;
 * every other user is governed by per-project grants.
 */
const BYPASS_ROLES = [SUPER_ADMIN_ROLE];

/** Project-level access roles, ordered by strength. */
const PROJECT_ROLE_RANK: Record<string, number> = {
  VIEWER: 1,
  EDITOR: 2,
  APPROVER: 3,
  MANAGER: 4,
};

/**
 * Multi-project access guard. Verifies the user is assigned to the project
 * at (or above) the required role. SUPER_ADMIN bypasses.
 *
 * NOTE: kept as a compatibility layer — access decisions are migrating to
 * project-aware permissions (src/lib/access.ts).
 */
export async function requireProjectAccess(
  user: AuthUser,
  projectId: number,
  minRole: keyof typeof PROJECT_ROLE_RANK = "VIEWER"
): Promise<string> {
  if (user.roles.some((r) => BYPASS_ROLES.includes(r))) return "MANAGER";
  const assignment = await prisma.projectUser.findUnique({
    where: { projectId_userId: { projectId, userId: Number(user.id) } },
  });
  if (!assignment || (PROJECT_ROLE_RANK[assignment.role] ?? 0) < PROJECT_ROLE_RANK[minRole]) {
    redirect("/dashboard");
  }
  return assignment.role;
}

export type AuthUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  roles: string[];
  permissions: string[];
};

/**
 * Server-side guard. Returns the session user when permitted,
 * otherwise redirects to login or the dashboard (forbidden).
 *
 * Delegates to the dynamic, project-aware permission engine
 * (Super Admin bypass + UserProjectPermission grants + legacy JWT fallback).
 */
export async function requirePermission(permissionKey: string, projectId?: number | null): Promise<AuthUser> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as AuthUser;
  if (await userHasPermission(user, permissionKey, projectId)) return user;
  redirect("/dashboard");
}

/** Just require an authenticated session (any role). */
export async function requireAuth(): Promise<AuthUser> {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user as AuthUser;
}

/** Client-side check helper (used with session from useSession) */
export function hasPermission(
  user: { roles?: string[]; permissions?: string[] } | null | undefined,
  permissionKey: string
): boolean {
  if (!user) return false;
  const hasBypass = (user.roles ?? []).some((r) => BYPASS_ROLES.includes(r));
  if (hasBypass) return true;
  return (user.permissions ?? []).includes(permissionKey);
}

/** API-side guard. Returns session user or null (caller returns 401). */
export async function getApiUser() {
  const session = await auth();
  if (!session?.user) return null;
  return session.user as AuthUser;
}

/** API-side permission guard. Returns user or null when not permitted. */
export async function apiRequirePermission(permissionKey: string, projectId?: number | null): Promise<AuthUser | null> {
  const user = await getApiUser();
  if (!user) return null;
  if (await userHasPermission(user, permissionKey, projectId)) return user;
  return null;
}
