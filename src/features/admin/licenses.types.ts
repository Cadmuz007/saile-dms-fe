export type EffectiveLicenseStatus = "AVAILABLE" | "ASSIGNED" | "EXPIRED" | "REVOKED" | "ARCHIVED";
export interface LicenseUserSummary { id: string; firstName: string; lastName: string; email: string; status: string; }
export interface ActiveLicenseAssignment { id: string; assignedAt: string; user: LicenseUserSummary; }
export interface ManagedLicense {
  id: string;
  licenseNumber: string;
  status: string;
  effectiveStatus: EffectiveLicenseStatus;
  issuedAt: string;
  expiresAt: string;
  createdAt: string;
  archivedAt: string | null;
  activeAssignment: ActiveLicenseAssignment | null;
}
export interface LicenseMetrics { total: number; enabled: number; available: number; assigned: number; expired: number; }
export interface LicensesResult { data: ManagedLicense[]; meta: { total: number; page: number; pageSize: number; metrics: LicenseMetrics }; }
export type EligibleLicenseUser = LicenseUserSummary;
export interface LicenseAssignmentHistory {
  id: string;
  assignedAt: string;
  endedAt: string | null;
  endReason: "REVOKED" | "REASSIGNED" | "EXPIRED" | null;
  user: LicenseUserSummary;
  assignedByUser: Pick<LicenseUserSummary, "id" | "firstName" | "lastName"> | null;
  endedByUser: Pick<LicenseUserSummary, "id" | "firstName" | "lastName"> | null;
}
export interface LicenseHistory { id: string; licenseNumber: string; assignments: LicenseAssignmentHistory[]; }
