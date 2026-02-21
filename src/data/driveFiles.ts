import { DriveFile } from "@/types/document";

type DriveFileMap = Record<string, DriveFile[]>;

const googleDriveFiles: DriveFileMap = {
  "root": [
    { id: "gf-1", name: "Projects", type: "folder", itemCount: 8, modifiedDate: "2025-01-20" },
    { id: "gf-2", name: "Contracts", type: "folder", itemCount: 5, modifiedDate: "2025-01-18" },
    { id: "gf-3", name: "Shared with me", type: "folder", itemCount: 14, modifiedDate: "2025-01-22" },
    { id: "gf-4", name: "Q4 Sales Proposal.pdf", type: "file", mimeType: "application/pdf", size: 3355443, modifiedDate: "2024-12-20" },
    { id: "gf-5", name: "Service Agreement Draft.docx", type: "file", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", size: 1887437, modifiedDate: "2025-01-05" },
    { id: "gf-6", name: "Company Logo.png", type: "file", mimeType: "image/png", size: 460800, modifiedDate: "2024-11-03" },
    { id: "gf-7", name: "Invoice #1042.pdf", type: "file", mimeType: "application/pdf", size: 911360, modifiedDate: "2025-01-12" },
    { id: "gf-8", name: "Meeting Notes.docx", type: "file", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", size: 327680, modifiedDate: "2025-01-18" },
    { id: "gf-9", name: "NDA - Acme Corp.pdf", type: "file", mimeType: "application/pdf", size: 1153434, modifiedDate: "2024-12-08" },
  ],
  "gf-1": [
    { id: "gf-1-1", name: "Website Redesign", type: "folder", itemCount: 4, modifiedDate: "2025-01-15" },
    { id: "gf-1-2", name: "Mobile App", type: "folder", itemCount: 6, modifiedDate: "2025-01-10" },
    { id: "gf-1-3", name: "Project Brief - Q1.pdf", type: "file", mimeType: "application/pdf", size: 2097152, modifiedDate: "2025-01-08" },
    { id: "gf-1-4", name: "Timeline.docx", type: "file", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", size: 524288, modifiedDate: "2025-01-12" },
    { id: "gf-1-5", name: "Budget Estimate.pdf", type: "file", mimeType: "application/pdf", size: 1048576, modifiedDate: "2025-01-06" },
  ],
  "gf-2": [
    { id: "gf-2-1", name: "Client A - MSA.pdf", type: "file", mimeType: "application/pdf", size: 1572864, modifiedDate: "2024-12-15" },
    { id: "gf-2-2", name: "Vendor Agreement v3.docx", type: "file", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", size: 819200, modifiedDate: "2024-12-20" },
    { id: "gf-2-3", name: "Consulting SOW.pdf", type: "file", mimeType: "application/pdf", size: 1363148, modifiedDate: "2025-01-02" },
    { id: "gf-2-4", name: "Employment Offer - Draft.docx", type: "file", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", size: 409600, modifiedDate: "2025-01-14" },
    { id: "gf-2-5", name: "Partnership Terms.pdf", type: "file", mimeType: "application/pdf", size: 2621440, modifiedDate: "2024-11-28" },
  ],
  "gf-3": [
    { id: "gf-3-1", name: "Team Reports", type: "folder", itemCount: 3, modifiedDate: "2025-01-19" },
    { id: "gf-3-2", name: "Marketing Plan 2025.pdf", type: "file", mimeType: "application/pdf", size: 4194304, modifiedDate: "2025-01-15" },
    { id: "gf-3-3", name: "Brand Guidelines.pdf", type: "file", mimeType: "application/pdf", size: 8388608, modifiedDate: "2024-10-20" },
    { id: "gf-3-4", name: "Product Roadmap.docx", type: "file", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", size: 655360, modifiedDate: "2025-01-22" },
  ],
};

const dropboxFiles: DriveFileMap = {
  "root": [
    { id: "df-1", name: "Work", type: "folder", itemCount: 11, modifiedDate: "2025-01-21" },
    { id: "df-2", name: "Personal", type: "folder", itemCount: 7, modifiedDate: "2025-01-19" },
    { id: "df-3", name: "Client Proposal - Final.pdf", type: "file", mimeType: "application/pdf", size: 2883584, modifiedDate: "2025-01-16" },
    { id: "df-4", name: "Expense Report Q4.pdf", type: "file", mimeType: "application/pdf", size: 1048576, modifiedDate: "2024-12-30" },
    { id: "df-5", name: "Team Photo.jpg", type: "file", mimeType: "image/jpeg", size: 3145728, modifiedDate: "2024-11-15" },
    { id: "df-6", name: "Contract - Signed.pdf", type: "file", mimeType: "application/pdf", size: 1572864, modifiedDate: "2025-01-10" },
    { id: "df-7", name: "Presentation Deck.pdf", type: "file", mimeType: "application/pdf", size: 5242880, modifiedDate: "2025-01-08" },
  ],
  "df-1": [
    { id: "df-1-1", name: "Invoices", type: "folder", itemCount: 12, modifiedDate: "2025-01-20" },
    { id: "df-1-2", name: "Contracts", type: "folder", itemCount: 8, modifiedDate: "2025-01-18" },
    { id: "df-1-3", name: "Weekly Report.docx", type: "file", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", size: 245760, modifiedDate: "2025-01-21" },
    { id: "df-1-4", name: "Project Plan.pdf", type: "file", mimeType: "application/pdf", size: 1835008, modifiedDate: "2025-01-14" },
  ],
  "df-2": [
    { id: "df-2-1", name: "Tax Documents", type: "folder", itemCount: 4, modifiedDate: "2025-01-05" },
    { id: "df-2-2", name: "Resume - 2025.pdf", type: "file", mimeType: "application/pdf", size: 512000, modifiedDate: "2025-01-01" },
    { id: "df-2-3", name: "Cover Letter.docx", type: "file", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", size: 163840, modifiedDate: "2025-01-02" },
  ],
};

const onedriveFiles: DriveFileMap = {
  "root": [
    { id: "of-1", name: "Documents", type: "folder", itemCount: 15, modifiedDate: "2025-01-22" },
    { id: "of-2", name: "Reports", type: "folder", itemCount: 6, modifiedDate: "2025-01-20" },
    { id: "of-3", name: "Shared", type: "folder", itemCount: 9, modifiedDate: "2025-01-19" },
    { id: "of-4", name: "Annual Report 2024.pdf", type: "file", mimeType: "application/pdf", size: 6291456, modifiedDate: "2025-01-10" },
    { id: "of-5", name: "Meeting Minutes.docx", type: "file", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", size: 286720, modifiedDate: "2025-01-22" },
    { id: "of-6", name: "Logo Vector.png", type: "file", mimeType: "image/png", size: 819200, modifiedDate: "2024-09-15" },
    { id: "of-7", name: "Board Presentation.pdf", type: "file", mimeType: "application/pdf", size: 4718592, modifiedDate: "2025-01-17" },
  ],
  "of-1": [
    { id: "of-1-1", name: "Legal", type: "folder", itemCount: 7, modifiedDate: "2025-01-18" },
    { id: "of-1-2", name: "HR", type: "folder", itemCount: 5, modifiedDate: "2025-01-15" },
    { id: "of-1-3", name: "Policy Handbook.pdf", type: "file", mimeType: "application/pdf", size: 3670016, modifiedDate: "2024-12-01" },
    { id: "of-1-4", name: "Employee Agreement.docx", type: "file", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", size: 614400, modifiedDate: "2025-01-12" },
  ],
  "of-2": [
    { id: "of-2-1", name: "Q3 Financial Summary.pdf", type: "file", mimeType: "application/pdf", size: 2359296, modifiedDate: "2024-10-15" },
    { id: "of-2-2", name: "Q4 Financial Summary.pdf", type: "file", mimeType: "application/pdf", size: 2621440, modifiedDate: "2025-01-08" },
    { id: "of-2-3", name: "Sales Dashboard.pdf", type: "file", mimeType: "application/pdf", size: 1572864, modifiedDate: "2025-01-20" },
  ],
  "of-3": [
    { id: "of-3-1", name: "Design Assets", type: "folder", itemCount: 12, modifiedDate: "2025-01-16" },
    { id: "of-3-2", name: "Competitor Analysis.pdf", type: "file", mimeType: "application/pdf", size: 3145728, modifiedDate: "2025-01-14" },
    { id: "of-3-3", name: "Strategy Doc.docx", type: "file", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", size: 491520, modifiedDate: "2025-01-19" },
  ],
};

const allProviderFiles: Record<string, DriveFileMap> = {
  google_drive: googleDriveFiles,
  dropbox: dropboxFiles,
  onedrive: onedriveFiles,
};

export function getDriveFiles(providerId: string, folderId: string = "root"): DriveFile[] {
  const providerFiles = allProviderFiles[providerId];
  if (!providerFiles) return [];
  return providerFiles[folderId] || [];
}

export function getDriveProviderRootName(providerId: string): string {
  switch (providerId) {
    case "google_drive": return "My Drive";
    case "dropbox": return "Dropbox";
    case "onedrive": return "OneDrive";
    default: return "Files";
  }
}
