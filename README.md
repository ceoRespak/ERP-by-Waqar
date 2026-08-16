# RESPAK Construction ERP

A modern, API-driven ERP for **RESPAK Construction (Pvt) Ltd.** — built from scratch to replace the legacy system at `erp.respak.pk`.

Built with **Next.js 15 (App Router, full-stack)**, **Auth.js (NextAuth v5)**, **Prisma + MySQL**, and **shadcn/ui + Tailwind CSS**.

---

## ✨ Highlights

- ✅ **Full REST API system** (`/api/...`) — every action is API-driven (the old ERP had no API)
- ✅ **Role-Based Access Control (RBAC)** — roles & permissions per module, plus per-project user access
- ✅ **Generic Approval Workflow Engine** — configurable multi-step approvals for every transaction type
- ✅ **Audit logging** — every create/approve/reject is recorded
- ✅ **Auto Reference Number System** — `PREFIX / PROJECT / YEAR / SERIAL` for PO, MR, GRN, IPC, VO, NCR, letters & memos
- ✅ **ISO 9001 / 14001 / 45001 ready** — document control, NCR/CAPA, risks, training, environment, safety
- ✅ **17 business modules** covering the full construction lifecycle — all with working UIs

## 🧩 Modules

| Module | Screens |
|---|---|
| **Projects** | Register with category (Construction / Real Estate / Supply Works / Solarization / Other), project dashboard with KPIs, project team & per-project access |
| **BOQ** | Multi-level BOQ tree editor with **rate analysis** (materials/labor/equipment + overhead/profit → auto rates) |
| **Progress** | Activity WBS tree, daily progress recording, planned vs actual **S-curve**, labor deployment & equipment usage logs |
| **Budget & Cost** | Budgets by activity/cost type + **cost-overrun alerts**, cost ledger, cost centers, **Variation Orders** (approval), **IPC** (interim payment certificates) |
| **Materials** | Material Request (approval) → store-to-project **issue** (auto-posts stock + cost), per-line issued/remaining tracking |
| **Procurement** | Purchase Requisitions (approval) → Purchase Orders (approval) → Goods Receipt Notes (auto-posts stock) |
| **Inventory** | Items, Categories, Warehouses, Stock Levels, Transactions & Adjustments |
| **Finance** | Chart of Accounts, Journal Entries (balanced, approval), Payments (in/out, approval), Client Invoices (approval) |
| **HR & Payroll** | Employees, Departments/Designations, Attendance, Leave Requests (approval), Payroll Runs (approval) |
| **Vehicle Tracking** | Fleet register, Trip Logs, Fuel Logs, Maintenance, GPS location table |
| **Vendor Management** | Vendors, Performance Evaluations, Documents (NTN/registration) |
| **Client Management** | Clients, Projects, Contracts |
| **Site Management** | DPR (approval), Check Requests (approval), Submittals (approval), Transmittals |
| **Document Control** | ISO-controlled, versioned repository (POLICY/PROCEDURE/SOP/FORM/RECORD/MANUAL) with expiry alerts |
| **ISO Compliance** | NCR → CAPA (corrective/preventive actions), risk assessments, training records, environmental aspects, safety incidents |
| **Correspondence** | Letter IN / OUT / Internal Memo register with auto reference numbers |
| **Admin** | Users, Roles & Permissions, Approval Chain configuration, Approvals inbox |

## 🏗️ Enterprise Multi-Project Edition

The schema, services and architecture have been extended into a **multi-project, ISO-ready ERP**:

