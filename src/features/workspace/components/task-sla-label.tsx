import type { WorkflowTaskSla } from "../workflow.types";

export function TaskSlaLabel({ task }: { task: WorkflowTaskSla & { status: string } }) {
  if (task.status === "WAITING") return null;
  const sla = task.sla;
  if (!sla?.tracked) return <span className="block text-xs text-slate-500">SLA untracked</span>;
  const deadline = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" }).format(new Date(sla.dueAt!));
  return <span className={`block text-xs ${sla.overdue ? "font-semibold text-rose-700" : "text-slate-600"}`}>
    {sla.overdue ? "Overdue · " : ""}{sla.phase === "REVIEW" ? "Review" : "Response"} {task.status === "PENDING" ? "due" : "deadline"}: {deadline} PHT
    {task.status !== "PENDING" ? " · Timer stopped" : ""}
  </span>;
}
