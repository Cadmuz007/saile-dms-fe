import type { AuthenticatedUser } from "./types";

export function hasAdminConsoleAccess(user: AuthenticatedUser): boolean {
  return user.permissions.some((permission) => permission.startsWith("admin."));
}
