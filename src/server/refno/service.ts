import { prisma } from "@/lib/db";
import { REF_DOC_TYPES, type RefDocType } from "@/lib/constants";

// =====================================================================
// AUTO REFERENCE NUMBER SYSTEM
//
// Config-driven numbering with the format:
//     PREFIX / PROJECT CODE / YEAR / SERIAL
//
// Fully configurable per document type via the NumberingConfig table:
//   - prefix, separator
//   - includeProjectCode (yes/no)  — project code e.g. "PRJ-001"
//   - includeYear (yes/no)
//   - padLength, startSerial
//
// Serial counters are stored per (config, project, year) inside a DB
// transaction, so concurrent requests never produce duplicates.
// =====================================================================

export type RefNoOptions = {
  projectCode?: string | null;
  year?: number;
};

/** Defaults for a doc type, used when seeding the config table. */
export const DEFAULT_REF_CONFIGS: {
  docType: RefDocType;
  prefix: string;
  includeProjectCode: boolean;
  includeYear: boolean;
  padLength: number;
  startSerial: number;
}[] = [
  { docType: REF_DOC_TYPES.LETTER_IN, prefix: "LI", includeProjectCode: true, includeYear: true, padLength: 4, startSerial: 1 },
  { docType: REF_DOC_TYPES.LETTER_OUT, prefix: "LO", includeProjectCode: true, includeYear: true, padLength: 4, startSerial: 1 },
  { docType: REF_DOC_TYPES.INTERNAL_MEMO, prefix: "IM", includeProjectCode: true, includeYear: true, padLength: 4, startSerial: 1 },
  { docType: REF_DOC_TYPES.PURCHASE_ORDER, prefix: "PO", includeProjectCode: true, includeYear: true, padLength: 4, startSerial: 1 },
  { docType: REF_DOC_TYPES.MATERIAL_REQUEST, prefix: "MR", includeProjectCode: true, includeYear: true, padLength: 4, startSerial: 1 },
  { docType: REF_DOC_TYPES.GRN, prefix: "GRN", includeProjectCode: false, includeYear: true, padLength: 4, startSerial: 1 },
  { docType: REF_DOC_TYPES.IPC, prefix: "IPC", includeProjectCode: true, includeYear: true, padLength: 3, startSerial: 1 },
  { docType: REF_DOC_TYPES.VARIATION_ORDER, prefix: "VO", includeProjectCode: true, includeYear: true, padLength: 4, startSerial: 1 },
  { docType: REF_DOC_TYPES.NCR, prefix: "NCR", includeProjectCode: true, includeYear: true, padLength: 4, startSerial: 1 },
  { docType: REF_DOC_TYPES.BOQ, prefix: "BOQ", includeProjectCode: true, includeYear: false, padLength: 3, startSerial: 1 },
];

/** Ensure the built-in numbering configs exist (idempotent, used by seed). */
export async function ensureRefNoConfigs(): Promise<void> {
  for (const cfg of DEFAULT_REF_CONFIGS) {
    const existing = await prisma.numberingConfig.findUnique({ where: { docType: cfg.docType } });
    if (!existing) {
      await prisma.numberingConfig.create({
        data: {
          docType: cfg.docType,
          prefix: cfg.prefix,
          separator: "/",
          includeProjectCode: cfg.includeProjectCode,
          includeYear: cfg.includeYear,
          padLength: cfg.padLength,
          startSerial: cfg.startSerial,
          isActive: true,
        },
      });
    }
  }
}

/**
 * Generate the next reference number for a document type.
 * Atomic — uses a transaction + per-(config, project, year) counter row.
 *
 * Example: generateRefNo("MATERIAL_REQUEST", { projectCode: "PRJ-001" })
 *   -> "MR / PRJ-001 / 2026 / 0001"
 */
export async function generateRefNo(docType: string, opts?: RefNoOptions): Promise<string> {
  const config = await prisma.numberingConfig.findUnique({ where: { docType } });
  if (!config) {
    throw new Error(`No numbering configuration exists for doc type "${docType}".`);
  }
  if (!config.isActive) {
    throw new Error(`Numbering is disabled for doc type "${docType}".`);
  }

  const year = opts?.year ?? new Date().getFullYear();
  const projectCode = opts?.projectCode || "GEN"; // "GEN" = company-wide

  const serial = await prisma.$transaction(async (tx) => {
    const existing = await tx.numberingCounter.findUnique({
      where: { configId_projectCode_year: { configId: config.id, projectCode, year } },
    });
    const next = existing ? existing.lastSerial + 1 : config.startSerial;

    if (existing) {
      await tx.numberingCounter.update({ where: { id: existing.id }, data: { lastSerial: next } });
    } else {
      await tx.numberingCounter.create({
        data: { configId: config.id, projectCode, year, lastSerial: next },
      });
    }
    return next;
  });

  const sep = config.separator || "/";
  const parts: string[] = [config.prefix];
  if (config.includeProjectCode) parts.push(projectCode);
  if (config.includeYear) parts.push(String(year));
  parts.push(String(serial).padStart(config.padLength, "0"));
  return parts.join(sep);
}

export { REF_DOC_TYPES };
