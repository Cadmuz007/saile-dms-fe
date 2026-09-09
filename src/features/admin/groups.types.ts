import type { UserStatus } from "./users.types";

export type GroupStatus = "ACTIVE" | "ARCHIVED";
export interface ManagedGroup {
  id: string; name: string; description: string | null; status: GroupStatus; createdAt: string; archivedAt: string | null;
  _count: { memberships: number; permissionGrants: number };
}
export interface GroupMemberUser { id: string; firstName: string; lastName: string; email: string; employeeId: string | null; status: UserStatus; }
export interface GroupMember { addedAt: string; user: GroupMemberUser; }
export interface GroupInput { name: string; description: string | null; }
export interface GroupsResult { data: ManagedGroup[]; meta: { total: number; page: number; pageSize: number }; }
