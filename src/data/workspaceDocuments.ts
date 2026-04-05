import { WorkspaceDocument } from '@/types/workspace';

const daysAgo = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
};

const hoursAgo = (hours: number) => {
  const d = new Date();
  d.setHours(d.getHours() - hours);
  return d.toISOString();
};

const minutesAgo = (mins: number) => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - mins);
  return d.toISOString();
};

export const workspaceDocuments: WorkspaceDocument[] = [
  // ROW 1
  {
    id: '1', name: 'Consulting Agreement — Strategy Partners', stage: 'draft', category: 'Agreement',
    owner: 'Ahmad Medhat', counterparty: 'Strategy Partners',
    participants: [
      { id: 'p1', name: 'Sarah Johnson', email: 'sarah@strategy.com', role: 'signer', status: 'not_sent' },
      { id: 'p2', name: 'Mike Torres', email: 'mike@strategy.com', role: 'signer', status: 'not_sent' },
    ],
    tags: [], activities: [
      { id: 'a1', type: 'created', actor: 'Ahmad Medhat', timestamp: minutesAgo(45), description: 'Document created' },
    ],
    createdAt: daysAgo(1), modifiedAt: minutesAgo(45), progress: 0, isFavorite: false,
    waitingFor: { name: 'Ahmad Medhat', since: minutesAgo(45) },
  },
  // ROW 2
  {
    id: '2', name: 'Master Services Agreement — Acme Corp', stage: 'approving', category: 'Contract',
    owner: 'Ahmad Medhat', counterparty: 'Acme Corp',
    workflow: 'Standard Approval', workflowStep: 'Finance Approval',
    participants: [
      { id: 'p3', name: 'Sarah Johnson', email: 'sarah@acme.com', role: 'signer', status: 'pending' },
      { id: 'p4', name: 'Mike Torres', email: 'mike@acme.com', role: 'signer', status: 'not_sent' },
      { id: 'p5', name: 'Lisa Chen', email: 'lisa@acme.com', role: 'viewer', status: 'not_sent' },
    ],
    approvalSteps: [
      { name: 'Manager Approval', status: 'completed', assignee: 'Ahmad Medhat' },
      { name: 'Finance Approval', status: 'in_progress', assignee: 'Sarah Johnson' },
      { name: 'Legal Review', status: 'pending', assignee: 'Legal Team' },
    ],
    tags: ['VIP Client'], activities: [
      { id: 'a2', type: 'created', actor: 'Ahmad Medhat', timestamp: daysAgo(5), description: 'Document created' },
    ],
    createdAt: daysAgo(5), modifiedAt: daysAgo(3), progress: 33,
    waitingFor: { name: 'Sarah Johnson', since: daysAgo(3) }, isFavorite: false,
  },
  // ROW 3
  {
    id: '3', name: 'Service Level Agreement — CloudBase', stage: 'approving', category: 'Agreement',
    owner: 'Ahmad Medhat', counterparty: 'CloudBase',
    workflow: 'Standard Approval', workflowStep: 'Legal Review',
    participants: [
      { id: 'p6', name: 'Mike Torres', email: 'mike@cloudbase.com', role: 'signer', status: 'pending' },
      { id: 'p7', name: 'Finance Director', email: 'finance@company.com', role: 'approver', status: 'not_sent' },
    ],
    approvalSteps: [
      { name: 'Manager Approval', status: 'completed', assignee: 'Ahmad Medhat' },
      { name: 'Legal Review', status: 'in_progress', assignee: 'Mike Torres' },
      { name: 'Finance Sign-off', status: 'pending', assignee: 'Finance Director' },
    ],
    tags: ['Confidential'], activities: [
      { id: 'a3', type: 'created', actor: 'Ahmad Medhat', timestamp: daysAgo(8), description: 'Document created' },
    ],
    createdAt: daysAgo(8), modifiedAt: daysAgo(4), progress: 33,
    waitingFor: { name: 'Mike Torres', since: daysAgo(4) }, isFavorite: false,
  },
  // ROW 4
  {
    id: '4', name: 'Maintenance Contract — Building Co', stage: 'approving', category: 'Contract',
    owner: 'Ahmad Medhat', counterparty: 'Building Co',
    workflow: 'Procurement Flow', workflowStep: 'Procurement Review',
    participants: [
      { id: 'p8', name: 'Procurement Team', email: 'procurement@company.com', role: 'approver', status: 'pending' },
    ],
    approvalSteps: [
      { name: 'Manager Approval', status: 'completed', assignee: 'Ahmad Medhat' },
      { name: 'Procurement Review', status: 'in_progress', assignee: 'Procurement Team' },
      { name: 'CFO Sign-off', status: 'pending', assignee: 'CFO' },
    ],
    tags: [], activities: [
      { id: 'a4', type: 'created', actor: 'Ahmad Medhat', timestamp: daysAgo(10), description: 'Document created' },
    ],
    createdAt: daysAgo(10), modifiedAt: daysAgo(5), progress: 33,
    waitingFor: { name: 'Procurement Team', since: daysAgo(5) }, isFavorite: false,
  },
  // ROW 5
  {
    id: '5', name: 'Vendor Agreement — Globex Inc', stage: 'approving', category: 'Agreement',
    owner: 'Ahmad Medhat', counterparty: 'Globex Inc',
    workflow: 'Cross-functional Review', workflowStep: 'Cross-functional Review',
    participants: [
      { id: 'p9', name: 'Sarah Johnson', email: 'sarah@globex.com', role: 'approver', status: 'pending' },
      { id: 'p10', name: 'Mike Torres', email: 'mike@globex.com', role: 'approver', status: 'pending' },
      { id: 'p11', name: 'David Park', email: 'david@globex.com', role: 'viewer', status: 'not_sent' },
    ],
    approvalSteps: [
      { name: 'Legal Review', status: 'completed', assignee: 'Legal Team' },
      { name: 'Cross-functional Review', status: 'in_progress', assignee: 'Mike Torres' },
      { name: 'Final Approval', status: 'pending', assignee: 'VP Operations' },
    ],
    tags: ['Legal Review'], activities: [
      { id: 'a5', type: 'created', actor: 'Ahmad Medhat', timestamp: daysAgo(7), description: 'Document created' },
    ],
    createdAt: daysAgo(7), modifiedAt: daysAgo(4), progress: 33,
    waitingFor: { name: 'Mike Torres', since: daysAgo(4) }, isFavorite: false,
  },
  // ROW 6
  {
    id: '6', name: 'Software License — CloudBase', stage: 'approving', category: 'Contract',
    owner: 'Ahmad Medhat', counterparty: 'CloudBase',
    workflow: 'Standard Approval', workflowStep: 'Legal Review',
    participants: [
      { id: 'p12', name: 'Legal', email: 'legal@company.com', role: 'approver', status: 'pending' },
    ],
    approvalSteps: [
      { name: 'Manager Approval', status: 'completed', assignee: 'Ahmad Medhat' },
      { name: 'Legal Review', status: 'in_progress', assignee: 'Ahmad Medhat' },
      { name: 'Procurement', status: 'pending', assignee: 'Procurement Team' },
    ],
    tags: ['Auto-Renewal'], activities: [
      { id: 'a6', type: 'created', actor: 'Ahmad Medhat', timestamp: hoursAgo(5), description: 'Document created' },
    ],
    createdAt: daysAgo(3), modifiedAt: hoursAgo(3), progress: 33,
    waitingFor: { name: 'Ahmad Medhat', since: hoursAgo(3) }, isFavorite: false,
  },
  // ROW 7
  {
    id: '7', name: 'Procurement Contract — Umbrella Corp', stage: 'draft', category: 'Contract',
    owner: 'Ahmad Medhat', counterparty: 'Umbrella Corp',
    participants: [
      { id: 'p13', name: 'Sarah Johnson', email: 'sarah@umbrella.com', role: 'signer', status: 'not_sent' },
      { id: 'p14', name: 'Finance Director', email: 'finance@company.com', role: 'approver', status: 'not_sent' },
      { id: 'p15', name: 'Tom Bradley', email: 'tom@umbrella.com', role: 'viewer', status: 'not_sent' },
    ],
    tags: ['Legal Review'], activities: [
      { id: 'a7', type: 'created', actor: 'Ahmad Medhat', timestamp: hoursAgo(8), description: 'Document created' },
    ],
    createdAt: daysAgo(2), modifiedAt: hoursAgo(8), progress: 0, isFavorite: false,
    waitingFor: { name: 'Ahmad Medhat', since: hoursAgo(8) },
  },
  // ROW 8
  {
    id: '8', name: 'Non-Compete — Sarah Johnson', stage: 'draft', category: 'Agreement',
    owner: 'Ahmad Medhat', counterparty: 'Sarah Johnson',
    participants: [
      { id: 'p16', name: 'Sarah Johnson', email: 'sarah@company.com', role: 'signer', status: 'not_sent' },
      { id: 'p17', name: 'Finance Director', email: 'finance@company.com', role: 'approver', status: 'not_sent' },
    ],
    tags: [], activities: [
      { id: 'a8', type: 'created', actor: 'Ahmad Medhat', timestamp: hoursAgo(12), description: 'Document created' },
    ],
    createdAt: daysAgo(1), modifiedAt: hoursAgo(12), progress: 0, isFavorite: false,
    waitingFor: { name: 'Ahmad Medhat', since: hoursAgo(12) },
  },
  // ROW 9
  {
    id: '9', name: 'Service Agreement — Wayne Enterprises', stage: 'sent', category: 'Agreement',
    owner: 'Ahmad Medhat', counterparty: 'Wayne Enterprises',
    participants: [
      { id: 'p18', name: 'Bruce Wayne', email: 'bruce@wayne.com', role: 'signer', status: 'pending' },
    ],
    tags: ['VIP Client'], activities: [
      { id: 'a9', type: 'sent', actor: 'Ahmad Medhat', timestamp: daysAgo(2), description: 'Document sent for signing' },
    ],
    createdAt: daysAgo(5), modifiedAt: daysAgo(2), progress: 0,
    waitingFor: { name: 'Bruce Wayne', since: daysAgo(2) }, isFavorite: false,
  },
  // ROW 10
  {
    id: '10', name: 'IP Assignment — Contractor', stage: 'sent', category: 'Agreement',
    owner: 'Ahmad Medhat', counterparty: 'Contractor',
    participants: [
      { id: 'p19', name: 'Mark Davis', email: 'mark@contractor.com', role: 'signer', status: 'pending' },
    ],
    tags: [], activities: [
      { id: 'a10', type: 'sent', actor: 'Ahmad Medhat', timestamp: daysAgo(3), description: 'Document sent' },
    ],
    createdAt: daysAgo(6), modifiedAt: daysAgo(3), progress: 0,
    waitingFor: { name: 'Mark Davis', since: daysAgo(3) }, isFavorite: false,
  },
  // ROW 11
  {
    id: '11', name: 'NDA — Stark Industries', stage: 'requires_action', category: 'NDA',
    owner: 'Pepper Potts', counterparty: 'Stark Industries',
    participants: [
      { id: 'p20', name: 'Pepper Potts', email: 'pepper@stark.com', role: 'signer', status: 'signed', signedAt: daysAgo(2) },
      { id: 'p21', name: 'Ahmad Medhat', email: 'ahmed@company.com', role: 'signer', status: 'pending' },
    ],
    tags: ['Urgent'], activities: [
      { id: 'a11', type: 'signed', actor: 'Pepper Potts', timestamp: daysAgo(2), description: 'Pepper Potts signed' },
    ],
    createdAt: daysAgo(5), modifiedAt: daysAgo(1), progress: 50,
    waitingFor: { name: 'Ahmad Medhat', since: daysAgo(1) }, isFavorite: false,
  },
  // ROW 12
  {
    id: '12', name: 'Consulting Agreement — Deloitte', stage: 'requires_action', category: 'Agreement',
    owner: 'Lisa Chen', counterparty: 'Deloitte',
    participants: [
      { id: 'p22', name: 'Lisa Chen', email: 'lisa@deloitte.com', role: 'signer', status: 'signed', signedAt: daysAgo(2) },
      { id: 'p23', name: 'David Park', email: 'david@deloitte.com', role: 'signer', status: 'signed', signedAt: daysAgo(1) },
      { id: 'p24', name: 'Ahmad Medhat', email: 'ahmed@company.com', role: 'signer', status: 'pending' },
    ],
    tags: ['VIP Client'], activities: [
      { id: 'a12', type: 'signed', actor: 'David Park', timestamp: daysAgo(1), description: 'David Park signed' },
    ],
    createdAt: daysAgo(7), modifiedAt: daysAgo(1), progress: 66,
    waitingFor: { name: 'Ahmad Medhat', since: daysAgo(1) }, isFavorite: false,
  },
  // ROW 13
  {
    id: '13', name: 'Non-Compete — Tom Bradley', stage: 'sent', category: 'Agreement',
    owner: 'Ahmad Medhat', counterparty: 'Tom Bradley',
    participants: [
      { id: 'p25', name: 'Tom Bradley', email: 'tom@email.com', role: 'signer', status: 'pending' },
    ],
    tags: [], activities: [
      { id: 'a13', type: 'sent', actor: 'Ahmad Medhat', timestamp: daysAgo(1), description: 'Document sent' },
    ],
    createdAt: daysAgo(4), modifiedAt: daysAgo(1), progress: 0,
    waitingFor: { name: 'Tom Bradley', since: daysAgo(1) }, isFavorite: false,
  },
  // ROW 14 - Completed
  {
    id: '14', name: 'Annual Review — Acme Corp', stage: 'completed', category: 'Contract',
    owner: 'Ahmad Medhat', counterparty: 'Acme Corp',
    participants: [
      { id: 'p26', name: 'John Smith', email: 'john@acme.com', role: 'signer', status: 'signed', signedAt: daysAgo(3) },
      { id: 'p27', name: 'Ahmad Medhat', email: 'ahmed@company.com', role: 'signer', status: 'signed', signedAt: daysAgo(4) },
    ],
    tags: ['VIP Client'], activities: [
      { id: 'a14', type: 'signed', actor: 'John Smith', timestamp: daysAgo(3), description: 'All parties signed' },
    ],
    createdAt: daysAgo(20), modifiedAt: daysAgo(3), progress: 100, isFavorite: false,
  },
  // ROW 14b - Follow-up Amendment (In Signing, linked to Annual Review)
  {
    id: '14b', name: 'Amendment #1 — Annual Review', stage: 'sent', category: 'Amendment' as any,
    owner: 'Ahmad Medhat', counterparty: 'Acme Corp',
    participants: [
      { id: 'p26b', name: 'John Smith', email: 'john@acme.com', role: 'signer', status: 'pending' },
      { id: 'p27b', name: 'Ahmad Medhat', email: 'ahmed@company.com', role: 'signer', status: 'signed', signedAt: daysAgo(1) },
    ],
    tags: [], activities: [
      { id: 'a14b', type: 'sent', actor: 'Ahmad Medhat', timestamp: daysAgo(1), description: 'Amendment sent for signing' },
    ],
    createdAt: daysAgo(2), modifiedAt: daysAgo(1), progress: 50, isFavorite: false,
    waitingFor: { name: 'John Smith', since: daysAgo(1) },
    followUpTo: { id: '14', name: 'Annual Review — Acme Corp' },
  },
  // ROW 15 - Completed
  {
    id: '15', name: 'Freelancer Agreement — John Doe', stage: 'completed', category: 'Agreement',
    owner: 'Ahmad Medhat', counterparty: 'John Doe',
    participants: [
      { id: 'p28', name: 'John Doe', email: 'john.doe@email.com', role: 'signer', status: 'signed', signedAt: daysAgo(5) },
    ],
    tags: [], activities: [
      { id: 'a15', type: 'signed', actor: 'John Doe', timestamp: daysAgo(5), description: 'Document signed' },
    ],
    createdAt: daysAgo(15), modifiedAt: daysAgo(5), progress: 100, isFavorite: false,
  },
  // ROW 16 - Completed
  {
    id: '16', name: 'Board Resolution 2026', stage: 'completed', category: 'Resolution',
    owner: 'Ahmad Medhat',
    participants: [
      { id: 'p29', name: 'Board Member A', email: 'a@board.com', role: 'signer', status: 'signed', signedAt: daysAgo(7) },
      { id: 'p30', name: 'Board Member B', email: 'b@board.com', role: 'signer', status: 'signed', signedAt: daysAgo(8) },
    ],
    tags: [], activities: [
      { id: 'a16', type: 'signed', actor: 'Board Member A', timestamp: daysAgo(7), description: 'All signatures completed' },
    ],
    createdAt: daysAgo(30), modifiedAt: daysAgo(7), progress: 100, isFavorite: false,
  },
  // ROW 17 - Completed
  {
    id: '17', name: 'IP Assignment — TechFlow', stage: 'completed', category: 'Agreement',
    owner: 'Ahmad Medhat', counterparty: 'TechFlow',
    participants: [
      { id: 'p31', name: 'Lisa Wang', email: 'lisa@techflow.dev', role: 'signer', status: 'signed', signedAt: daysAgo(10) },
    ],
    tags: [], activities: [
      { id: 'a17', type: 'signed', actor: 'Lisa Wang', timestamp: daysAgo(10), description: 'Document signed' },
    ],
    createdAt: daysAgo(20), modifiedAt: daysAgo(10), progress: 100, isFavorite: false,
  },
  // ROW 18 - Completed
  {
    id: '18', name: 'Partnership Agreement — Meridian', stage: 'completed', category: 'Agreement',
    owner: 'Ahmad Medhat', counterparty: 'Meridian Group',
    participants: [
      { id: 'p32', name: 'Mark Stevens', email: 'mark@meridian.com', role: 'signer', status: 'signed', signedAt: daysAgo(6) },
      { id: 'p33', name: 'Ahmad Medhat', email: 'ahmed@company.com', role: 'signer', status: 'signed', signedAt: daysAgo(7) },
    ],
    tags: [], activities: [
      { id: 'a18', type: 'signed', actor: 'Mark Stevens', timestamp: daysAgo(6), description: 'All parties signed' },
    ],
    createdAt: daysAgo(18), modifiedAt: daysAgo(6), progress: 100, isFavorite: false,
  },
  // ROW 19 - Declined
  {
    id: '19', name: 'Vendor Terms — VendorX', stage: 'declined', category: 'Contract',
    owner: 'Ahmad Medhat', counterparty: 'VendorX',
    participants: [
      { id: 'p34', name: 'Vendor Contact', email: 'contact@vendorx.com', role: 'signer', status: 'declined' },
    ],
    tags: [], activities: [
      { id: 'a19', type: 'declined', actor: 'Vendor Contact', timestamp: daysAgo(4), description: 'Signer declined' },
    ],
    createdAt: daysAgo(15), modifiedAt: daysAgo(4), progress: 0, isFavorite: false,
  },
  // ROW 20 - Declined
  {
    id: '20', name: 'Rejected Procurement — SupplierZ', stage: 'declined', category: 'Contract',
    owner: 'Ahmad Medhat', counterparty: 'SupplierZ',
    participants: [
      { id: 'p35', name: 'Supplier Contact', email: 'contact@supplierz.com', role: 'signer', status: 'declined' },
    ],
    tags: [], activities: [
      { id: 'a20', type: 'declined', actor: 'Supplier Contact', timestamp: daysAgo(3), description: 'Supplier declined terms' },
    ],
    createdAt: daysAgo(18), modifiedAt: daysAgo(3), progress: 0, isFavorite: false,
  },
  // ROW 21 - Voided
  {
    id: '21', name: 'Old NDA — OldPartner LLC', stage: 'voided', category: 'NDA',
    owner: 'Ahmad Medhat', counterparty: 'OldPartner LLC',
    participants: [
      { id: 'p36', name: 'Old Partner', email: 'partner@old.com', role: 'signer', status: 'not_sent' },
    ],
    tags: [], activities: [
      { id: 'a21', type: 'voided', actor: 'Ahmad Medhat', timestamp: daysAgo(6), description: 'Document voided' },
    ],
    createdAt: daysAgo(30), modifiedAt: daysAgo(6), progress: 0, isFavorite: false,
  },
  // ROW 22 - Voided
  {
    id: '22', name: 'Cancelled Agreement — TempCo', stage: 'voided', category: 'Agreement',
    owner: 'Ahmad Medhat', counterparty: 'TempCo',
    participants: [
      { id: 'p37', name: 'Temp Contact', email: 'temp@tempco.com', role: 'signer', status: 'not_sent' },
    ],
    tags: [], activities: [
      { id: 'a22', type: 'voided', actor: 'Ahmad Medhat', timestamp: daysAgo(8), description: 'Document voided' },
    ],
    createdAt: daysAgo(25), modifiedAt: daysAgo(8), progress: 0, isFavorite: false,
  },
  // ROW 23 - Expired
  {
    id: '23', name: 'Expired Lease Option — PropertyCo', stage: 'expired', category: 'Contract',
    owner: 'Ahmad Medhat', counterparty: 'PropertyCo',
    participants: [
      { id: 'p38', name: 'Property Owner', email: 'owner@propertyco.com', role: 'signer', status: 'pending' },
    ],
    tags: [], activities: [
      { id: 'a23', type: 'expired', actor: 'System', timestamp: daysAgo(2), description: 'Document expired' },
    ],
    createdAt: daysAgo(28), modifiedAt: daysAgo(2), expiresAt: daysAgo(2), progress: 0, isFavorite: false,
  },
  // ROW 24 - Expired
  {
    id: '24', name: 'Lapsed Insurance Cert — InsureCo', stage: 'expired', category: 'Certificate',
    owner: 'Ahmad Medhat', counterparty: 'InsureCo',
    participants: [
      { id: 'p39', name: 'Insurance Agent', email: 'agent@insureco.com', role: 'signer', status: 'pending' },
    ],
    tags: [], activities: [
      { id: 'a24', type: 'expired', actor: 'System', timestamp: daysAgo(1), description: 'Certificate expired' },
    ],
    createdAt: daysAgo(25), modifiedAt: daysAgo(1), expiresAt: daysAgo(1), progress: 0, isFavorite: false,
  },
  // ROW 25 - Expired
  {
    id: '25', name: 'Expired NDA — DataCorp', stage: 'expired', category: 'NDA',
    owner: 'Ahmad Medhat', counterparty: 'DataCorp',
    participants: [
      { id: 'p40', name: 'Data Officer', email: 'data@datacorp.com', role: 'signer', status: 'pending' },
    ],
    tags: [], activities: [
      { id: 'a25', type: 'expired', actor: 'System', timestamp: daysAgo(5), description: 'Document expired' },
    ],
    createdAt: daysAgo(35), modifiedAt: daysAgo(5), expiresAt: daysAgo(5), progress: 0, isFavorite: false,
  },
];
