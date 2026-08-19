# Dynamic Project-Based Permission System — Integration Plan

> Replaces the fixed role system. Access is decided per **user × project × permission**.
> Super Admin bypasses everything. Roles are admin-created **templates** that
> materialize into per-project grants.

## 1. Architecture

```
User ──< UserRole >── Role ──< RolePermission >── Permission
  │                                                    │
  └────── UserProjectPermission ───────────────────────┘   (source of truth)
                 │
             ProjectId (null = company-wide)
```

**Access resolution** (`src/lib/access.ts` `userHasPermission(user, key, projectId?)`):
1. `SUPER_ADMIN` → **always allowed** (no assignment needed).
2. `UserProjectPermission` grant for `(user, projectId, permission)` — or the
   company-wide `(user, null, permission)` grant.
3. Legacy fallback: role-derived permissions baked into the JWT at login
   (compatibility bridge during migration).

## 2. Database schema (Prisma → MySQL)

| Table | Purpose |
|---|---|
| `users` | Generic users — **no user types** (no vendor/customer/employee kinds) |
| `roles` | Admin-created permission **templates** (containers; grant no access by themselves) |
| `permissions` | Dynamic catalog — `category` = `OPERATIONAL` \| `APPROVAL` \| `SECTION`, plus `section` key |
| `role_permissions` | Role ↔ permission (template definition) |
| `projects` | ERP projects |
| `project_users` | Project membership (`ProjectUser`) |
| `user_project_permissions` | **All grants**: `(userId, projectId, permissionId)` — projectId `null` = company-wide |
| `approval_requests` / `approval_actions` | Approval workflow (approve/reject/forward) |
| Vendor liabilities / customer ledger / HR leave / inventory items | Existing ERP tables; access controlled by SECTION permissions |

Permission categories:
- **OPERATIONAL** — CRUD-style: `procurement:read/create/update/delete`, `cost:create`, `progress:update`, `boq:manage`, `finance:payments`…
- **APPROVAL** — `X:approve` per module (`procurement:approve`, `cost:approve`, `progress:approve`, `boq:approve`, `hr:approve`, `inventory:approve`…)
- **SECTION** — `vendor:liabilities`, `customer:ledger`, `inventory:access`, `hr:leave`, `hr:payroll`, `hr:attendance`, `cost:expenses`, `procurement:bills`, `boq:analysis`…

## 3. Permission engine & middleware

- `src/lib/access.ts` — `userHasPermission`, `requireProjectPermission` (page),
  `apiRequireProjectPermission` (API), `hasSectionAccess`, `requireSectionAccess`,
  `apiRequireSectionAccess`, `isProjectMember`, `isSuperAdmin`.
- `src/lib/permissions.ts` — `requirePermission(key, projectId?)` and
  `apiRequirePermission(key, projectId?)` now **delegate to the engine**
  (Super Admin bypass + grants + legacy JWT fallback). Passing `projectId`
  makes the check project-aware.
- The approval engine (`src/server/approval/service.ts`) now also authorizes via
  the dynamic `<module>:approve` permission, in addition to chain step roles/users.

## 4. API routes (admin)

| Route | Action |
|---|---|
| `GET /api/settings/permissions` | Permission catalog grouped by category |
| `GET/POST /api/settings/roles`, `PATCH/DELETE /api/settings/roles/[id]`, `PUT /api/settings/roles/[id]/permissions` | Dynamic role CRUD + template definition |
| `GET/POST /api/settings/users` | List / create users (basic profile) |
| `GET/PATCH/DELETE /api/settings/users/[id]` | Detail / status / password / delete |
| `POST/DELETE /api/settings/users/[id]/projects` | Assign / remove project membership |
| `POST /api/settings/users/[id]/permissions` | Set grants for a project (`{projectId, permissionKeys}`) or apply a role template (`{roleId, projectId}`) |
| `POST /api/approvals/[id]/action` | Generic **approve / forward / reject** |
| `POST /api/access/check` | Runtime permission check `{permissionKey, projectId}` → `{allowed}` |
| `GET /api/access/sections?projectId=&sections=` | Section access map for the current user |

## 5. UI (admin)

- `/settings/users` — create user (basic profile only).
- `/settings/users/[id]` — **project assignment + per-project permission toggles**
  grouped into Operational / Approval / Section, with a **role-template apply**
  button and company-wide (global) scope.
- `/settings/roles` — dynamic role builder (existing RoleForm/RoleCard).
- `/settings` — users list with project & grant counts.

## 6. Module integration status & pattern

**Pattern** — every project-scoped API route:
```ts
const projectId = <from query or body>;
const user = await apiRequirePermission("module:action", projectId);
if (!user) return unauthorized();
```
Every page: `await requirePermission("module:read", projectId)`.

Wired to project-aware checks (this pass): **Cost/Expenses** (`/api/cost/logs`),
**Purchase Order** (`/api/procurement/purchase-orders`), **BOQ** (`/api/boq`),
**Progress** (`/api/progress/activities`). All other routes already enforce the
new engine at the **global** level via the bridge.

Remaining wiring (mechanical — apply the same pattern):
- Purchase Bill / GRN (`procurement:bills`, `procurement:approve`)
- Payments (`finance:payments`, `finance:approve`)
- Progress update by activity (`progress:update` — look up the activity's project)
- BOQ items + rate analysis (`boq:manage`, `boq:analysis`)
- Inventory (`inventory:access`, `inventory:approve`)
- HR leave approval (`hr:leave`, `hr:approve` — scope by the employee's project)
- Vendor liabilities (`vendor:liabilities`) & Customer ledger (`customer:ledger`)
  — add section checks to the finance/vendor/customer pages via
  `requireSectionAccess(section, projectId)`.
- Project dashboard — hide modules/sections/approval buttons without the
  matching permission for that project (`/api/access/sections` client-side, or
  `hasSectionAccess` server-side).

## 7. Migration notes

- Seed now creates **only** `SUPER_ADMIN` as a system role; the other legacy role
  names are empty containers (for approval-chain back-compat) and carry **no**
  permissions. All access is granted via `user_project_permissions`.
- Demo users received company-wide grants in the seed so the ERP stays usable;
  admins can re-grant per project from `/settings/users/[id]`.
- Super Admin needs no assignment. To make a user a Super Admin, give them the
  `SUPER_ADMIN` role (only from a Super Admin session).
