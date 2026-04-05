export type DocumentStage = 'draft' | 'approving' | 'approved' | 'sent' | 'partially_signed' | 'waiting' | 'requires_action' | 'expiring' | 'completed' | 'declined' | 'voided' | 'expired';

export type DocumentCategory = 'Contract' | 'NDA' | 'Agreement' | 'SOW' | 'HR' | 'Amendment' | 'Resolution' | 'Certificate';

export type ParticipantStatus = 'signed' | 'pending' | 'viewed' | 'declined' | 'not_sent';

export interface WorkspaceParticipant {
  id: string;
  name: string;
  email: string;
  role: 'signer' | 'approver' | 'viewer';
  status: ParticipantStatus;
  signedAt?: string;
  viewedAt?: string;
}

export interface ApprovalStep {
  name: string;
  status: 'completed' | 'in_progress' | 'pending';
  assignee?: string;
}

export interface ActivityEvent {
  id: string;
  type: 'created' | 'sent' | 'viewed' | 'signed' | 'declined' | 'reminder' | 'approved' | 'voided' | 'expired' | 'commented';
  actor: string;
  timestamp: string;
  description: string;
}

export interface WorkspaceDocument {
  id: string;
  name: string;
  stage: DocumentStage;
  category: DocumentCategory;
  owner: string;
  counterparty?: string;
  participants: WorkspaceParticipant[];
  tags: string[];
  folder?: string;
  workflow?: string;
  workflowStep?: string;
  approvalSteps?: ApprovalStep[];
  activities: ActivityEvent[];
  createdAt: string;
  modifiedAt: string;
  expiresAt?: string;
  progress: number;
  waitingFor?: { name: string; since: string };
  isFavorite: boolean;
  value?: string;
}

export type SidebarView = 'all' | 'in_progress' | 'owned' | 'requires_action' | 'assigned' | 'received' | 'expiring' | 'completed' | 'shared';

export type QuickLink = 'my_documents' | 'shared_with_me' | 'bulk_send' | 'trash';
