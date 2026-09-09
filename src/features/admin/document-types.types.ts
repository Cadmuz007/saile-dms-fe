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

export interface DocumentTypeInput {
  name: string;
  description: string | null;
  fields: DocumentTypeFieldInput[];
}

export interface DocumentTypesResult {
  data: ManagedDocumentType[];
  meta: { total: number; page: number; pageSize: number };
}
