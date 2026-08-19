// =====================================================================
// HR helpers — faithful port of respakHRM utils/helpers.js + utils/shift.js
// =====================================================================

export const EARLY_CHECKIN_GRACE_MIN = 15;

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function timeOnDate(date: Date, time: string): Date {
  // time like "HH:MM" — returns a Date on `date` at that time
  const [h, m] = time.split(":").map((n) => Number(n) || 0);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
}

export function formatTime(d: Date | null | undefined): string {
  if (!d) return "";
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Effective shift start/end for a date, honoring specialHours overrides (e.g. Ramadan). */
export function getEffectiveShift(project: {
  shiftStart: string;
  shiftEnd: string;
  specialHours?: unknown;
}, date: Date): { start: string; end: string } {
  const day = startOfDay(date).getTime();
  const specials = (project.specialHours as { startDate: string; endDate: string; startTime: string; endTime: string }[] | null) ?? [];
  for (const s of specials) {
    const start = new Date(s.startDate).getTime();
    const end = new Date(s.endDate).getTime();
    if (day >= start && day <= end) return { start: s.startTime, end: s.endTime };
  }
  return { start: project.shiftStart, end: project.shiftEnd };
}

/**
 * Attendance status from lateness vs effective shift start (respakHRM rule):
 *   <= 15 min late  -> present
 *   <= 60 min late  -> late
 *   <= 240 min late -> half_day
 *   otherwise       -> absent
 */
export function calculateAttendanceStatus(checkInTime: Date, date: Date, shiftStart: string): string {
  const effective = timeOnDate(date, shiftStart);
  const lateMinutes = Math.round((checkInTime.getTime() - effective.getTime()) / 60000);
  if (lateMinutes <= 15) return "PRESENT";
  if (lateMinutes <= 60) return "LATE";
  if (lateMinutes <= 240) return "HALF_DAY";
  return "ABSENT";
}

export function daysBetween(from: Date, to: Date): number {
  const ms = startOfDay(to).getTime() - startOfDay(from).getTime();
  return Math.round(ms / 86400000) + 1;
}

export function calculateAge(dob: Date): number {
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}

export function generatePassword(len = 8): string {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export function maskCNIC(cnic: string): string {
  const d = cnic.replace(/\D/g, "");
  if (d.length !== 13) return cnic;
  return `${d.slice(0, 5)}-*******-${d.slice(11)}`;
}

/** Generate an employee code: first 2 of department + first 2 of designation + 4-digit count. */
export function generateEmployeeCode(department: string, designation: string, count: number): string {
  const dept = (department || "XX").replace(/[^a-zA-Z]/g, "").slice(0, 2).toUpperCase() || "XX";
  const desig = (designation || "XX").replace(/[^a-zA-Z]/g, "").slice(0, 2).toUpperCase() || "XX";
  return `${dept}${desig}${String(count + 1).padStart(4, "0")}`;
}

/** Haversine distance in meters between two lat/lng points. */
export function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
