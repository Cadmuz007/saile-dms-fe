export interface WorkflowOptionRecipient {
  user: { id: string; firstName: string; lastName: string; email: string } | null;
  group: { id: string; name: string } | null;
}

export interface WorkflowOption {
  id: string;
  name: string;
  description: string | null;
  configurationRevision: number;
  isAssignedToDocumentType: boolean;
  stages: Array<{
    id: string;
    name: string;
    position: number;
    decisionRule: "ANY" | "ALL";
    recipients: WorkflowOptionRecipient[];
  }>;
}

export interface WorkflowOptions {
  document: { id: string; title: string; subject: string | null; documentTypeId: string | null };
  activeInstance: { id: string; status: "ACTIVE" | "ERROR"; startedAt: string; template: { id: string; name: string } } | null;
  templates: WorkflowOption[];
}

export interface StartedWorkflow {
  id: string;
  documentId: string;
  templateId: string;
  templateRevision: number;
  subject: string;
  message: string | null;
  status: "ACTIVE";
  startedAt: string;
  template: { id: string; name: string };
  stages: Array<{
    id: string;
    name: string;
    position: number;
    decisionRule: "ANY" | "ALL";
    status: "ACTIVE" | "WAITING";
    tasks: Array<{ id: string; status: "PENDING" | "WAITING"; receivedAt: string | null; assignedUser: { id: string; firstName: string; lastName: string; email: string } }>;
  }>;
}

export type WorkflowRouteDirection = "INBOUND" | "OUTBOUND";

export interface WorkflowTaskSla {
  slaPolicyRevision: number | null;
  responseDueAt: string | null;
  reviewStartedAt: string | null;
  reviewDueAt: string | null;
  firstRespondedAt: string | null;
  sla: { phase: "RESPONSE" | "REVIEW"; dueAt: string | null; tracked: boolean; overdue: boolean };
}

export interface WorkflowRoute {
  id: string;
  direction: WorkflowRouteDirection;
  subject: string;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED" | "ERROR";
  startedAt: string;
  completedAt: string | null;
  templateRevision: number;
  template: { id: string; name: string };
  startedBy: { id: string; firstName: string; lastName: string; email: string };
  document: import("@/services/documents").ApiDocument & { folder: { id: string; name: string } | null };
  currentStage: {
    id: string;
    name: string;
    position: number;
    status: "ACTIVE";
    stageCount: number;
    tasks: Array<WorkflowTaskSla & { id: string; status: "WAITING" | "PENDING" | "COMPLETED" | "CANCELLED"; receivedAt: string | null }>;
  } | null;
}

export type WorkflowInstanceDetail = Omit<StartedWorkflow, "status" | "stages"> & {
  availableReview: { taskId: string } | null;
  availableDecision: { taskId: string; approveBlockedReason: string | null; rejectBlockedReason: string | null; requiresMove: boolean; requiresDuplicate: boolean; requiresPdf: boolean; requiresAssign: boolean; moveDestinations: Array<{ id: string | null; name: string }> | null; assignCandidates: Array<{ id: string; firstName: string; lastName: string; email: string }> | null } | null;
  conversionRetry: { canRetry: boolean; blockedReason: string | null; requiresMove: boolean } | null;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED" | "ERROR";
  completedAt: string | null;
  startedBy: { id: string; firstName: string; lastName: string; email: string };
  document: { id: string; title: string; area: "HOME" | "PRIVATE" | "PUBLIC"; ownerUserId: string };
  stages: Array<{
    id: string;
    name: string;
    position: number;
    decisionRule: "ANY" | "ALL";
    approvedAction: "NEXT_STAGE" | "LAST_STAGE" | "APPROVE_DOCUMENT";
    attempt: number;
    rejectedAction: "PREVIOUS_STAGE" | "FIRST_STAGE" | "CANCEL_DOCUMENT";
    documentTransform: "CONVERT_TO_PDF" | "CONVERT_TO_PDF_AND_MOVE" | "CONVERT_TO_PDF_AND_ASSIGN" | "MOVE_DOCUMENT" | "DUPLICATE_AND_MOVE" | null;
    status: "WAITING" | "ACTIVE" | "COMPLETED" | "CANCELLED";
    openedAt: string | null;
    completedAt: string | null;
    tasks: Array<WorkflowTaskSla & { id: string; status: "WAITING" | "PENDING" | "COMPLETED" | "CANCELLED"; receivedAt: string | null; assignedUser: { id: string; firstName: string; lastName: string; email: string } }>;
  }>;
  auditEvents: Array<{
    id: string;
    action: "STARTED" | "APPROVED" | "REJECTED" | "CONVERSION_RETRIED" | "FOR_REVIEW";
    decision: { taskId: string; stageId: string; stageName: string; position: number; attempt: number; reason: string | null; resolved: boolean; selectedAction: string; targetStageId: string | null; documentVersionNumber: number; transformStatus: "COMPLETED" | "ERROR" | null; duplicateDocumentId?: string | null; copiedAttachmentCount?: number | null; assigneeUserId?: string; accessLevel?: "READ"; fromFolderId?: string | null; toFolderId?: string | null; moveStatus?: "COMPLETED" | "PENDING" } | null;
    retry: { sourceVersionNumber: number; outputVersionNumber: number | null; transformStatus: "COMPLETED" | "ERROR"; previousWorkflowStatus: "ERROR"; workflowStatus: "COMPLETED" | "ERROR"; fromFolderId?: string | null; toFolderId?: string | null; moveStatus?: "COMPLETED" | "PENDING" } | null;
    occurredAt: string;
    actor: { id: string; firstName: string; lastName: string; email: string };
  }>;
};
