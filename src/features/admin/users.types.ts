export type UserStatus = "ACTIVE" | "INVITED" | "INACTIVE" | "BLOCKED" | "ARCHIVED";
export interface ManagedUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  employeeId: string | null;
  mobileNumber: string | null;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  lastSignInAt: string | null;
  archivedAt: string | null;
}
export interface UserProfileInput {
  firstName: string;
  lastName: string;
  email: string;
  employeeId: string | null;
  mobileNumber: string | null;
}
export interface CreateUserInput extends UserProfileInput { password: string; licenseId: string; }
export interface AvailableLicense { id: string; licenseNumber: string; expiresAt: string; }
export interface UsersResult { data: ManagedUser[]; meta: { total: number; page: number; pageSize: number }; }
