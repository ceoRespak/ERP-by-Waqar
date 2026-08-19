import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { auditLog } from "@/server/audit";
import { MODULES } from "@/lib/constants";

// =====================================================================
// SETTINGS: Users, Roles, Permissions, Approval Chains
// =====================================================================

export async function listUsers() {
  return prisma.user.findMany({
    include: {
      roles: { include: { role: true } },
      employee: { select: { id: true, empCode: true, firstName: true, lastName: true } },
      _count: { select: { projectAssignments: true, projectPermissionGrants: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function createUser(data: {
  email: string;
  password: string;
  name: string;
  phone?: string | null;
  roleIds: number[];
}) {
  const password = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: {
      email: data.email.toLowerCase().trim(),
      password,
      name: data.name,
      phone: data.phone ?? null,
      status: "ACTIVE",
      roles: { create: data.roleIds.map((roleId) => ({ roleId })) },
    },
  });
  await auditLog({ action: "CREATE", module: MODULES.SETTINGS, entity: "USER", entityId: user.id, details: { email: user.email } });
  return user;
}

export async function updateUserRoles(userId: number, roleIds: number[]) {
  await prisma.userRole.deleteMany({ where: { userId } });
  return prisma.userRole.createMany({ data: roleIds.map((roleId) => ({ userId, roleId })) });
}

export async function setUserStatus(userId: number, status: "ACTIVE" | "INACTIVE") {
  return prisma.user.update({ where: { id: userId }, data: { status } });
}

export async function resetPassword(userId: number, password: string) {
  const hashed = await bcrypt.hash(password, 10);
  return prisma.user.update({ where: { id: userId }, data: { password: hashed } });
}

// ---------------------------------------------------------------------
// Roles & Permissions
// ---------------------------------------------------------------------
export async function listRoles() {
  return prisma.role.findMany({
    include: {
      _count: { select: { users: true, permissions: true } },
      permissions: { include: { permission: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function listPermissions() {
  return prisma.permission.findMany({ orderBy: [{ module: "asc" }, { action: "asc" }] });
}

export async function createRole(data: { name: string; description?: string | null; permissionIds?: number[] }) {
  const role = await prisma.role.create({
    data: {
      name: data.name.toUpperCase().trim(),
      description: data.description,
      isSystem: false,
      permissions: data.permissionIds?.length
        ? { create: data.permissionIds.map((permissionId) => ({ permissionId })) }
        : undefined,
    },
  });
  await auditLog({ action: "CREATE", module: MODULES.SETTINGS, entity: "ROLE", entityId: role.id, details: { name: role.name } });
  return role;
}

export async function updateRolePermissions(roleId: number, permissionIds: number[]) {
  await prisma.rolePermission.deleteMany({ where: { roleId } });
  return prisma.rolePermission.createMany({ data: permissionIds.map((permissionId) => ({ roleId, permissionId })) });
}

// ---------------------------------------------------------------------
// Dynamic, project-based permission management
// ---------------------------------------------------------------------
export async function getUserDetail(userId: number) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: { include: { role: true } },
      employee: { select: { id: true, empCode: true, firstName: true, lastName: true } },
      projectAssignments: { include: { project: { select: { id: true, code: true, name: true, status: true } } } },
      projectPermissionGrants: {
        include: { permission: { select: { id: true, key: true, module: true, action: true, category: true, section: true, description: true } }, project: { select: { id: true, code: true, name: true } } },
      },
    },
  });
}

/** All active permissions grouped by category for the assignment UI. */
export async function listPermissionCatalog() {
  return prisma.permission.findMany({ where: { isActive: true }, orderBy: [{ category: "asc" }, { module: "asc" }, { action: "asc" }] });
}

/** Ensure a user is a member of the given projects (ProjectUser rows). */
export async function assignUserProjects(userId: number, projectIds: number[]) {
  for (const projectId of projectIds) {
    await prisma.projectUser.upsert({
      where: { projectId_userId: { projectId, userId } },
      update: {},
      create: { projectId, userId, role: "EDITOR" },
    });
  }
  return { ok: true };
}

export async function removeUserProject(userId: number, projectId: number) {
  await prisma.projectUser.delete({ where: { projectId_userId: { projectId, userId } } });
  // also clear per-project grants for that project
  await prisma.userProjectPermission.deleteMany({ where: { userId, projectId } });
  return { ok: true };
}

/**
 * Replace all permission grants for (user, project).
 * projectId = null → company-wide (global) grants.
 */
export async function setUserProjectPermissions(userId: number, projectId: number | null, permissionKeys: string[]) {
  const keys = Array.from(new Set(permissionKeys));
  const perms = await prisma.permission.findMany({ where: { key: { in: keys }, isActive: true }, select: { id: true } });
  const permissionIds = perms.map((p) => p.id);
  await prisma.$transaction(async (tx) => {
    await tx.userProjectPermission.deleteMany({ where: { userId, projectId } });
    if (permissionIds.length) {
      await tx.userProjectPermission.createMany({
        data: permissionIds.map((permissionId) => ({ userId, projectId, permissionId })),
      });
    }
  });
  return { ok: true, granted: permissionIds.length };
}

/** Materialize a role's permission set into (user, project) grants. */
export async function applyRoleToUserProject(userId: number, projectId: number | null, roleId: number) {
  const role = await prisma.role.findUnique({ where: { id: roleId }, include: { permissions: { select: { permissionId: true } } } });
  if (!role) throw new Error("Role not found.");
  const permissionIds = role.permissions.map((r) => r.permissionId);
  await prisma.$transaction(async (tx) => {
    await tx.userProjectPermission.deleteMany({ where: { userId, projectId } });
    if (permissionIds.length) {
      await tx.userProjectPermission.createMany({
        data: permissionIds.map((permissionId) => ({ userId, projectId, permissionId })),
      });
    }
  });
  return { ok: true, granted: permissionIds.length, roleName: role.name };
}

export async function deleteUser(userId: number) {
  await prisma.user.delete({ where: { id: userId } });
  return { ok: true };
}

// ---------------------------------------------------------------------
// Approval Chains
// ---------------------------------------------------------------------
export async function listApprovalChains() {
  return prisma.approvalChain.findMany({
    include: {
      steps: { orderBy: { stepOrder: "asc" }, include: { role: true, user: true } },
      _count: { select: { requests: true } },
    },
    orderBy: [{ module: "asc" }, { entityType: "asc" }],
  });
}

export async function createApprovalChain(data: {
  name: string;
  module: string;
  entityType: string;
  description?: string | null;
  steps: { stepOrder: number; roleId?: number | null; userId?: number | null }[];
}) {
  const chain = await prisma.approvalChain.create({
    data: {
      name: data.name,
      module: data.module,
      entityType: data.entityType,
      description: data.description,
      isActive: true,
      steps: {
        create: data.steps
          .sort((a, b) => a.stepOrder - b.stepOrder)
          .map((s) => ({ stepOrder: s.stepOrder, roleId: s.roleId ?? null, userId: s.userId ?? null })),
      },
    },
  });
  await auditLog({
    action: "CREATE",
    module: MODULES.SETTINGS,
    entity: "APPROVAL_CHAIN",
    entityId: chain.id,
    details: { name: chain.name, entityType: chain.entityType },
  });
  return chain;
}

export async function toggleApprovalChain(chainId: number, isActive: boolean) {
  return prisma.approvalChain.update({ where: { id: chainId }, data: { isActive } });
}

export async function deleteApprovalChain(chainId: number) {
  return prisma.approvalChain.delete({ where: { id: chainId } });
}
