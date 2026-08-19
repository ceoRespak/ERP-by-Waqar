import { prisma } from "@/lib/db";

// =====================================================================
// HR REPORTS — faithful port of respakHRM reportController.js
// =====================================================================

function daysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}

export async function attendanceReport(month: number, year: number, opts: { projectId?: number; departmentId?: number } = {}) {
  const records = await prisma.attendance.findMany({
    where: {
      month,
      year,
      ...(opts.projectId ? { projectId: opts.projectId } : {}),
      ...(opts.departmentId ? { employee: { departmentId: opts.departmentId } } : {}),
    },
    include: {
      employee: { include: { department: true, designation: true } },
      project: { select: { id: true, name: true } },
    },
    orderBy: { date: "asc" },
  });

  const byEmployee = new Map<number, { employee: (typeof records)[number]["employee"]; present: number; absent: number; late: number; halfDay: number; totalHours: number; days: Set<string> }>();
  for (const r of records) {
    const key = r.date.toISOString().slice(0, 10);
    const row = byEmployee.get(r.employeeId) ?? {
      employee: r.employee,
      present: 0,
      absent: 0,
      late: 0,
      halfDay: 0,
      totalHours: 0,
      days: new Set<string>(),
    };
    row.days.add(key);
    if (r.status === "PRESENT") row.present++;
    else if (r.status === "ABSENT") row.absent++;
    else if (r.status === "LATE") row.late++;
    else if (r.status === "HALF_DAY") row.halfDay++;
    row.totalHours += r.totalHours.toNumber();
    byEmployee.set(r.employeeId, row);
  }

  const rows = Array.from(byEmployee.values())
    .map((r) => {
      const attended = r.present + r.late;
      const total = r.present + r.absent + r.late + r.halfDay;
      return {
        employee: r.employee,
        present: r.present,
        absent: r.absent,
        late: r.late,
        halfDay: r.halfDay,
        totalDays: total,
        presentPercent: total > 0 ? Math.round((attended / total) * 100) : 0,
        totalHours: Math.round(r.totalHours * 100) / 100,
        attendanceDays: r.days.size,
      };
    })
    .sort((a, b) => b.presentPercent - a.presentPercent);

  const projectSummary = new Map<number, { project: string; workers: number; totalDays: number; totalHours: number }>();
  for (const r of records) {
    const ps = projectSummary.get(r.projectId ?? 0) ?? { project: r.project?.name ?? "—", workers: 0, totalDays: 0, totalHours: 0 };
    if (!projectSummary.has(r.projectId ?? 0)) projectSummary.set(r.projectId ?? 0, ps);
    ps.workers = new Set(records.filter((x) => x.projectId === r.projectId).map((x) => x.employeeId)).size;
    ps.totalDays += 1;
    ps.totalHours += r.totalHours.toNumber();
  }

  return { month, year, rows, projectSummary: Array.from(projectSummary.values()), totalRecords: records.length };
}

export async function leaveReport(opts: { from?: string; to?: string; departmentId?: number; status?: string } = {}) {
  const leaves = await prisma.leaveRequest.findMany({
    where: {
      ...(opts.from ? { fromDate: { gte: new Date(opts.from) } } : {}),
      ...(opts.to ? { toDate: { lte: new Date(opts.to) } } : {}),
      ...(opts.status ? { status: opts.status } : {}),
      ...(opts.departmentId ? { employee: { departmentId: opts.departmentId } } : {}),
    },
    include: { employee: { include: { department: true } }, leaveTypeConfig: true },
    orderBy: { fromDate: "asc" },
  });

  const byType = new Map<string, { code: string; name: string; count: number; days: number }>();
  const byEmployee = new Map<number, { employee: (typeof leaves)[number]["employee"]; count: number; days: number }>();
  for (const l of leaves) {
    const t = byType.get(l.leaveType) ?? { code: l.leaveType, name: l.leaveTypeConfig?.name ?? l.leaveType, count: 0, days: 0 };
    t.count += 1;
    t.days += l.days.toNumber();
    byType.set(l.leaveType, t);

    const e = byEmployee.get(l.employeeId) ?? { employee: l.employee, count: 0, days: 0 };
    e.count += 1;
    e.days += l.days.toNumber();
    byEmployee.set(l.employeeId, e);
  }

  return {
    leaves,
    totalLeaves: leaves.length,
    totalDays: leaves.reduce((s, l) => s + l.days.toNumber(), 0),
    byType: Array.from(byType.values()),
    byEmployee: Array.from(byEmployee.values()),
  };
}

