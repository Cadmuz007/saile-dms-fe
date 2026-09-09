export interface AuthenticationSettings {
  id: string;
  mode: "EMBEDDED" | "AD_LDAP";
  isEnabled: boolean;
  updatedAt: string;
  updatedByUser: { id: string; firstName: string; lastName: string; email: string } | null;
}
