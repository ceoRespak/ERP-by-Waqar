import { prisma } from "@/lib/db";

// =====================================================================
// HR DASHBOARD — role-based KPI cards (respakHRM dashboardController)
// =====================================================================

export async function getHrDashboard(userId: number, roles: string[], employeeId?: number | null) {
  const isAdmin = roles.some((r) => ["ADMIN", "HR_MANAGER"].includes(r));
  const isPM = roles.includes("PROJECT_MANAGER");
  const employee = employeeId ? await prisma.employee.findUnique({ where: { id: employeeId } }) : null;

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const todayStart = new Date(todayStr);

  const unread = await prisma.notification.count({ where: { recipientId: userId, isRead: false } });

  if (isAdmin) {
    const [totalEmployees, totalProjects, presentToday, pendingLeaves, pendingAttendances, totalDailyWages, recentLeaves] = await Promise.all([
      prisma.employee.count(),
      prisma.hrProject.count({ where: { isActive: true } }),
      prisma.attendance.count({ where: { date: todayStart, status: { in: ["PRESENT", "LATE", "HALF_DAY"] } } }),
      prisma.leaveRequest.count({ where: { status: { in: ["PENDING", "APPROVED_BY_PM"] } } }),
      prisma.attendance.count({ where: { approvalStatus: "pending" } }),
      prisma.dailyWage.count({ where: { status: "present" } }),
      prisma.leaveRequest.findMany({ orderBy: { createdAt: "desc" }, take: 5, include: { employee: { select: { firstName: true, lastName: true } }, leaveTypeConfig: true } }),
    ]);
    return {
      role: "admin",
      stats: { totalEmployees, totalProjects, presentToday, pendingLeaves, pendingAttendances, totalDailyWages, unread },
      recentLeaves,
      recentAttendance: await prisma.attendance.findMany({ orderBy: { date: "desc" }, take: 5, include: { employee: { select: { firstName: true, lastName: true } }, project: { select: { name: true } } } }),
    };
  }

  if (isPM) {
    const myProjects = await prisma.hrProject.findMany({
      where: { projectManager: { userId } },
      select: { id: true, name: true },
    });
    const projectIds = myProjects.map((p) => p.id);
    const [pendingLeaves, pendingAttendances, presentToday] = await Promise.all([
      prisma.leaveRequest.count({ where: { status: "PENDING", currentApprovalStep: "pm" } }),
      prisma.attendance.count({ where: { approvalStatus: "pending", projectId: { in: projectIds } } }),
      prisma.attendance.count({ where: { date: todayStart, projectId: { in: projectIds }, status: { in: ["PRESENT", "LATE", "HALF_DAY"] } } }),
    ]);
    return { role: "pm", stats: { myProjects: myProjects.length, pendingLeaves, pendingAttendances, presentToday, unread }, myProjects };
  }

  // Employee view
  const [myAttendances, presentThisMonth, myLeaves] = await Promise.all([
    prisma.attendance.count({ where: { employeeId: employeeId ?? -1 } }),
    prisma.attendance.count({ where: { employeeId: employeeId ?? -1, month: today.getMonth() + 1, year: today.getFullYear(), status: { in: ["PRESENT", "LATE", "HALF_DAY"] } } }),
    prisma.leaveRequest.findMany({ where: { employeeId: employeeId ?? -1 }, orderBy: { createdAt: "desc" }, take: 5, include: { leaveTypeConfig: true } }),
  ]);
  return {
    role: "employee",
    stats: { myAttendances, presentThisMonth, unread },
    myLeaves,
    myProjects: employee?.currentProjectId ? await prisma.hrProject.findMany({ where: { id: employee.currentProjectId } }) : [],
  };
}
