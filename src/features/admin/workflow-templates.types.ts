export type WorkflowTemplateStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type WorkflowDecisionRule = "ANY" | "ALL";
export type WorkflowApprovedAction = "NEXT_STAGE" | "LAST_STAGE" | "APPROVE_DOCUMENT";
export type WorkflowRejectedAction = "PREVIOUS_STAGE" | "FIRST_STAGE" | "CANCEL_DOCUMENT";
export type WorkflowDocumentTransform = "CONVERT_TO_PDF" | "CONVERT_TO_PDF_AND_MOVE" | "CONVERT_TO_PDF_AND_ASSIGN" | "MOVE_DOCUMENT" | "DUPLICATE_AND_MOVE";
export type WorkflowRecipientTargetType = "USER" | "GROUP";

export interface WorkflowRecipientUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
}

export interface WorkflowRecipientGroup {
  id: string;
  name: string;
  status: string;
}

export interface WorkflowTemplateRecipient {
  id: string;
  userId: string | null;
  groupId: string | null;
  user: WorkflowRecipientUser | null;
  group: WorkflowRecipientGroup | null;
}

export interface WorkflowTemplateStage {
  id: string;
  name: string;
  position: number;
  decisionRule: WorkflowDecisionRule;
  approvedAction: WorkflowApprovedAction;
  rejectedAction: WorkflowRejectedAction;
  documentTransform: WorkflowDocumentTransform | null;
  recipients: WorkflowTemplateRecipient[];
}

export interface ManagedWorkflowTemplate {
  id: string;
  name: string;
  description: string | null;
  status: WorkflowTemplateStatus;
  configurationRevision: number;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  publishedAt: string | null;
  publishedBy: WorkflowRecipientUser | null;
  stages: WorkflowTemplateStage[];
  documentTypes: Array<{
    assignedAt: string;
    documentType: { id: string; name: string; status: string };
  }>;
  _count: { auditEvents: number };
}

export interface WorkflowRecipientInput {
  targetType: WorkflowRecipientTargetType;
  targetId: string;
}

export interface WorkflowStageInput {
  name: string;
  decisionRule: WorkflowDecisionRule;
  approvedAction: WorkflowApprovedAction;
  rejectedAction: WorkflowRejectedAction;
  documentTransform: WorkflowDocumentTransform | null;
  recipients: WorkflowRecipientInput[];
}

export interface WorkflowTemplateInput {
  name: string;
  description: string | null;
  stages: WorkflowStageInput[];
}

export interface WorkflowTemplatesResult {
  data: ManagedWorkflowTemplate[];
  meta: { total: number; page: number; pageSize: number };
}

export interface WorkflowRecipientCandidates {
  users: WorkflowRecipientUser[];
  groups: WorkflowRecipientGroup[];
}
