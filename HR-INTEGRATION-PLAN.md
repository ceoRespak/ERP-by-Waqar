# HR System Integration Plan — respakHRM → RESPAK ERP

> Prepared 2026-08-19 · Source: `https://github.com/ceoRespak/hrmrespak` (cloned to `hr-system/`)

## 1. Reality check (important)

The HR system and the ERP are **different tech stacks**. "Reuse as-is at the file level" is not physically possible — but every **model, business rule, workflow and feature** can be preserved and ported faithfully.

| Layer | HR system (as-is) | ERP (target) | Consequence |
|---|---|---|---|
| Framework | Express 4 (MVC) | Next.js 15 App Router | Routes/controllers → Next.js API routes + server services |
| Persistence | MongoDB / Mongoose 7 | MySQL / Prisma | Mongoose schemas → Prisma models (tables) |
| UI | EJS templates + Bootstrap 5 | React + shadcn/Tailwind | 42 EJS views → Next.js pages/components |
| Auth | Own JWT + session | NextAuth v5 (JWT) + roles/permissions | Reuse ERP auth; map HR roles onto ERP roles |
| Real-time | Socket.IO | (ERP has none) | Notifications via polling → optional |

**What "as-is reuse" means here:** every field, enum, business rule and workflow from the HR system is ported 1:1 (attendance status thresholds, GPS radius gating, leave balance rules, PM→HR approval steps, one-project-per-employee rule, salary/wages formulas, XLSX export format, etc.). The *transport* (Mongo→MySQL, Express→Next.js, EJS→React) is rewritten — that is the unavoidable "necessary adjustment" the instructions allow.

## 2. HR system architecture (analyzed)

**12 Mongoose models:** `User`, `Employee`, `Attendance`, `Leave`, `LeaveType`, `Project`, `DailyWage`, `DailyWageWorker`, `Notification`, `Circular`, `DeviceRegistration`, `FaceEnrollment`.

**13 route modules → controllers** (`auth, dashboard, employees, projects, attendance, leaves, dailyWages, leaveTypes, circulars, devices, faceEnrollments, notifications, reports`), behind JWT `protect` + role `authorize(['admin','hr_manager','project_manager','employee'])`.

**Business logic highlights (to preserve):**
- **Attendance**: status from lateness — ≤15m `present`, ≤60m `late`, ≤240m `half_day`, else `absent`; self-check-in gates = registered device + GPS within `allowedRadius` (Haversine) + no back-dating + face photo; check-out recomputes status; monthly `totalHours`/`overtime`.
- **Approval workflows**: Attendance `pending → approved_by_pm → approved_by_hr`; Leave `pending → approved_by_pm → approved_by_hr` (two-step, concerned-PM rule, balance decrement only on final HR approval for paid leaves).
- **Leaves**: per-employee balances keyed by leave-type code (annual 24 / sick 12 / casual 10 / special 5 / emergency 5 / unpaid 0); overlap guard; half-day; leave-type CRUD auto-propagates balances to all employees.
- **Projects**: GPS location + `allowedRadius`, shift presets (morning/evening/night) + Ramadan `specialHours`, PM / site-supervisor (one active project each).
- **Daily wages**: worker registry (CNIC), bulk mark-attendance, weekly (Sat–Thu)/monthly reports, wage calc, CNIC→employee linking.
- **Salary/reports**: monthly payroll — daily-wage staff `gross = dailyWage × payableDays`; monthly staff `perDay = gross/daysInMonth`, deduction for absent/half-day/late, `net = gross − deduction − wht − advances`; XLSX export with "RESPAK (PRIVATE) LIMITED" header.
- **Circulars**: role-targeted, read tracking, optional email.
- **Devices & face**: device registration approval (binds `user.deviceId`), face-enrollment approval (copies 128-d descriptor to employee).
- **Notifications**: 13 types, polymorphic target, unread badge polling.

## 3. Target data model (Prisma → MySQL)

| HR Mongoose model | ERP Prisma model | Action |
|---|---|---|
| `User` | ERP `User` (exists) | **Reuse ERP auth**; HR roles → ERP roles/permissions |
| `Employee` | `Employee` (exists, basic) | **Upgrade** to advanced schema |
| `Attendance` | `Attendance` (exists, basic) | **Upgrade** (GPS/approval fields) |
| `Leave` | `LeaveRequest` (exists, basic) | **Upgrade** (two-step approval, balances) |
| `LeaveType` | `LeaveTypeConfig` (new) | New + `LeaveBalance` per employee |
| `Project` | `HrProject` (new) | Keep ERP construction `Project` untouched; HR sites are a separate concept |
| `DailyWage` | `DailyWage` (new) | New |
| `DailyWageWorker` | `DailyWageWorker` (new) | New |
| `Notification` | `Notification` (new) | New |
| `Circular` | `Circular` (new) | New |
| `DeviceRegistration` | `DeviceRegistration` (new) | New |
| `FaceEnrollment` | `FaceEnrollment` (new) | New |
| Embedded arrays (allowances, assignments, leaveBalances, attachments, docs, specialHours) | Child tables (allowances/assignments/leaveBalances/specialHours) + JSON columns (document path lists) | Convert |

Mongo `ObjectId` → Int FK; Mongoose enums → MySQL enum / string-typed columns; `timestamps` → `createdAt/updatedAt`.

## 4. Integration phases

- **Phase 0 — Decisions** (this document, pending your answers below).
- **Phase 1 — Schema**: Add/extend Prisma models, `prisma db push` + migration of existing seed.
- **Phase 2 — Auth & RBAC**: Add `hr:*` permissions/roles; map HR roles; reuse NextAuth.
- **Phase 3 — Services + API**: Port controllers → `src/server/hr/*` services + `src/app/api/hr/*` routes (JSON), preserving all rules above.
- **Phase 4 — UI**: Port 42 EJS views → Next.js pages under `/hr/...` (shadcn/Tailwind), keeping every workflow.
- **Phase 5 — Extras**: XLSX export (`xlsx`), file uploads (existing infra), notifications polling, GPS/face-enroll client pages.
- **Phase 6 — Menu, seed, verify**: Sidebar full HR section, demo data, `tsc`/build/test.

## 5. Decisions needed before coding

1. **Existing basic ERP HR models** — *upgrade in place* (recommended; single source of truth, updates existing HR pages/dashboard counts/seed) vs *keep both* (add advanced models alongside).
2. **Auth** — reuse ERP NextAuth + map roles (recommended) vs port HR's own login.
3. **UI style** — ERP shadcn/Tailwind (recommended, consistent) vs Bootstrap look.
4. **First milestone** — schema + auth + core (employees, projects, leaves, attendance) first, then daily wages/reports/circulars/devices/face.
