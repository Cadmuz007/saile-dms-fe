export type WorkspaceView = "home" | "sections" | "routes" | "barcodes" | "archives" | "trash";

export type LibrarySection = "Home" | "Private" | "Public";
export type RouteStatus = "Pending" | "Review" | "Completed" | "Setback";

export interface MockDocument {
  id: string;
  title: string;
  extension: "PDF" | "DOCX" | "XLSX" | "PPTX" | "TXT" | "CSV" | "PNG" | "JPEG";
  section: LibrarySection;
  folder: string;
  subject: string;
  description: string;
  classification: "Classified" | "Unclassified";
  size: string;
  uploadedAt: string;
  uploadedBy: string;
  version: string;
  barcode: string;
  status?: RouteStatus;
  recipients: string[];
  viewedBy: string[];
  mimeType?: string;
  isLive?: boolean;
  documentType?: string;
  metadata: Array<{ label: string; value: string }>;
  ownerUserId?: string;
  folderId?: string | null;
  canMove?: boolean;
  canArchive?: boolean;
  canRestore?: boolean;
  canStartWorkflow?: boolean;
  archivedAt?: string | null;
}

export interface Folder {
  id: string;
  name: string;
  section: LibrarySection;
  documentCount: number;
  updatedAt: string;
  ownerUserId?: string;
  isLive?: boolean;
  parentId?: string | null;
  canMove?: boolean;
  canArchive?: boolean;
  canRestore?: boolean;
  archivedAt?: string | null;
}
