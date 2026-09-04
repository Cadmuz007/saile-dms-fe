import type { AdminUser, ApprovalAlert, DocumentTypeRecord, GroupRecord, LicenseRecord, PermissionRecord, WorkflowRecord } from "./types";

export const adminUsers: AdminUser[] = [
  { id: "usr-01", name: "Alex Rivera", email: "alex.rivera@saile.gov.ph", employeeId: "BTR-1004", group: "Records Office", license: "SDL-000241", status: "Active", lastActive: "Today, 9:41 AM" },
  { id: "usr-02", name: "Maya Santos", email: "maya.santos@saile.gov.ph", employeeId: "BTR-1018", group: "Legal Review", license: "SDL-000242", status: "Active", lastActive: "Today, 8:14 AM" },
  { id: "usr-03", name: "Noel Garcia", email: "noel.garcia@saile.gov.ph", employeeId: "BTR-1043", group: "Finance", license: "SDL-000243", status: "Invited", lastActive: "Invitation pending" },
  { id: "usr-04", name: "Angela Cruz", email: "angela.cruz@saile.gov.ph", employeeId: "BTR-1059", group: "Executive Office", license: "SDL-000244", status: "Active", lastActive: "Yesterday" },
];

export const licenses: LicenseRecord[] = [
  { id: "lic-01", licenseNumber: "SDL-000241", assignee: "Alex Rivera", generatedDate: "Jan 15, 2026", expiryDate: "Jan 15, 2027", status: "Assigned" },
  { id: "lic-02", licenseNumber: "SDL-000242", assignee: "Maya Santos", generatedDate: "Jan 15, 2026", expiryDate: "Jan 15, 2027", status: "Assigned" },
  { id: "lic-03", licenseNumber: "SDL-000243", assignee: "Noel Garcia", generatedDate: "Feb 02, 2026", expiryDate: "Feb 02, 2027", status: "Assigned" },
  { id: "lic-04", licenseNumber: "SDL-000245", assignee: "—", generatedDate: "Aug 28, 2026", expiryDate: "Aug 28, 2027", status: "Available" },
  { id: "lic-05", licenseNumber: "SDL-000201", assignee: "Angela Cruz", generatedDate: "Sep 11, 2025", expiryDate: "Sep 11, 2026", status: "Expiring soon" },
];

export const approvalAlerts: ApprovalAlert[] = [
  { id: "sla-01", document: "FY 2027 Budget Proposal.pdf", assignedTo: "Maya Santos", stage: "Legal review", waiting: "4h 18m", sla: "Overdue" },
  { id: "sla-02", document: "Procurement Plan Q4.docx", assignedTo: "Angela Cruz", stage: "Executive approval", waiting: "2h 42m", sla: "At risk" },
  { id: "sla-03", document: "Records Retention Schedule.xlsx", assignedTo: "Alex Rivera", stage: "Records review", waiting: "38m", sla: "On track" },
];

export const groups: GroupRecord[] = [
  { id: "grp-01", name: "Records Office", memberCount: 14, permissionCount: 7, description: "Central records and document-control staff.", updatedAt: "Today" },
  { id: "grp-02", name: "Legal Review", memberCount: 9, permissionCount: 5, description: "Legal reviewers for document approvals.", updatedAt: "Yesterday" },
  { id: "grp-03", name: "Executive Office", memberCount: 6, permissionCount: 8, description: "Executive approvers and routing recipients.", updatedAt: "Aug 29, 2026" },
];

export const permissions: PermissionRecord[] = [
  { id: "perm-01", name: "Create section / folder", description: "Create folders in permitted document sections.", assignedGroups: 4, status: "Active" },
  { id: "perm-02", name: "Upload document", description: "Upload classified or unclassified documents.", assignedGroups: 6, status: "Active" },
  { id: "perm-03", name: "Upload new version", description: "Add a new document version.", assignedGroups: 4, status: "Active" },
  { id: "perm-04", name: "Print document", description: "Print a permitted document.", assignedGroups: 3, status: "Active" },
  { id: "perm-05", name: "Generate a barcode", description: "Create a barcode for a record.", assignedGroups: 2, status: "Active" },
  { id: "perm-06", name: "Print a generated barcode", description: "Print a record barcode.", assignedGroups: 2, status: "Active" },
  { id: "perm-07", name: "Reprint barcode", description: "Reprint an existing barcode.", assignedGroups: 1, status: "Active" },
  { id: "perm-08", name: "Send a document", description: "Route a document directly to a user.", assignedGroups: 5, status: "Active" },
  { id: "perm-09", name: "Send document with Set Sail", description: "Start a document approval workflow.", assignedGroups: 4, status: "Active" },
];

export const documentTypes: DocumentTypeRecord[] = [
  { id: "type-01", name: "Procurement Request", fieldCount: 6, audience: "Procurement, Finance", workflow: "Procurement approval", updatedAt: "Today", status: "Active" },
  { id: "type-02", name: "Legal Memorandum", fieldCount: 5, audience: "Legal Review", workflow: "Legal review route", updatedAt: "Aug 30, 2026", status: "Active" },
  { id: "type-03", name: "Executive Directive", fieldCount: 4, audience: "Executive Office", workflow: "—", updatedAt: "Aug 26, 2026", status: "Draft" },
];

export const workflows: WorkflowRecord[] = [
  { id: "sail-01", name: "Procurement approval", documentType: "Procurement Request", stageCount: 3, updatedAt: "Today", status: "Published" },
  { id: "sail-02", name: "Legal review route", documentType: "Legal Memorandum", stageCount: 2, updatedAt: "Aug 30, 2026", status: "Published" },
  { id: "sail-03", name: "Executive confirmation", documentType: "Executive Directive", stageCount: 2, updatedAt: "Aug 26, 2026", status: "Draft" },
];