- **Multi-project management** — unlimited projects in `CONSTRUCTION / REAL_ESTATE / SUPPLY_WORKS / SOLARIZATION / OTHER` categories, with project-wise KPIs and per-user project assignment (`ProjectUser`).
- **BOQ Management** — multi-level BOQ trees with **rate analysis** (materials/labor/equipment + overhead/profit auto-computed rates).
- **Project Progress** — activity WBS trees, planned vs actual, S-curve data points, labor & equipment usage logs.
- **Budgeting & Cost Control** — budgets by BOQ/activity/cost-type, **budget vs actual** with `CostAlert`, cost centers, cost logs, **Variation Orders**, and **IPC** generation.
- **Material Request → Issue** workflow (project-wise, posts to stock + cost).
- **Auto Reference Number System** — configurable `PREFIX / PROJECT / YEAR / SERIAL` (PO, MR, GRN, IPC, VO, NCR, letters, memos) via `NumberingConfig` + atomic counters.
- **Document Control (ISO)** — versioned document repository (POLICY/PROCEDURE/SOP/FORM/RECORD/MANUAL) with expiry alerts.
- **ISO 9001 / 14001 / 45001** — NCR → CAPA, risk assessments, training/competency records, environmental aspect registers, safety incident investigation workflow.
- **Correspondence** — Letter IN / OUT / internal memo register with auto ref numbers.

See **`ARCHITECTURE.md`** for the full ERD, multi-project design, RBAC model, API map, ISO architecture, and the scalability roadmap.

---

## 🏗️ Architecture

```
d:\ERP BY WAQAR
├── prisma/
│   ├── schema.prisma        # Full MySQL schema (9 modules + RBAC + approvals)
│   └── seed.ts              # Roles, permissions, approval chains, demo data
├── src/
│   ├── app/
│   │   ├── (auth)/login/    # Sign-in page
│   │   ├── (dashboard)/     # Protected app shell + all module pages
│   │   └── api/             # REST API routes (one per resource)
│   ├── components/
│   │   ├── ui/              # shadcn-style primitives (Button, Table, Card, …)
│   │   ├── layout/          # Sidebar, Topbar, nav config
│   │   └── <module>/        # Client form components per module
│   ├── lib/
│   │   ├── auth.ts          # NextAuth config (JWT + roles/permissions in token)
│   │   ├── db.ts            # Prisma singleton
│   │   ├── permissions.ts   # requirePermission / hasPermission guards
│   │   └── constants.ts     # Permission keys, approval entity types, status maps
│   ├── server/
│   │   ├── approval/        # ⭐ Generic approval engine (submit/approve/reject)
│   │   ├── audit.ts         # Audit log writer
│   │   └── <module>/        # Service layer per module (business logic)
│   ├── middleware.ts        # Route protection
│   └── types/               # next-auth type augmentation
```

### How the Approval Engine works

1. A document (PR, Check Request, Leave, Journal, Payroll, Invoice, Payment, DPR, Submittal) is created in **DRAFT**.
2. The user clicks **"Submit for Approval"** → the engine creates an `ApprovalRequest`, links it to the active **ApprovalChain** for that document type, and sets status to **PENDING**.
3. Approvers see it in the **Approvals** inbox (badge shows the count). Each step is assigned to a **role** or a specific **user**.
4. **Approve** advances to the next step; on the last step the document is **APPROVED**. **Reject** stops the flow and returns the document to **REJECTED** (re-editable).
5. If no chain is configured for a document type, it **auto-approves**.

Chains are configured in **Settings → Approval Workflows** (e.g. Check Request: Site Engineer → Project Manager → Finance Manager).

---

## 🚀 Getting Started

