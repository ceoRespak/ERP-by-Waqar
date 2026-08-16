import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { auditLog } from "@/server/audit";
import { MODULES } from "@/lib/constants";

// =====================================================================
// SETTINGS: Users, Roles, Permissions, Approval Chains
// =====================================================================

export async function listUsers() {
  return prisma.user.findMany({
    include: { roles: { include: { role: true } }, employee: { select: { id: true, empCode: true, firstName: true, lastName: true } } },
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
