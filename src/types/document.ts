export interface UploadedDocument {
  id: string;
  file?: File;
  name: string;
  size?: number;
  type: string;
  progress: number;
  status: 'uploading' | 'complete' | 'error';
  pageCount?: number;
  // Template / AI additions
  isTemplate?: boolean;
  isUserTemplate?: boolean;
  isAI?: boolean;
  gradient?: string; // template gradient classes
}