### Prerequisites
- **Node.js 18.18+** (20 LTS recommended)
- **MySQL 8.x** (local or cloud)
- npm

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
Copy `.env.example` to `.env` and edit:
```env
DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/respak_erp"
AUTH_SECRET="generate-a-long-random-string"   # e.g. `openssl rand -base64 32`
NEXTAUTH_URL="http://localhost:3000"
```
Create the database if it doesn't exist:
```sql
CREATE DATABASE respak_erp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Push the schema & seed
```bash
npx prisma db push      # create tables (or: npm run db:migrate)
npm run db:seed         # roles, permissions, approval chains, demo data
```

### 4. Run
```bash
npm run dev             # http://localhost:3000
```

### ⚡ Running locally on this machine (no MySQL install needed)

This PC had no MySQL, so a **portable MariaDB** (MySQL-compatible) is bundled under
`C:\Users\<you>\.local\mariadb` — no admin rights or Windows service required.

```bash
npm run db:start        # start portable MariaDB on :3306 (if not running)
npm run dev             # start Next.js on http://localhost:3000
npm run db:stop         # stop MariaDB when done
```

The database `respak_erp` (user `respak` / `respak123`) was already created and seeded.
If the data is ever wiped, re-run:
```bash
npx prisma db push
npm run db:seed
```

### Default logins (from seed)

| Role | Email | Password |
|---|---|---|
| Super Admin | `superadmin@respak.pk` | `Admin@123` |
| Admin | `admin@respak.pk` | `Admin@123` |
| Procurement Manager | `procurement@respak.pk` | `Password@123` |
| Store Keeper | `store@respak.pk` | `Password@123` |
| Finance Manager | `finance@respak.pk` | `Password@123` |
| Accountant | `accountant@respak.pk` | `Password@123` |
| HR Manager | `hr@respak.pk` | `Password@123` |
| Project Manager | `pm@respak.pk` | `Password@123` |
| Site Engineer | `site@respak.pk` | `Password@123` |

> ⚠️ Change all passwords before going live.

### Useful scripts
| Command | Purpose |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript check |
| `npm run db:push` | Sync schema to MySQL (dev) |
| `npm run db:migrate` | Create migration (recommended for prod) |
| `npm run db:seed` | Seed data |
| `npm run db:studio` | Open Prisma Studio to inspect data |

---

## 🔌 API Overview

All routes are under `/api` and guarded by JWT + permission checks (e.g. `procurement:create`).

```
POST /api/auth/...                          # NextAuth sign-in
GET/POST /api/approvals                     # Pending approvals, approve/reject actions
GET/POST /api/procurement/requisitions      # + /[id]/submit
GET/POST /api/procurement/purchase-orders   # + /[id]/submit
GET/POST /api/procurement/grns              # Receives goods → posts stock
GET/POST /api/inventory/{items,categories,warehouses,transactions}
GET      /api/inventory/stock
GET/POST /api/finance/{accounts,journal,payments,invoices}  # + /[id]/submit
GET/POST /api/hr/{employees,departments,designations,attendance,leaves,payroll}  # + /[id]/submit
GET/POST /api/vehicles                      # + /trips, /fuel, /maintenance
GET/POST /api/vendors                       # + /evaluations, /documents
GET/POST /api/clients                       # + /projects, /contracts
GET/POST /api/sites/{dpr,check-requests,submittals,transmittals}  # + /[id]/submit
GET/POST /api/settings/{users,roles,approval-chains}             # role permissions, chain toggle
```

Standard shape: `{ error: string }` on failure, `{ ...data }` on success.

---

## 🗺️ Recommended Next Steps

1. **File uploads** — integrate a storage bucket for vendor documents / site attachments (schema model `Attachment` already exists).
2. **Supplier (AP) invoices** — model `SupplierInvoice` is already in the schema; add the screen + service.
3. **Vehicle GPS** — push device positions to `POST /api/vehicles/location` (the `VehicleLocation` model is ready) and add a map view.
4. **Reports** — add a reporting module (pivot tables/export) for finance, stock and DPR.
5. **Email notifications** — send approvers an email when a document is submitted.
6. **Multi-company** — the `Company` model is scaffolded for future multi-branch support.
7. **Production hardening** — rate limiting, HTTPS, secrets manager, and change default credentials.

---

## 📝 Notes

- **Database strategy (dev):** use `prisma db push`. For production, prefer `prisma migrate dev` to generate versioned SQL migrations.
- Document numbers (PR-2026-0001, PO-…, GRN-…) are auto-generated.
- GRN posting updates stock levels and PO received quantities automatically.
- Payroll runs are generated from active employees' salaries and approved before release.
