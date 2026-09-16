export interface AuthenticatedUser {
  id: string;
  organizationId: string;
  email: string;
  firstName: string;
  lastName: string;
  permissions: string[];
}

export interface SignInCredentials {
  organizationCode: string;
  email: string;
  password: string;
}

export interface SignInSession {
  accessToken: string;
  refreshToken: string;
  idleExpiresAt: string;
  sessionExpiresAt: string;
  tokenType: "Bearer";
  expiresIn: string;
  user: Omit<AuthenticatedUser, "permissions">;
}
