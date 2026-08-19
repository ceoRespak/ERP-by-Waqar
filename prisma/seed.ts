import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PERMISSION_CATALOG } from "../src/lib/permissions-catalog";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding RESPAK ERP database...");

  // -----------------------------------------------------------------
  // Company
  // -----------------------------------------------------------------
  const company = await prisma.company.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: "RESPAK Construction (Pvt) Ltd",
      legalName: "RESPAK (Pvt) Ltd.",
      city: "Lahore",
      phone: "+92 42 111 000 000",
      email: "info@respak.pk",
      taxNo: "NTN-XXXXXXXXX",
    },
  });
  console.log("  • Company:", company.name);

  // -----------------------------------------------------------------
  // Permissions — dynamic catalog (operational + approval + section)
  // -----------------------------------------------------------------
  const permissionByKey = new Map<string, number>();
  for (const p of PERMISSION_CATALOG) {
    const perm = await prisma.permission.upsert({
      where: { key: p.key },
      update: { category: p.category, section: p.section ?? null, description: p.description ?? `${p.module} — ${p.action}` },
      create: { key: p.key, module: p.module, action: p.action, category: p.category, section: p.section ?? null, description: p.description ?? `${p.module} — ${p.action}` },
    });
    permissionByKey.set(p.key, perm.id);
  }
  const allPermissionIds = [...permissionByKey.values()];
  console.log(`  • Permissions: ${allPermissionIds.length}`);

  // -----------------------------------------------------------------
  // Roles — dynamic / admin-managed. NO hardcoded permission sets.
  // Only SUPER_ADMIN is created as the built-in bypass marker; the other
  // legacy role names are kept as EMPTY containers so the generic
  // approval-chain steps can still resolve (they grant NO access —
  // access is controlled by UserProjectPermission grants).
  // -----------------------------------------------------------------
  const roleNames = ["SUPER_ADMIN", "ADMIN", "PROCUREMENT_MANAGER", "STORE_KEEPER", "FINANCE_MANAGER", "ACCOUNTANT", "HR_MANAGER", "HR_EXECUTIVE", "PROJECT_MANAGER", "SITE_ENGINEER", "QA_MANAGER", "HSE_MANAGER", "EMPLOYEE"];
  const roleByName = new Map<string, number>();
  for (const name of roleNames) {
    const role = await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name, description: name === "SUPER_ADMIN" ? "Full system access (bypasses all checks)" : `${name} (dynamic role)`, isSystem: name === "SUPER_ADMIN" },
    });
    roleByName.set(name, role.id);
    // Dynamic model: roles carry NO fixed permissions. Any access is granted
    // per (user, project) via UserProjectPermission.
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
  }
  console.log(`  • Roles: ${roleByName.size} (containers, no fixed permissions)`);

  // -----------------------------------------------------------------
  // Users
  // -----------------------------------------------------------------
  const hash = (p: string) => bcrypt.hash(p, 10);

  async function ensureUser(email: string, name: string, password: string, roleNames: string[]) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return existing;
    const roleIds = roleNames.map((r) => roleByName.get(r)!).filter(Boolean);
    return prisma.user.create({
      data: {
        email,
        password: await hash(password),
        name,
        status: "ACTIVE",
        roles: { create: roleIds.map((roleId) => ({ roleId })) },
      },
    });
  }

  await ensureUser("superadmin@respak.pk", "System Administrator", "Admin@123", ["SUPER_ADMIN"]);
  await ensureUser("admin@respak.pk", "Operations Admin", "Admin@123", ["ADMIN"]);
  await ensureUser("procurement@respak.pk", "Procurement Manager", "Password@123", ["PROCUREMENT_MANAGER"]);
  await ensureUser("store@respak.pk", "Store Keeper", "Password@123", ["STORE_KEEPER"]);
  await ensureUser("finance@respak.pk", "Finance Manager", "Password@123", ["FINANCE_MANAGER"]);
  await ensureUser("accountant@respak.pk", "Accountant", "Password@123", ["ACCOUNTANT"]);
  await ensureUser("hr@respak.pk", "HR Manager", "Password@123", ["HR_MANAGER"]);
  await ensureUser("pm@respak.pk", "Project Manager", "Password@123", ["PROJECT_MANAGER"]);
  await ensureUser("site@respak.pk", "Site Engineer", "Password@123", ["SITE_ENGINEER"]);
  await ensureUser("qa@respak.pk", "QA Manager", "Password@123", ["QA_MANAGER"]);
  await ensureUser("hse@respak.pk", "HSE Manager", "Password@123", ["HSE_MANAGER"]);
  console.log("  • Users created");

  // -----------------------------------------------------------------
  // Demo user grants (dynamic model) — company-wide (projectId null)
  // Users are generic; access is defined by UserProjectPermission.
  // superadmin@ bypasses via SUPER_ADMIN and needs no grants.
  // -----------------------------------------------------------------
  const demoGrants: { email: string; perms: string[]; permsFull?: boolean }[] = [
    { email: "admin@respak.pk", perms: [], permsFull: true },
    { email: "procurement@respak.pk", perms: ["procurement:read", "procurement:create", "procurement:update", "procurement:approve", "vendors:read", "vendors:create", "vendors:update", "inventory:read", "procurement:bills", "vendor:liabilities"] },
    { email: "store@respak.pk", perms: ["inventory:read", "inventory:create", "inventory:update", "inventory:access", "procurement:read"] },
    { email: "finance@respak.pk", perms: ["finance:read", "finance:create", "finance:update", "finance:approve", "finance:payments", "customer:ledger", "vendor:liabilities", "procurement:read", "clients:read", "sites:read"] },
    { email: "accountant@respak.pk", perms: ["finance:read", "finance:create", "finance:update", "customer:ledger"] },
    { email: "hr@respak.pk", perms: ["hr:read", "hr:create", "hr:update", "hr:approve", "hr:leave", "hr:payroll", "hr:attendance", "settings:read"] },
    { email: "pm@respak.pk", perms: ["sites:read", "sites:create", "sites:update", "sites:approve", "clients:read", "procurement:read", "procurement:create", "procurement:approve", "procurement:bills", "vehicles:read", "vehicles:create", "vendors:read", "vendor:liabilities", "inventory:read", "inventory:access", "projects:read", "projects:create", "projects:update", "boq:read", "boq:create", "boq:update", "boq:approve", "boq:analysis", "progress:read", "progress:create", "progress:update", "progress:approve", "budget:read", "budget:create", "cost:read", "cost:create", "cost:expenses", "documents:read", "documents:create", "documents:update", "iso:read", "iso:create", "iso:update", "correspondence:read", "correspondence:create"] },
    { email: "site@respak.pk", perms: ["sites:read", "sites:create", "sites:update", "vehicles:read", "inventory:read", "vendors:read", "projects:read", "boq:read", "progress:read", "progress:create", "progress:update", "documents:read", "documents:create", "iso:read", "iso:create"] },
    { email: "qa@respak.pk", perms: ["documents:read", "documents:create", "documents:update", "documents:approve", "iso:read", "iso:create", "iso:update", "iso:approve", "projects:read"] },
    { email: "hse@respak.pk", perms: ["iso:read", "iso:create", "iso:update", "iso:approve", "documents:read", "documents:create", "projects:read", "hr:read"] },
  ];

  let grantCount = 0;
  for (const g of demoGrants) {
    const user = await prisma.user.findUnique({ where: { email: g.email } });
    if (!user) continue;
    const keys = g.permsFull ? PERMISSION_CATALOG.map((p) => p.key) : g.perms;
    const data = keys
      .map((key) => permissionByKey.get(key))
      .filter((pid): pid is number => !!pid)
      .map((permissionId) => ({ userId: user.id, projectId: null as number | null, permissionId }));
    if (data.length) {
      await prisma.userProjectPermission.createMany({ data, skipDuplicates: true });
      grantCount += data.length;
    }
  }
  console.log(`  • User permission grants (company-wide): ${grantCount}`);

  // -----------------------------------------------------------------
  // Auto Reference Numbering configs
  // -----------------------------------------------------------------
  const REF_CONFIGS = [
    { docType: "LETTER_IN", prefix: "LI", includeProjectCode: true, includeYear: true, padLength: 4 },
    { docType: "LETTER_OUT", prefix: "LO", includeProjectCode: true, includeYear: true, padLength: 4 },
    { docType: "INTERNAL_MEMO", prefix: "IM", includeProjectCode: true, includeYear: true, padLength: 4 },
    { docType: "PURCHASE_ORDER", prefix: "PO", includeProjectCode: true, includeYear: true, padLength: 4 },
    { docType: "MATERIAL_REQUEST", prefix: "MR", includeProjectCode: true, includeYear: true, padLength: 4 },
    { docType: "GRN", prefix: "GRN", includeProjectCode: false, includeYear: true, padLength: 4 },
    { docType: "IPC", prefix: "IPC", includeProjectCode: true, includeYear: true, padLength: 3 },
    { docType: "VARIATION_ORDER", prefix: "VO", includeProjectCode: true, includeYear: true, padLength: 4 },
    { docType: "NCR", prefix: "NCR", includeProjectCode: true, includeYear: true, padLength: 4 },
    { docType: "BOQ", prefix: "BOQ", includeProjectCode: true, includeYear: false, padLength: 3 },
    { docType: "STOCK_ADJUSTMENT", prefix: "ADJ", includeProjectCode: false, includeYear: true, padLength: 4 },
    { docType: "STOCK_TRANSFER", prefix: "TRF", includeProjectCode: false, includeYear: true, padLength: 4 },
  ];
  for (const cfg of REF_CONFIGS) {
    await prisma.numberingConfig.upsert({
      where: { docType: cfg.docType },
      update: {},
      create: { ...cfg, separator: "/", startSerial: 1, isActive: true },
    });
  }
  console.log(`  • Numbering configs: ${REF_CONFIGS.length}`);

  // -----------------------------------------------------------------
  // Reference: Departments & Designations
  // -----------------------------------------------------------------
  const deptNames = ["Site Operations", "Procurement", "Finance", "HR & Admin", "Transport"];
  const deptById = new Map<string, number>();
  for (const name of deptNames) {
    const d = await prisma.department.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    deptById.set(name, d.id);
  }

  const desigNames = ["Director", "Project Manager", "Site Engineer", "Store Keeper", "Accountant", "HR Manager", "Driver", "Lab Technician"];
  for (const name of desigNames) {
    await prisma.designation.upsert({ where: { name }, update: {}, create: { name } });
  }

  // -----------------------------------------------------------------
  // Inventory reference data
  // -----------------------------------------------------------------
  const categories = [
    { name: "Cement & Binders", description: "Cement, lime, binders" },
    { name: "Steel & Metals", description: "Rebar, sections" },
    { name: "Aggregates", description: "Sand, crush, gravel" },
    { name: "Electrical", description: "Cables, switches, fittings" },
    { name: "Plumbing", description: "Pipes, fittings, sanitary" },
    { name: "General", description: "Miscellaneous site supplies" },
  ];
  const catByName = new Map<string, number>();
  for (const c of categories) {
    const cat = await prisma.itemCategory.upsert({ where: { name: c.name }, update: {}, create: c });
    catByName.set(c.name, cat.id);
  }

  const items = [
    { code: "CEM-OPC-50", name: "Cement OPC 50kg", cat: "Cement & Binders", unit: "BAG", reorder: 100, opening: 250 },
    { code: "STL-RBR-12", name: "Rebar Grade 60 (12mm)", cat: "Steel & Metals", unit: "TON", reorder: 5, opening: 12 },
    { code: "AGG-SND", name: "River Sand", cat: "Aggregates", unit: "CUBIC", reorder: 50, opening: 80 },
    { code: "ELC-CBL", name: "Cable 2.5mm", cat: "Electrical", unit: "COIL", reorder: 10, opening: 0 },
    { code: "PLB-PVC", name: "PVC Pipe 4in", cat: "Plumbing", unit: "FT", reorder: 200, opening: 0 },
  ];
  const itemIds: number[] = [];
  for (const i of items) {
    const item = await prisma.item.upsert({
      where: { code: i.code },
      update: {},
      create: {
        code: i.code,
        name: i.name,
        categoryId: catByName.get(i.cat),
        unit: i.unit,
        reorderLevel: i.reorder,
        openingStock: i.opening,
      },
    });
    itemIds.push(item.id);
  }
  console.log(`  • Items: ${items.length}`);

  // Warehouses
  const mainStore = await prisma.warehouse.upsert({
    where: { code: "WH-MAIN" },
    update: {},
    create: { code: "WH-MAIN", name: "Main Store", location: "Head Office" },
  });
  await prisma.warehouse.upsert({
    where: { code: "WH-SITE" },
    update: {},
    create: { code: "WH-SITE", name: "Site Store", location: "Project Site" },
  });

  // Opening stock levels
  for (const item of items) {
    const rec = await prisma.item.findUnique({ where: { code: item.code } });
    if (!rec) continue;
    const existing = await prisma.stockLevel.findUnique({
      where: { itemId_warehouseId: { itemId: rec.id, warehouseId: mainStore.id } },
    });
    if (!existing && item.opening > 0) {
      await prisma.stockLevel.create({
        data: { itemId: rec.id, warehouseId: mainStore.id, quantity: item.opening },
      });
    }
  }

  // -----------------------------------------------------------------
  // Vendors
  // -----------------------------------------------------------------
  const vendors = [
    { code: "VND-001", name: "Ali Building Materials", type: "SUPPLIER" as const, city: "Lahore", contactPerson: "Ali Raza", phone: "0300-1234567" },
    { code: "VND-002", name: "SteelCorp Traders", type: "SUPPLIER" as const, city: "Karachi", contactPerson: "Imran Khan", phone: "0321-7654321" },
    { code: "VND-003", name: "Cement Distributors", type: "SUPPLIER" as const, city: "Faisalabad", contactPerson: "Sana Tariq", phone: "0333-5551234" },
    { code: "VND-004", name: "Shahid Electricals", type: "SERVICE_PROVIDER" as const, city: "Lahore", contactPerson: "Shahid Mahmood", phone: "0345-1112223" },
  ];
  for (const v of vendors) {
    await prisma.vendor.upsert({
      where: { code: v.code },
      update: {},
      create: { ...v, status: "ACTIVE" },
    });
  }
  console.log(`  • Vendors: ${vendors.length}`);

  // -----------------------------------------------------------------
  // Clients, Projects
  // -----------------------------------------------------------------
  const client = await prisma.client.upsert({
    where: { code: "CLI-001" },
    update: {},
    create: {
      code: "CLI-001",
      name: "ABC Developers (Pvt) Ltd.",
      type: "CORPORATE",
      contactPerson: "Mr. Kamran",
      phone: "0301-9998877",
      city: "Lahore",
      status: "ACTIVE",
    },
  });

  await prisma.client.upsert({
    where: { code: "CLI-002" },
    update: {},
    create: {
      code: "CLI-002",
      name: "Government Housing Authority",
      type: "GOVERNMENT",
      contactPerson: "DG Housing",
      phone: "042-35700000",
      city: "Islamabad",
      status: "ACTIVE",
    },
  });

  const projects = [
    {
      code: "PRJ-001",
      name: "Tower Residency Phase 2",
      category: "CONSTRUCTION" as const,
      clientId: client.id,
      location: "DHA Lahore",
      budget: 250000000,
      startDate: new Date("2026-01-15"),
      endDate: new Date("2027-12-31"),
      description: "12-story residential tower — structural & finishing works.",
    },
    {
      code: "PRJ-002",
      name: "Gulberg Heights (Real Estate)",
      category: "REAL_ESTATE" as const,
      clientId: client.id,
      location: "Gulberg III, Lahore",
      budget: 180000000,
      startDate: new Date("2026-03-01"),
      endDate: new Date("2027-06-30"),
      description: "Real estate development — apartments & commercial plaza.",
    },
    {
      code: "PRJ-003",
      name: "Supply Works — National Grid",
      category: "SUPPLY_WORKS" as const,
      clientId: client.id,
      location: "Multiple sites",
      budget: 60000000,
      startDate: new Date("2026-05-10"),
      endDate: new Date("2026-12-31"),
      description: "Supply of transformers & cable drums to grid stations.",
    },
    {
      code: "PRJ-004",
      name: "Solarization — Factory Rooftop",
      category: "SOLARIZATION" as const,
      clientId: client.id,
      location: "Sheikhupura Industrial Estate",
      budget: 95000000,
      startDate: new Date("2026-07-01"),
      endDate: new Date("2026-11-30"),
      description: "1.2 MW rooftop solar PV with net-metering.",
    },
  ];
  const projectIds: number[] = [];
  for (const p of projects) {
    const rec = await prisma.project.upsert({
      where: { code: p.code },
      update: { category: p.category },
      create: { ...p, status: "ACTIVE" as const },
    });
    projectIds.push(rec.id);
  }
  console.log(`  • Projects seeded: ${projects.length}`);

  // -----------------------------------------------------------------
  // Chart of Accounts
  // -----------------------------------------------------------------
  const ACCOUNTS: { code: string; name: string; type: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE" }[] = [
    { code: "1000", name: "Cash on Hand", type: "ASSET" },
    { code: "1100", name: "Bank Accounts", type: "ASSET" },
    { code: "1200", name: "Accounts Receivable", type: "ASSET" },
    { code: "1300", name: "Materials & Stores", type: "ASSET" },
    { code: "2000", name: "Accounts Payable", type: "LIABILITY" },
    { code: "2100", name: "VAT / Withholding Payable", type: "LIABILITY" },
    { code: "3000", name: "Owner's Equity", type: "EQUITY" },
    { code: "4000", name: "Project Revenue", type: "REVENUE" },
    { code: "5000", name: "Material Cost", type: "EXPENSE" },
    { code: "5100", name: "Labor Cost", type: "EXPENSE" },
    { code: "5200", name: "Equipment Cost", type: "EXPENSE" },
    { code: "5300", name: "Subcontract Cost", type: "EXPENSE" },
    { code: "6000", name: "Admin & Overheads", type: "EXPENSE" },
  ];
  for (const a of ACCOUNTS) {
    await prisma.account.upsert({
      where: { code: a.code },
      update: {},
      create: { ...a, isActive: true },
    });
  }
  console.log(`  • Chart of accounts: ${ACCOUNTS.length}`);

  // -----------------------------------------------------------------
  // Employees
  // -----------------------------------------------------------------
  const employees = [
    { empCode: "EMP-001", firstName: "Waqar", lastName: "Ahmed", dept: "Site Operations", desig: "Project Manager", basic: 250000, allow: 50000 },
    { empCode: "EMP-002", firstName: "Bilal", lastName: "Hussain", dept: "Site Operations", desig: "Site Engineer", basic: 120000, allow: 20000 },
    { empCode: "EMP-003", firstName: "Rashid", lastName: "Mehmood", dept: "Procurement", desig: "Store Keeper", basic: 60000, allow: 10000 },
    { empCode: "EMP-004", firstName: "Ayesha", lastName: "Khan", dept: "Finance", desig: "Accountant", basic: 90000, allow: 15000 },
    { empCode: "EMP-005", firstName: "Noman", lastName: "Ali", dept: "Transport", desig: "Driver", basic: 40000, allow: 5000 },
  ];
  for (const e of employees) {
    const existing = await prisma.employee.findUnique({ where: { empCode: e.empCode } });
    if (existing) continue;
    const department = await prisma.department.findUnique({ where: { name: e.dept } });
    const designation = await prisma.designation.findUnique({ where: { name: e.desig } });
    await prisma.employee.create({
      data: {
        empCode: e.empCode,
        firstName: e.firstName,
        lastName: e.lastName,
        departmentId: department?.id ?? null,
        designationId: designation?.id ?? null,
        joiningDate: new Date("2024-01-01"),
        basicSalary: e.basic,
        allowances: e.allow,
        status: "ACTIVE",
      },
    });
  }
  console.log(`  • Employees: ${employees.length}`);

  // -----------------------------------------------------------------
  // HR: default leave types + balances (respakHRM integration)
  // -----------------------------------------------------------------
  const defaultLeaveTypes = [
    { code: "annual", name: "Annual Leave", defaultTotal: 24, isPaid: true, sortOrder: 1 },
    { code: "sick", name: "Sick Leave", defaultTotal: 12, isPaid: true, sortOrder: 2 },
    { code: "casual", name: "Casual Leave", defaultTotal: 10, isPaid: true, sortOrder: 3 },
    { code: "special", name: "Special Leave", defaultTotal: 5, isPaid: true, sortOrder: 4 },
    { code: "emergency", name: "Emergency Leave", defaultTotal: 5, isPaid: true, sortOrder: 5 },
    { code: "unpaid", name: "Unpaid Leave", defaultTotal: 0, isPaid: false, sortOrder: 6 },
  ];
  const leaveTypeIds: number[] = [];
  const leaveTypeTotalById = new Map<number, number>();
  for (const lt of defaultLeaveTypes) {
    const rec = await prisma.leaveTypeConfig.upsert({
      where: { code: lt.code },
      update: {},
      create: {
        code: lt.code,
        name: lt.name,
        defaultTotal: lt.defaultTotal,
        isPaid: lt.isPaid,
        color: lt.code === "unpaid" ? "secondary" : "info",
        sortOrder: lt.sortOrder,
        isActive: true,
      },
    });
    leaveTypeIds.push(rec.id);
    leaveTypeTotalById.set(rec.id, lt.defaultTotal);
  }
  // Back-fill a balance row for every employee for every active leave type
  const allEmps = await prisma.employee.findMany({ select: { id: true } });
  for (const e of allEmps) {
    for (const ltId of leaveTypeIds) {
      await prisma.leaveBalance.upsert({
        where: { employeeId_leaveTypeConfigId: { employeeId: e.id, leaveTypeConfigId: ltId } },
        update: {},
        create: { employeeId: e.id, leaveTypeConfigId: ltId, total: leaveTypeTotalById.get(ltId) ?? 0, used: 0 },
      });
    }
  }
  console.log(`  • Leave types: ${defaultLeaveTypes.length} (+ balances for ${allEmps.length} employees)`);

  // -----------------------------------------------------------------
  // HR: demo projects/sites (respakHRM integration)
  // -----------------------------------------------------------------
  const hrProjects = [
    {
      code: "PRJ0001",
      name: "Head Office",
      projectType: "head_office" as const,
      status: "active" as const,
      startDate: new Date("2024-01-01"),
      locationAddress: "Main Boulevard, Gulberg III",
      locationCity: "Lahore",
      locationProvince: "Punjab",
      locationLat: 31.5204,
      locationLng: 74.3587,
      shiftType: "morning" as const,
      shiftStart: "09:00",
      shiftEnd: "18:00",
      allowedRadius: 150,
      isApprovedSite: true,
    },
    {
      code: "PRJ0002",
      name: "Tower Residency Site",
      projectType: "site" as const,
      status: "active" as const,
      startDate: new Date("2026-01-15"),
      locationAddress: "Phase 2, DHA",
      locationCity: "Lahore",
      locationProvince: "Punjab",
      locationLat: 31.4709,
      locationLng: 74.4122,
      shiftType: "morning" as const,
      shiftStart: "08:00",
      shiftEnd: "17:00",
      allowedRadius: 200,
      isApprovedSite: true,
    },
  ];
  const hrProjectIds: number[] = [];
  for (const p of hrProjects) {
    const rec = await prisma.hrProject.upsert({
      where: { code: p.code },
      update: {},
      create: p,
    });
    hrProjectIds.push(rec.id);
  }
  // Assign first two employees to the site project as a demo
  const siteProjectId = hrProjectIds[1];
  if (siteProjectId) {
    const emp1 = await prisma.employee.findUnique({ where: { empCode: "EMP-001" } });
    const emp2 = await prisma.employee.findUnique({ where: { empCode: "EMP-002" } });
    if (emp1) {
      await prisma.employeeAssignment.upsert({
        where: { employeeId_projectId: { employeeId: emp1.id, projectId: siteProjectId } },
        update: { isActive: true, endDate: null },
        create: { employeeId: emp1.id, projectId: siteProjectId, role: "Project Manager", isActive: true },
      });
      await prisma.employee.update({ where: { id: emp1.id }, data: { currentProjectId: siteProjectId } });
      await prisma.hrProject.update({ where: { id: siteProjectId }, data: { projectManagerId: emp1.id } });
    }
    if (emp2) {
      await prisma.employeeAssignment.upsert({
        where: { employeeId_projectId: { employeeId: emp2.id, projectId: siteProjectId } },
        update: { isActive: true, endDate: null },
        create: { employeeId: emp2.id, projectId: siteProjectId, role: "Site Engineer", isActive: true },
      });
      await prisma.employee.update({ where: { id: emp2.id }, data: { currentProjectId: siteProjectId } });
    }
  }
  console.log(`  • HR projects: ${hrProjects.length}`);

  // -----------------------------------------------------------------
  // Vehicles
  // -----------------------------------------------------------------
  const vehicles = [
    { regNo: "LEA-1234", type: "PICKUP" as const, brand: "Toyota", model: "Hilux", fuelType: "DIESEL" as const, currentKm: 45230 },
    { regNo: "LEC-5678", type: "TRUCK" as const, brand: "Hino", model: "500", fuelType: "DIESEL" as const, currentKm: 132900 },
    { regNo: "LEB-9012", type: "CAR" as const, brand: "Suzuki", model: "Swift", fuelType: "PETROL" as const, currentKm: 22100 },
  ];
  for (const v of vehicles) {
    await prisma.vehicle.upsert({
      where: { regNo: v.regNo },
      update: {},
      create: { ...v, status: "ACTIVE" },
    });
  }
  console.log(`  • Vehicles: ${vehicles.length}`);

  // -----------------------------------------------------------------
  // Chart of Accounts
  // -----------------------------------------------------------------
  const accounts = [
    { code: "1000", name: "Cash & Bank", type: "ASSET" as const },
    { code: "1010", name: "Cash on Hand", type: "ASSET" as const },
    { code: "1020", name: "Bank Account — MCB", type: "ASSET" as const },
    { code: "1100", name: "Accounts Receivable", type: "ASSET" as const },
    { code: "1200", name: "Inventory", type: "ASSET" as const },
    { code: "2000", name: "Accounts Payable", type: "LIABILITY" as const },
    { code: "2100", name: "Sales Tax Payable", type: "LIABILITY" as const },
    { code: "3000", name: "Owner's Equity", type: "EQUITY" as const },
    { code: "4000", name: "Contract Revenue", type: "REVENUE" as const },
    { code: "5000", name: "Cost of Materials", type: "EXPENSE" as const },
    { code: "5100", name: "Labour Cost", type: "EXPENSE" as const },
    { code: "5200", name: "Equipment Cost", type: "EXPENSE" as const },
    { code: "5300", name: "Admin & Overhead", type: "EXPENSE" as const },
  ];
  for (const a of accounts) {
    await prisma.account.upsert({
      where: { code: a.code },
      update: {},
      create: { code: a.code, name: a.name, type: a.type, isActive: true },
    });
  }
  console.log(`  • Accounts: ${accounts.length}`);

  // -----------------------------------------------------------------
  // Approval Chains
  // -----------------------------------------------------------------
  async function ensureChain(params: {
    name: string;
    module: string;
    entityType: string;
    description?: string;
    roles: string[];
  }) {
    const existing = await prisma.approvalChain.findFirst({
      where: { entityType: params.entityType, name: params.name },
    });
    if (existing) return existing;
    const roleIds = params.roles.map((r) => roleByName.get(r)!).filter(Boolean);
    return prisma.approvalChain.create({
      data: {
        name: params.name,
        module: params.module,
        entityType: params.entityType,
        description: params.description,
        isActive: true,
        steps: {
          create: params.roles.map((_, i) => ({ stepOrder: i + 1, roleId: roleIds[i] ?? null, userId: null })),
        },
      },
    });
  }

  await ensureChain({
    name: "PR Approval (PM → Procurement)",
    module: "procurement",
    entityType: "PURCHASE_REQUISITION",
    description: "Project Manager then Procurement Manager",
    roles: ["PROJECT_MANAGER", "PROCUREMENT_MANAGER"],
  });
  await ensureChain({
    name: "PO Approval (Procurement → Finance)",
    module: "procurement",
    entityType: "PURCHASE_ORDER",
    description: "Procurement Manager then Finance Manager",
    roles: ["PROCUREMENT_MANAGER", "FINANCE_MANAGER"],
  });
  await ensureChain({
    name: "Check Request (PM → Finance)",
    module: "sites",
    entityType: "CHECK_REQUEST",
    description: "Project Manager then Finance Manager",
    roles: ["PROJECT_MANAGER", "FINANCE_MANAGER"],
  });
  await ensureChain({
    name: "Leave (PM → HR)",
    module: "hr",
    entityType: "LEAVE_REQUEST",
    description: "Project Manager then HR Manager",
    roles: ["PROJECT_MANAGER", "HR_MANAGER"],
  });
  await ensureChain({
    name: "Journal Entry (Finance Manager)",
    module: "finance",
    entityType: "JOURNAL_ENTRY",
    description: "Single step — Finance Manager",
    roles: ["FINANCE_MANAGER"],
  });
  await ensureChain({
    name: "Payroll (HR → Finance)",
    module: "hr",
    entityType: "PAYROLL_RUN",
    description: "HR Manager then Finance Manager",
    roles: ["HR_MANAGER", "FINANCE_MANAGER"],
  });
  await ensureChain({
    name: "Client Invoice (Finance Manager)",
    module: "finance",
    entityType: "CLIENT_INVOICE",
    description: "Single step — Finance Manager",
    roles: ["FINANCE_MANAGER"],
  });
  await ensureChain({
    name: "Payment (Finance → Admin)",
    module: "finance",
    entityType: "PAYMENT",
    description: "Finance Manager then Admin",
    roles: ["FINANCE_MANAGER", "ADMIN"],
  });
  await ensureChain({
    name: "DPR (Project Manager)",
    module: "sites",
    entityType: "DPR",
    description: "Single step — Project Manager",
    roles: ["PROJECT_MANAGER"],
  });
  await ensureChain({
    name: "Submittal (Project Manager)",
    module: "sites",
    entityType: "SUBMITTAL",
    description: "Single step — Project Manager",
    roles: ["PROJECT_MANAGER"],
  });
  await ensureChain({
    name: "Material Request (PM → Procurement)",
    module: "procurement",
    entityType: "MATERIAL_REQUEST",
    description: "Project Manager then Procurement Manager",
    roles: ["PROJECT_MANAGER", "PROCUREMENT_MANAGER"],
  });
  await ensureChain({
    name: "NCR Review (QA → PM)",
    module: "iso",
    entityType: "NCR",
    description: "Quality Assurance then Project Manager",
    roles: ["QA_MANAGER", "PROJECT_MANAGER"],
  });
  await ensureChain({
    name: "Safety Incident Investigation (HSE → PM)",
    module: "iso",
    entityType: "SAFETY_INCIDENT",
    description: "HSE Manager then Project Manager",
    roles: ["HSE_MANAGER", "PROJECT_MANAGER"],
  });
  await ensureChain({
    name: "Variation Order (PM → Finance → Admin)",
    module: "cost",
    entityType: "VARIATION_ORDER",
    description: "Project Manager then Finance Manager then Admin",
    roles: ["PROJECT_MANAGER", "FINANCE_MANAGER", "ADMIN"],
  });
  await ensureChain({
    name: "IPC (PM → Finance → Admin)",
    module: "cost",
    entityType: "IPC",
    description: "Project Manager then Finance Manager then Admin",
    roles: ["PROJECT_MANAGER", "FINANCE_MANAGER", "ADMIN"],
  });
  console.log("  • Approval chains seeded");

  // -----------------------------------------------------------------
  // Demo activities & S-curve progress (PRJ-001)
  // -----------------------------------------------------------------
  {
    const prjId = projectIds[0];
    if (prjId) {
      const actDefs = [
        { wbsCode: "1", name: "Site Mobilization", unit: "LS", totalQty: 1 },
        { wbsCode: "1.1", name: "Earthwork & Excavation", unit: "CUBIC", totalQty: 8000 },
        { wbsCode: "1.2", name: "Foundation Concrete", unit: "CUBIC", totalQty: 1200 },
        { wbsCode: "1.3", name: "Structural Works (RCC)", unit: "CUBIC", totalQty: 4500 },
        { wbsCode: "2", name: "MEP Works", unit: "LS", totalQty: 1 },
      ];
      const actIds: number[] = [];
      for (const d of actDefs) {
        const existing = await prisma.activity.findFirst({ where: { projectId: prjId, wbsCode: d.wbsCode } });
        if (existing) {
          actIds.push(existing.id);
          continue;
        }
        const a = await prisma.activity.create({
          data: {
            projectId: prjId,
            wbsCode: d.wbsCode,
            name: d.name,
            unit: d.unit,
            totalQty: d.totalQty,
            status: "IN_PROGRESS",
            startDate: new Date("2026-01-15"),
            endDate: new Date("2027-06-30"),
          },
        });
        actIds.push(a.id);
      }

      const points = [
        { date: "2026-02-28", planned: 8, actual: 6 },
        { date: "2026-03-31", planned: 18, actual: 15 },
        { date: "2026-04-30", planned: 30, actual: 26 },
        { date: "2026-05-31", planned: 45, actual: 40 },
      ];
      for (const p of points) {
        const date = new Date(p.date);
        const existingPoint = await prisma.projectProgress.findUnique({
          where: { projectId_reportDate: { projectId: prjId, reportDate: date } },
        });
        if (existingPoint) continue;
        await prisma.projectProgress.create({
          data: { projectId: prjId, reportDate: date, plannedPercent: p.planned, actualPercent: p.actual },
        });
      }
      console.log(`  • Demo activities & S-curve seeded (${actDefs.length} activities, ${points.length} points)`);
    }
  }

  // -----------------------------------------------------------------
  // Demo budgeting & cost control (PRJ-001)
  // -----------------------------------------------------------------
  // Keep the auto-numbering counters in sync with hardcoded demo
  // numbers, so the next generated ref number doesn't collide.
  async function bumpCounter(docType: string, projectCode: string, year: number, serial: number) {
    const config = await prisma.numberingConfig.findUnique({ where: { docType } });
    if (!config) return;
    const existing = await prisma.numberingCounter.findUnique({
      where: { configId_projectCode_year: { configId: config.id, projectCode, year } },
    });
    if (existing) {
      await prisma.numberingCounter.update({
        where: { id: existing.id },
        data: { lastSerial: Math.max(existing.lastSerial, serial) },
      });
    } else {
      await prisma.numberingCounter.create({
        data: { configId: config.id, projectCode, year, lastSerial: serial },
      });
    }
  }

  // -----------------------------------------------------------------
  // Demo inventory movements (stock adjustment + transfer)
  // -----------------------------------------------------------------
  {
    const mainStore = await prisma.warehouse.findUnique({ where: { code: "WH-MAIN" } });
    const siteStore = await prisma.warehouse.findUnique({ where: { code: "WH-SITE" } });
    const cement = await prisma.item.findUnique({ where: { code: "CEM-OPC-50" } });
    const rebar = await prisma.item.findUnique({ where: { code: "STL-RBR-12" } });
    if (mainStore && siteStore && cement && rebar) {
      // Demo adjustment: 5 bags damaged in transit
      const existingAdj = await prisma.stockTransaction.findFirst({
        where: { refType: "ADJUSTMENT", notes: "Damaged bags removed (demo)" },
      });
      if (!existingAdj) {
        await prisma.$transaction(async (tx) => {
          await tx.stockTransaction.create({
            data: {
              transactionNo: "ADJ/GEN/2026/0001",
              itemId: cement.id,
              warehouseId: mainStore.id,
              type: "ISSUE",
              quantity: 5,
              refType: "ADJUSTMENT",
              notes: "Damaged bags removed (demo)",
            },
          });
          const level = await tx.stockLevel.findUnique({
            where: { itemId_warehouseId: { itemId: cement.id, warehouseId: mainStore.id } },
          });
          if (level) {
            await tx.stockLevel.update({
              where: { id: level.id },
              data: { quantity: Math.max(0, level.quantity.toNumber() - 5) },
            });
          }
        });
      }

      // Demo transfer: 40 bags of cement moved to the site store
      const existingTrf = await prisma.stockTransaction.findFirst({
        where: { refType: "STOCK_TRANSFER", notes: "Site consumption (demo)" },
      });
      if (!existingTrf) {
        await prisma.$transaction(async (tx) => {
          const from = await tx.stockLevel.findUnique({
            where: { itemId_warehouseId: { itemId: cement.id, warehouseId: mainStore.id } },
          });
          const to = await tx.stockLevel.findUnique({
            where: { itemId_warehouseId: { itemId: cement.id, warehouseId: siteStore.id } },
          });
          await tx.stockTransaction.create({
            data: {
              transactionNo: "TRF/GEN/2026/0001-1-OUT",
              itemId: cement.id,
              warehouseId: mainStore.id,
              type: "TRANSFER_OUT",
              quantity: 40,
              refType: "STOCK_TRANSFER",
              notes: "Site consumption (demo)",
            },
          });
          await tx.stockTransaction.create({
            data: {
              transactionNo: "TRF/GEN/2026/0001-1-IN",
              itemId: cement.id,
              warehouseId: siteStore.id,
              type: "TRANSFER_IN",
              quantity: 40,
              refType: "STOCK_TRANSFER",
              notes: "Site consumption (demo)",
            },
          });
          if (from) {
            await tx.stockLevel.update({
              where: { id: from.id },
              data: { quantity: Math.max(0, from.quantity.toNumber() - 40) },
            });
          }
          if (to) {
            await tx.stockLevel.update({
              where: { id: to.id },
              data: { quantity: to.quantity.toNumber() + 40 },
            });
          } else {
            await tx.stockLevel.create({
              data: { itemId: cement.id, warehouseId: siteStore.id, quantity: 40 },
            });
          }
        });
      }
    }
    // Always keep the counters in sync with the hardcoded demo numbers.
    await bumpCounter("STOCK_ADJUSTMENT", "GEN", 2026, 1);
    await bumpCounter("STOCK_TRANSFER", "GEN", 2026, 1);
    console.log("  • Demo inventory movements seeded");
  }

  {
    const prjId = projectIds[0];
    if (prjId) {
      // Cost centers
      const centerDefs = [
        { code: "CC-100", name: "Earthworks", projectId: prjId },
        { code: "CC-200", name: "Concrete & Structures", projectId: prjId },
        { code: "CC-300", name: "MEP", projectId: prjId },
        { code: "CC-900", name: "Site Overheads", projectId: prjId },
      ];
      for (const c of centerDefs) {
        await prisma.costCenter.upsert({
          where: { code: c.code },
          update: {},
          create: { code: c.code, name: c.name, projectId: c.projectId },
        });
      }

      // Budget (idempotent by name+project)
      const budget = await prisma.budget.findFirst({ where: { projectId: prjId, name: "Tower Residency Phase 2 — Main Budget" } });
      if (!budget) {
        const b = await prisma.budget.create({
          data: {
            projectId: prjId,
            name: "Tower Residency Phase 2 — Main Budget",
            period: "FY2026-27",
            status: "APPROVED",
            totalAmount: 0,
          },
        });
        const lineDefs = [
          { costType: "MATERIAL", amount: 180_000_000 },
          { costType: "LABOR", amount: 90_000_000 },
          { costType: "EQUIPMENT", amount: 35_000_000 },
          { costType: "OVERHEAD", amount: 25_000_000 },
        ];
        for (const l of lineDefs) {
          await prisma.budgetLine.create({
            data: { budgetId: b.id, costType: l.costType as "MATERIAL", amount: l.amount },
          });
        }
        const total = lineDefs.reduce((s, l) => s + l.amount, 0);
        await prisma.budget.update({ where: { id: b.id }, data: { totalAmount: total } });
      }

      // Cost ledger entries (idempotent by description+date)
      const costDefs = [
        { date: "2026-03-05", costType: "MATERIAL", description: "Cement OPC 500 bags", amount: 2_400_000, center: "CC-200" },
        { date: "2026-03-12", costType: "EQUIPMENT", description: "Excavator rental — 120 hrs", amount: 1_560_000, center: "CC-100" },
        { date: "2026-04-02", costType: "LABOR", description: "Site labor — March payroll", amount: 3_200_000, center: "CC-100" },
        { date: "2026-04-15", costType: "MATERIAL", description: "Steel rebars 60 tons", amount: 9_600_000, center: "CC-200" },
        { date: "2026-05-08", costType: "OVERHEAD", description: "Site office & utilities", amount: 850_000, center: "CC-900" },
      ];
      for (const d of costDefs) {
        const existing = await prisma.costLog.findFirst({ where: { projectId: prjId, description: d.description, date: new Date(d.date) } });
        if (existing) continue;
        const center = await prisma.costCenter.findFirst({ where: { code: d.center } });
        await prisma.costLog.create({
          data: {
            projectId: prjId,
            costCenterId: center?.id ?? null,
            date: new Date(d.date),
            costType: d.costType as "MATERIAL",
            description: d.description,
            amount: d.amount,
          },
        });
      }

      // A variation order (with fixed voNo so it's idempotent)
      await prisma.variationOrder.upsert({
        where: { voNo: "VO/PRJ-001/2026/0001" },
        update: {},
        create: {
          voNo: "VO/PRJ-001/2026/0001",
          projectId: prjId,
          title: "Extra excavation — rock removal",
          description: "Unexpected rock strata in Block A basement excavation.",
          amount: 4_750_000,
          status: "APPROVED",
        },
      });

      // A certified IPC
      await prisma.iPC.upsert({
        where: { ipcNo: "IPC/PRJ-001/2026/001" },
        update: {},
        create: {
          ipcNo: "IPC/PRJ-001/2026/001",
          projectId: prjId,
          period: "IPC-01 / May 2026",
          fromDate: new Date("2026-01-01"),
          toDate: new Date("2026-05-31"),
          grossValue: 47_500_000,
          retention: 2_375_000,
          deductions: 0,
          netValue: 45_125_000,
          status: "CERTIFIED",
        },
      });

      // Keep the auto-numbering counters in sync with the hardcoded demo
      // numbers above, so the next generated VO/IPC doesn't collide.
      await bumpCounter("VARIATION_ORDER", "PRJ-001", 2026, 1);
      await bumpCounter("IPC", "PRJ-001", 2026, 1);

      console.log("  • Demo budget & cost control seeded");
    }
  }

  // -----------------------------------------------------------------
  // Demo materials (MR + issue) for PRJ-001
  // -----------------------------------------------------------------
  {
    const prjId = projectIds[0];
    if (prjId) {
      const cement = await prisma.item.findFirst({ where: { code: "CEM-OPC-50" } });
      const steel = await prisma.item.findFirst({ where: { code: "STL-RBR-12" } });
      const itemFallback = await prisma.item.findFirst({ orderBy: { id: "asc" } });

      const mr = await prisma.materialRequest.findFirst({
        where: { projectId: prjId, mrNo: "MR/PRJ-001/2026/0001" },
      });
      if (!mr) {
        const req = await prisma.materialRequest.create({
          data: {
            mrNo: "MR/PRJ-001/2026/0001",
            projectId: prjId,
            requiredDate: new Date("2026-09-10"),
            notes: "Basement casting week 37 — priority.",
            status: "APPROVED",
            items: {
              create: [
                { itemId: cement?.id ?? itemFallback?.id ?? null, description: "Cement OPC 50kg bags", quantity: 1200, unit: "bags", issuedQty: 800 },
                { itemId: steel?.id ?? itemFallback?.id ?? null, description: "Steel rebars Grade 60", quantity: 45, unit: "tons", issuedQty: 20 },
              ],
            },
          },
        });

        // One issue against the MR (partial)
        const wh = await prisma.warehouse.findFirst({ orderBy: { id: "asc" } });
        await prisma.materialIssue.create({
          data: {
            issueNo: "MI/PRJ-001/2026/0001",
            projectId: prjId,
            requestId: req.id,
            warehouseId: wh?.id ?? null,
            notes: "Partial release for foundation works.",
            items: {
              create: [
                { itemId: cement?.id ?? itemFallback?.id ?? null, quantity: 800 },
                { itemId: steel?.id ?? itemFallback?.id ?? null, quantity: 20 },
              ],
            },
          },
        });
      }

      // Keep the MATERIAL_REQUEST counter in sync regardless of whether the
      // demo MR was just created or already existed from an earlier seed run.
      await bumpCounter("MATERIAL_REQUEST", "PRJ-001", 2026, 1);

      console.log("  • Demo materials (MR + issue) seeded");
    }
  }

  // -----------------------------------------------------------------
  // Demo document control (categories + documents + versions)
  // -----------------------------------------------------------------
  {
    const catDefs = [
      { code: "POL", name: "Policies", type: "POLICY", module: "QUALITY" },
      { code: "PRC", name: "Procedures", type: "PROCEDURE", module: "QUALITY" },
      { code: "SOP", name: "Standard Operating Procedures", type: "SOP", module: "QUALITY" },
      { code: "FRM", name: "Forms & Records", type: "FORM", module: "GENERAL" },
      { code: "ENV", name: "Environmental Management", type: "MANUAL", module: "ENVIRONMENT" },
      { code: "HSE", name: "Health & Safety", type: "MANUAL", module: "SAFETY" },
    ];
    for (const c of catDefs) {
      await prisma.documentCategory.upsert({
        where: { code: c.code },
        update: {},
        create: { code: c.code, name: c.name, type: c.type, module: c.module },
      });
    }
    const catByCode = new Map<string, number>();
    for (const c of catDefs) {
      const rec = await prisma.documentCategory.findUnique({ where: { code: c.code } });
      if (rec) catByCode.set(c.code, rec.id);
    }

    const docDefs = [
      {
        docCode: "RES/QMS/POL/001",
        title: "Quality Policy",
        cat: "POL",
        module: "QUALITY",
        iso: "ISO9001",
        status: "APPROVED",
        effective: "2026-01-01",
        expiry: "2027-12-31",
        version: "2.1",
      },
      {
        docCode: "RES/QMS/PRC/001",
        title: "Document Control Procedure",
        cat: "PRC",
        module: "QUALITY",
        iso: "ISO9001",
        status: "APPROVED",
        effective: "2026-02-15",
        expiry: "2026-09-15",
        version: "1.0",
      },
      {
        docCode: "RES/QMS/PRC/002",
        title: "Purchase Order Approval Procedure",
        cat: "PRC",
        module: "QUALITY",
        iso: "ISO9001",
        status: "UNDER_REVIEW",
        effective: null,
        expiry: null,
        version: "0.9",
      },
      {
        docCode: "RES/HSE/MNL/001",
        title: "Occupational Health & Safety Manual",
        cat: "HSE",
        module: "SAFETY",
        iso: "ISO45001",
        status: "APPROVED",
        effective: "2026-03-01",
        expiry: "2026-09-01",
        version: "1.0",
      },
      {
        docCode: "RES/ENV/MNL/001",
        title: "Environmental Management Manual",
        cat: "ENV",
        module: "ENVIRONMENT",
        iso: "ISO14001",
        status: "APPROVED",
        effective: "2026-04-01",
        expiry: "2026-10-01",
        version: "1.0",
      },
      {
        docCode: "RES/QMS/SOP/001",
        title: "Concrete Pouring SOP",
        cat: "SOP",
        module: "QUALITY",
        iso: "ISO9001",
        status: "APPROVED",
        effective: "2026-05-01",
        expiry: null,
        version: "1.0",
      },
    ];

    for (const d of docDefs) {
      const existing = await prisma.document.findUnique({ where: { docCode: d.docCode } });
      if (existing) continue;
      const doc = await prisma.document.create({
        data: {
          docCode: d.docCode,
          title: d.title,
          categoryId: catByCode.get(d.cat) ?? null,
          module: d.module,
          isoStandard: d.iso as "ISO9001",
          status: d.status,
          effectiveDate: d.effective ? new Date(d.effective) : null,
          expiryDate: d.expiry ? new Date(d.expiry) : null,
          currentVersion: d.version,
        },
      });
      await prisma.documentVersion.create({
        data: {
          documentId: doc.id,
          versionNo: d.version,
          fileName: `${d.docCode.replace(/\//g, "-")}-v${d.version}.pdf`,
          fileUrl: `/documents/${doc.id}/files/${d.docCode.replace(/\//g, "-")}-v${d.version}.pdf`,
          changeSummary: "Initial approved release.",
        },
      });
    }
    console.log("  • Demo documents seeded");
  }

  // -----------------------------------------------------------------
  // Demo ISO compliance (NCR + CAPA, risk, training, aspect, incident)
  // -----------------------------------------------------------------
  {
    const prjId = projectIds[0];

    // NCR + corrective action (fixed ncrNo; keep counter in sync)
    const ncr = await prisma.nCR.findFirst({ where: { ncrNo: "NCR/PRJ-001/2026/0001" } });
    if (!ncr) {
      const created = await prisma.nCR.create({
        data: {
          ncrNo: "NCR/PRJ-001/2026/0001",
          projectId: prjId,
          date: new Date("2026-08-05"),
          source: "INSPECTION",
          description: "Rebar spacing on Block A column exceeded allowable tolerance at multiple locations.",
          severity: "MAJOR",
          status: "UNDER_REVIEW",
        },
      });
      await prisma.correctiveAction.create({
        data: {
          ncrId: created.id,
          type: "CORRECTIVE",
          title: "Rebar placement re-inspection & rework",
          rootCause: "Inadequate supervision during steel fixing.",
          action: "Re-check all Block A columns, rework out-of-tolerance bars, and re-inspect with QA.",
          status: "OPEN",
        },
      });
    }
    await bumpCounter("NCR", prjId ? "PRJ-001" : "GEN", 2026, 1);

    // Risk assessment
    if (prjId && (await prisma.riskAssessment.count()) === 0) {
      await prisma.riskAssessment.create({
        data: {
          projectId: prjId,
          hazard: "Working at height on scaffolding",
          risk: "Fall from scaffold / collapse",
          likelihood: 3,
          severity: 4,
          riskRating: 12,
          controlMeasures: "Guardrails, toe-boards, harness with double lanyard, daily scaffold inspection.",
          status: "OPEN",
        },
      });
    }

    // Training record (certificate expiring within 60 days -> alert)
    if ((await prisma.trainingRecord.count()) === 0) {
      const emp = await prisma.employee.findFirst({ where: { empCode: "EMP-002" } });
      await prisma.trainingRecord.create({
        data: {
          employeeId: emp?.id ?? null,
          trainingTitle: "Working at Height Awareness",
          provider: "Internal HSE",
          trainingDate: new Date("2025-09-10"),
          expiryDate: new Date("2026-09-10"),
          competencyLevel: "INTERMEDIATE",
          certificateUrl: "/training/WAH-EMP-002.pdf",
        },
      });
    }

    // Environmental aspect
    if (prjId && (await prisma.environmentalAspect.count()) === 0) {
      await prisma.environmentalAspect.create({
        data: {
          projectId: prjId,
          activity: "Concrete batching & placement",
          aspect: "Dust and particulate emissions",
          impact: "Local air pollution, community nuisance",
          significance: "MEDIUM",
          controlMeasures: "Water spraying, covered stockpiles, damp-proof sheeting.",
        },
      });
    }

    // Safety incident
    if (prjId && (await prisma.safetyIncident.count()) === 0) {
      await prisma.safetyIncident.create({
        data: {
          projectId: prjId,
          date: new Date("2026-07-28"),
          incidentType: "NEAR_MISS",
          description: "Suspended load swung close to worker during crane lift; no injury, load dropped short.",
          severity: "MODERATE",
          investigationStatus: "UNDER_INVESTIGATION",
          rootCause: "Improper rigging and lack of exclusion zone.",
        },
      });
    }

    console.log("  • Demo ISO compliance seeded");
  }

  // -----------------------------------------------------------------
  // Demo correspondence (letter in/out + memo)
  // -----------------------------------------------------------------
  {
    const prjId = projectIds[0];
    const defs = [
      {
        refNo: "LO/PRJ-001/2026/0001",
        type: "LETTER_OUT" as const,
        fromName: "RESPAK (Pvt) Ltd.",
        toName: "Client — Al-Bilal Developers",
        date: "2026-07-20",
        subject: "Submission of revised Gantt chart for Phase 2",
        body: "Dear Sirs,\n\nPlease find enclosed the revised Gantt chart for Tower Residency Phase 2 incorporating the approved variation. Kindly review and revert.\n\nRegards,\nProject Management",
        status: "SENT",
      },
      {
        refNo: "LI/PRJ-001/2026/0001",
        type: "LETTER_IN" as const,
        fromName: "Al-Bilal Developers",
        toName: "RESPAK (Pvt) Ltd.",
        date: "2026-08-02",
        subject: "Site access restriction notice",
        body: "This is to notify that site access will be restricted on 10 Aug 2026 for paving works. Please plan deliveries accordingly.\n\nRegards,\nClient Rep.",
        status: "RECEIVED",
      },
      {
        refNo: "IM/PRJ-001/2026/0001",
        type: "INTERNAL_MEMO" as const,
        fromName: "Waqar Ahmed (PM)",
        toName: "Site Engineers",
        date: "2026-08-10",
        subject: "Weekly progress meeting — agenda",
        body: "Weekly progress meeting scheduled Thursday 10:00 AM. Bring DPR, material requests and equipment logs.\n\n— PM",
        status: "SENT",
      },
    ];

    for (const d of defs) {
      const existing = await prisma.correspondence.findUnique({ where: { refNo: d.refNo } });
      if (existing) continue;
      await prisma.correspondence.create({
        data: {
          refNo: d.refNo,
          type: d.type,
          projectId: prjId,
          date: new Date(d.date),
          fromName: d.fromName,
          toName: d.toName,
          subject: d.subject,
          body: d.body,
          status: d.status,
        },
      });
    }

    // Keep the letter/memo counters in sync with the hardcoded numbers above.
    await bumpCounter("LETTER_OUT", "PRJ-001", 2026, 1);
    await bumpCounter("LETTER_IN", "PRJ-001", 2026, 1);
    await bumpCounter("INTERNAL_MEMO", "PRJ-001", 2026, 1);

    console.log("  • Demo correspondence seeded");
  }

  console.log("\n✅ Seed complete!");
  console.log("────────────────────────────────────────────");
  console.log("Super Admin : superadmin@respak.pk / Admin@123");
  console.log("Admin       : admin@respak.pk      / Admin@123");
  console.log("Others      : <role>@respak.pk     / Password@123");
  console.log("────────────────────────────────────────────");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
