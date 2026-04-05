export type DocumentType = 'primary' | 'supplement' | 'attachment' | 'amendment';

export interface UploadedDocument {
  id: string;
  file?: File;
  name: string;
  size?: number;
  type: string;
  progress: number;
  status: 'uploading' | 'complete' | 'error';
  pageCount?: number;
  // Document classification
  documentType: DocumentType;
  // Template / AI additions
  isTemplate?: boolean;
  isUserTemplate?: boolean;
  isAI?: boolean;
  aiThinkingStep?: string;
  gradient?: string; // template gradient classes
  // Drive import additions
  isDriveImport?: boolean;
  driveProvider?: string;
  // Locked state for correction/followup flows
  isLocked?: boolean;
}

export interface DriveFile {
  id: string;
  name: string;
  type: 'folder' | 'file';
  mimeType?: string;
  size?: number;
  itemCount?: number;
  modifiedDate?: string;
}

export interface DriveProvider {
  id: string;
  name: string;
  color: string;
  bgClass: string;
  textClass: string;
}

export const DRIVE_PROVIDERS: DriveProvider[] = [
  { id: "google_drive", name: "Google Drive", color: "#4285F4", bgClass: "bg-[#4285F4]/10", textClass: "text-[#4285F4]" },
  { id: "dropbox", name: "Dropbox", color: "#0061FF", bgClass: "bg-[#0061FF]/10", textClass: "text-[#0061FF]" },
  { id: "onedrive", name: "OneDrive", color: "#0078D4", bgClass: "bg-[#0078D4]/10", textClass: "text-[#0078D4]" },
];
