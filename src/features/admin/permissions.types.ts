import type { GroupStatus } from "./groups.types";
import type { UserStatus } from "./users.types";
export interface ManagedPermission { id: string; permissionKey: string; name: string; description: string | null; category: string; status: "ACTIVE" | "RETIRED"; createdAt: string; _count: { groupGrants: number; userGrants: number }; }
export interface PermissionGroup { id: string; name: string; status: GroupStatus; }
export interface PermissionUser { id: string; firstName: string; lastName: string; email: string; status: UserStatus; }
export interface GroupGrant { grantedAt: string; group: PermissionGroup; }
export interface UserGrant { grantedAt: string; user: PermissionUser; }
export interface PermissionGrants { groups: GroupGrant[]; users: UserGrant[]; }
export interface PermissionsResult { data: ManagedPermission[]; meta: { total: number; page: number; pageSize: number }; }
