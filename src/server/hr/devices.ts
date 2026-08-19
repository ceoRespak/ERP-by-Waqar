import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { createNotification } from "@/server/hr/notifications";

// =====================================================================
// HR DEVICES + FACE ENROLLMENTS — faithful port of deviceController.js / faceController.js
// =====================================================================

// ---------------------------------------------------------------------
// Device registration
// ---------------------------------------------------------------------
export async function listDeviceRegistrations() {
  return prisma.deviceRegistration.findMany({
    include: { owner: { select: { id: true, name: true, email: true } }, reviewedBy: { select: { id: true, name: true } } },
    orderBy: { requestedAt: "desc" },
  });
}

export async function registerDevice(userId: number, deviceId: string, deviceName?: string | null) {
  const pending = await prisma.deviceRegistration.findFirst({ where: { userId, status: "pending" } });
  if (pending) throw new Error("A device request is already pending for your account.");
  const alreadyBound = await prisma.deviceRegistration.findFirst({ where: { userId, status: "approved" } });
  if (alreadyBound) throw new Error("Your account already has a registered device.");
  const record = await prisma.deviceRegistration.create({
    data: { userId, deviceId, deviceName: deviceName ?? null },
  });
  await createNotification({
    recipientId: userId,
    type: "system",
    title: "Device request submitted",
    message: "Your device registration is pending admin approval.",
    relatedModel: "DeviceRegistration",
    relatedId: record.id,
  });
  return record;
}

export async function approveDevice(id: number, reviewedById: number) {
  const device = await prisma.deviceRegistration.findUnique({ where: { id } });
  if (!device) throw new Error("Device registration not found.");
  return prisma.$transaction(async (tx) => {
    // one device per user, one user per device (respakHRM)
    await tx.deviceRegistration.updateMany({
      where: { userId: device.userId, status: "approved", id: { not: device.id } },
      data: { status: "rejected", reviewedAt: new Date(), reviewedById },
    });
    const updated = await tx.deviceRegistration.update({
      where: { id: device.id },
      data: { status: "approved", reviewedAt: new Date(), reviewedById },
    });
    await createNotification({
      recipientId: device.userId,
      type: "system",
      title: "Device approved",
      message: "Your device was approved for self attendance.",
    });
    return updated;
  });
}

export async function rejectDevice(id: number, reviewedById: number) {
  const device = await prisma.deviceRegistration.findUnique({ where: { id } });
  if (!device) throw new Error("Device registration not found.");
  return prisma.deviceRegistration.update({
    where: { id },
    data: { status: "rejected", reviewedAt: new Date(), reviewedById },
  });
}

export async function unregisterDevice(registrationId: number) {
  await prisma.deviceRegistration.delete({ where: { id: registrationId } });
  return { ok: true };
}

// ---------------------------------------------------------------------
// Face enrollment
// ---------------------------------------------------------------------
export async function listFaceEnrollments() {
  return prisma.faceEnrollment.findMany({
    include: { employee: { select: { id: true, empCode: true, firstName: true, lastName: true } }, user: { select: { id: true, name: true } }, reviewedBy: { select: { id: true, name: true } } },
    orderBy: { requestedAt: "desc" },
  });
}

export async function createFaceEnrollment(employeeId: number, userId: number, descriptor: number[], photo?: string | null) {
  if (!Array.isArray(descriptor) || descriptor.length !== 128) throw new Error("Face descriptor must be a 128-length vector.");
  const existing = await prisma.faceEnrollment.findFirst({ where: { employeeId, status: "pending" } });
  if (existing) throw new Error("A face enrollment request is already pending for this employee.");
  return prisma.faceEnrollment.create({
    data: { employeeId, userId, descriptor: descriptor as unknown as Prisma.InputJsonValue, photo: photo ?? null },
  });
}

export async function approveFaceEnrollment(id: number, reviewedById: number) {
  const enrollment = await prisma.faceEnrollment.findUnique({ where: { id } });
  if (!enrollment) throw new Error("Face enrollment not found.");
  return prisma.$transaction(async (tx) => {
    const updated = await tx.faceEnrollment.update({
      where: { id },
      data: { status: "approved", reviewedAt: new Date(), reviewedById },
    });
    // Copy descriptor onto the employee (respakHRM faceController)
    await tx.employee.update({
      where: { id: enrollment.employeeId },
      data: { faceDescriptor: enrollment.descriptor as unknown as Prisma.InputJsonValue, faceEnrolledAt: new Date() },
    });
    await createNotification({
      recipientId: enrollment.userId,
      type: "system",
      title: "Face enrollment approved",
      message: "Your face enrollment was approved.",
    });
    return updated;
  });
}

export async function rejectFaceEnrollment(id: number, reviewedById: number) {
  const enrollment = await prisma.faceEnrollment.findUnique({ where: { id } });
  if (!enrollment) throw new Error("Face enrollment not found.");
  return prisma.faceEnrollment.update({
    where: { id },
    data: { status: "rejected", reviewedAt: new Date(), reviewedById },
  });
}

export async function unlinkFaceEnrollment(employeeId: number) {
  await prisma.employee.update({ where: { id: employeeId }, data: { faceDescriptor: Prisma.DbNull, faceEnrolledAt: null } });
  return { ok: true };
}