export async function wagesReport(month: number, year: number, opts: { projectId?: number } = {}) {
  const attendance = await prisma.attendance.findMany({
    where: { month, year, ...(opts.projectId ? { projectId: opts.projectId } : {}), isDailyWage: false },
    include: { employee: true },
  });
  const employees = await prisma.employee.findMany({ where: { status: "ACTIVE" } });

  const rows = employees
    .map((emp) => {
      const recs = attendance.filter((a) => a.employeeId === emp.id);
      const totalDays = recs.length;
      const present = recs.filter((r) => r.status === "PRESENT" || r.status === "LATE").length;
      const basicWage = (emp.basicSalary.toNumber() / 30) * totalDays;
      const breakdown = (emp.allowanceBreakdown as { name: string; type: string; amount: number; isActive?: boolean }[] | null) ?? [];
      const allowanceTotal = breakdown
        .filter((a) => a.isActive !== false)
        .reduce((sum, a) => sum + (a.type === "percentage" ? (a.amount / 100) * emp.basicSalary.toNumber() : a.amount), 0);
      const monthlyAllowance = allowanceTotal;
      return {
        empCode: emp.empCode,
        name: `${emp.firstName} ${emp.lastName}`,
        totalDays,
        present,
        basicWage: Math.round(basicWage),
        allowances: Math.round(monthlyAllowance),
        totalHours: Math.round(recs.reduce((s, r) => s + r.totalHours.toNumber(), 0) * 100) / 100,
        gross: Math.round(basicWage + monthlyAllowance),
      };
    })
    .filter((r) => r.totalDays > 0);

  const dailyWages = await prisma.dailyWage.findMany({ where: { month, year }, include: { project: true } });
  const dailyTotal = dailyWages.reduce((s, d) => s + d.dailyWageAmount.toNumber(), 0);

  return { month, year, rows, totalBasic: rows.reduce((s, r) => s + r.basicWage, 0), totalGross: rows.reduce((s, r) => s + r.gross, 0), dailyWagesCount: dailyWages.length, dailyTotal };
}

