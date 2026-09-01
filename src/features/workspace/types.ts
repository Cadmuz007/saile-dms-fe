export type WorkspaceView = "home" | "sections" | "routes" | "archives" | "trash";

export type LibrarySection = "Home" | "Private" | "Public";
export type RouteStatus = "Pending" | "Review" | "Completed" | "Setback";

export interface MockDocument {
  id: string;
  title: string;
  extension: "PDF" | "DOCX" | "XLSX" | "PPTX" | "PNG";
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
}

export interface Folder {
  id: string;
  name: string;
  section: LibrarySection;
  documentCount: number;
  updatedAt: string;
}

export interface RouteRecord {
  id: string;
  documentId: string;
  routeType: "Inbound" | "Outbound";
  from: string;
  to: string;
  sentAt: string;
  responseTime: string;
  status: RouteStatus;
  remarks: string;
}
