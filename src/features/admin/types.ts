export type AdminView =
  | "overview"
  | "licenses"
  | "authentication"
  | "users"
  | "groups"
  | "permissions"
  | "policies"
  | "sla"
  | "document-types"
  | "set-sail"
  | "set-sail-ai";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  employeeId: string;
  group: string;
  license: string;
  status: "Active" | "Invited" | "Inactive";
  lastActive: string;
}

export interface LicenseRecord {
  id: string;
  licenseNumber: string;
  assignee: string;
  generatedDate: string;
  expiryDate: string;
  status: "Assigned" | "Available" | "Expiring soon";
}

export interface ApprovalAlert {
  id: string;
  document: string;
  assignedTo: string;
  stage: string;
  waiting: string;
  sla: "At risk" | "Overdue" | "On track";
}

export interface GroupRecord {
  id: string;
  name: string;
  memberCount: number;
  permissionCount: number;
  description: string;
  updatedAt: string;
}

export interface PermissionRecord {
  id: string;
  name: string;
  description: string;
  assignedGroups: number;
  status: "Active" | "Draft";
}

export interface DocumentTypeRecord {
  id: string;
  name: string;
  fieldCount: number;
  audience: string;
  workflow: string;
  updatedAt: string;
  status: "Active" | "Draft";
}

export interface WorkflowRecord {
  id: string;
  name: string;
  documentType: string;
  stageCount: number;
  updatedAt: string;
  status: "Published" | "Draft";
}
