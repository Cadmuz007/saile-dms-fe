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

export interface ApprovalAlert {
  id: string;
  document: string;
  assignedTo: string;
  stage: string;
  waiting: string;
  sla: "At risk" | "Overdue" | "On track";
}