export async function salaryReport(month: number, year: number, opts: { projectId?: number } = {}) {
  const daysInMonthCount = daysInMonth(month, year);
  const attendance = await prisma.attendance.findMany({
    where: { month, year, ...(opts.projectId ? { projectId: opts.projectId } : {}) },
    include: { employee: true, project: { select: { id: true, name: true } } },
  });
  const employees = await prisma.employee.findMany({ where: { status: "ACTIVE" }, include: { currentProject: { select: { id: true, name: true } } } });

  const rows = employees
    .map((emp) => {
      const recs = attendance.filter((a) => a.employeeId === emp.id);
      const present = recs.filter((r) => r.status === "PRESENT" || r.status === "LATE").length;
      const halfDay = recs.filter((r) => r.status === "HALF_DAY").length;
      const absent = recs.filter((r) => r.status === "ABSENT").length;
      const late = recs.filter((r) => r.status === "LATE").length;
      const overtime = recs.reduce((s, r) => s + r.overtime.toNumber(), 0);
      const project = recs[0]?.project ?? emp.currentProject ?? null;
      const basic = emp.basicSalary.toNumber();
      const breakdown = (emp.allowanceBreakdown as { name: string; type: string; amount: number; isActive?: boolean }[] | null) ?? [];
      const allowanceTotal = breakdown
        .filter((a) => a.isActive !== false)
        .reduce((sum, a) => sum + (a.type === "percentage" ? (a.amount / 100) * basic : a.amount), 0);
      const wht = emp.wht.toNumber();
      const advances = emp.advances.toNumber();

      if (emp.employeeType === "daily_wages") {
        // respakHRM: payableDays = present + halfDay*0.5; gross = dailyWage × payableDays; net = gross − wht − advances
        const payableDays = present + halfDay * 0.5;
        const gross = Math.round(emp.dailyWage.toNumber() * payableDays);
        const net = gross - wht - advances;
        return { empCode: emp.empCode, name: `${emp.firstName} ${emp.lastName}`, bank: emp.bankName, account: emp.bankAccount, project: project?.name ?? "—", basic, allowances: allowanceTotal, present, absent, halfDay, late, payableDays, gross, wht, advances, net, type: "daily_wage" };
      }

      // Monthly staff: perDay = gross/daysInMonth; deductible = absent + halfDay*0.5 + late*0.25
      const gross = Math.round(basic + allowanceTotal + overtime);
      const perDay = gross / daysInMonthCount;
      const deductibleDays = absent + halfDay * 0.5 + late * 0.25;
      const deduction = Math.round(perDay * deductibleDays);
      const net = gross - deduction - wht - advances;
      return { empCode: emp.empCode, name: `${emp.firstName} ${emp.lastName}`, bank: emp.bankName, account: emp.bankAccount, project: project?.name ?? "—", basic, allowances: allowanceTotal, present, absent, halfDay, late, deductibleDays: Math.round(deductibleDays * 100) / 100, gross, deduction, wht, advances, net, type: "monthly" };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const projectRollup = new Map<string, { project: string; totalGross: number; totalNet: number; count: number }>();
  for (const r of rows) {
    const pr = projectRollup.get(r.project) ?? { project: r.project, totalGross: 0, totalNet: 0, count: 0 };
    pr.totalGross += r.gross;
    pr.totalNet += r.net;
    pr.count += 1;
    projectRollup.set(r.project, pr);
  }

  return {
    month,
    year,
    daysInMonth: daysInMonthCount,
    rows,
    projectRollup: Array.from(projectRollup.values()),
    totalGross: rows.reduce((s, r) => s + r.gross, 0),
    totalDeductions: rows.reduce((s, r) => s + ((r as { deduction?: number }).deduction ?? 0), 0),
    totalWht: rows.reduce((s, r) => s + r.wht, 0),
    totalAdvances: rows.reduce((s, r) => s + r.advances, 0),
    totalNet: rows.reduce((s, r) => s + r.net, 0),
  };
}

/** Build an XLSX salary workbook buffer (respakHRM exportSalary format). */
export function buildSalaryXlsx(report: Awaited<ReturnType<typeof salaryReport>>): Buffer {
  const XLSX = require("xlsx");
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const header = ["Emp Code", "Employee Name", "Project", "Bank", "Account", "Basic", "Allowances", "Present", "Absent", "Half Day", "Late", "Gross", "WHT", "Advances", "Deduction", "Net Pay"];

  const aoa: (string | number)[][] = [
    ["RESPAK (PRIVATE) LIMITED."],
    [`BOK Accounts Salaries for the Month of ${monthNames[report.month - 1]} ${report.year}`],
    [],
    header,
  ];
  for (const r of report.rows) {
    aoa.push([
      r.empCode,
      r.name,
      r.project,
      r.bank ?? "",
      r.account ?? "",
      r.basic,
      Math.round(r.allowances),
      r.present,
      r.absent,
      r.halfDay,
      r.late,
      r.gross,
      r.wht,
      r.advances,
      (r as { deduction?: number }).deduction ?? 0,
      r.net,
    ]);
  }
  aoa.push([]);
  aoa.push(["TOTALS", "", "", "", "", "", "", "", "", "", "", report.totalGross, report.totalWht, report.totalAdvances, report.totalDeductions, report.totalNet]);

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Salary");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
