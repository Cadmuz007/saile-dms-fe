import type { ApprovalAlert } from "./types";

export const approvalAlerts: ApprovalAlert[] = [
  { id: "sla-01", document: "FY 2027 Budget Proposal.pdf", assignedTo: "Maya Santos", stage: "Legal review", waiting: "4h 18m", sla: "Overdue" },
  { id: "sla-02", document: "Procurement Plan Q4.docx", assignedTo: "Angela Cruz", stage: "Executive approval", waiting: "2h 42m", sla: "At risk" },
  { id: "sla-03", document: "Records Retention Schedule.xlsx", assignedTo: "Alex Rivera", stage: "Records review", waiting: "38m", sla: "On track" },
];
