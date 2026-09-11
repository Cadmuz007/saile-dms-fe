export type MetadataFieldKind = "SHORT_TEXT" | "LONG_TEXT" | "DATE" | "SINGLE_SELECT";
export type DocumentTypeStatus = "ACTIVE" | "ARCHIVED";

export interface DocumentTypeField {
  id: string;
  label: string;
  kind: MetadataFieldKind;
  helpText: string | null;
  isRequired: boolean;
  options: string[];
  position: number;
  archivedAt: string | null;
}

export interface ManagedDocumentType {
  id: string;
  name: string;
  description: string | null;
  status: DocumentTypeStatus;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  fields: DocumentTypeField[];
  visibilityRestricted: boolean;
  visibilityRevision: number;
  visibilityGrants: Array<{ userId: string | null; groupId: string | null; user: VisibilityUser | null; group: VisibilityGroup | null }>;
  _count: { documents: number };
}

export interface DocumentTypeFieldInput {
  id?: string;
  label: string;
  kind: MetadataFieldKind;
  helpText: string | null;
  isRequired: boolean;
  options: string[];
}

export type AvailableDocumentType = Pick<ManagedDocumentType, "id" | "name" | "description" | "fields">;

export interface DocumentTypeInput {
  name: string;
  description: string | null;
  fields: DocumentTypeFieldInput[];
  visibility: { restricted: boolean; userIds: string[]; groupIds: string[] };
  expectedVisibilityRevision?: number;
}

export interface VisibilityUser { id: string; firstName: string; lastName: string; email: string; status: string }
export interface VisibilityGroup { id: string; name: string; status: string }
export interface VisibilityCandidates { users: VisibilityUser[]; groups: VisibilityGroup[] }

export interface DocumentTypesResult {
  data: ManagedDocumentType[];
  meta: { total: number; page: number; pageSize: number };
}
