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

export const workspaceDocuments: WorkspaceDocument[] = [
  // DRAFT (5)
  {
    id: '1', name: 'Acme Corp Master Services Agreement', stage: 'draft', category: 'Contract',
    owner: 'Ahmed Medhat', counterparty: 'Acme Corp',
    participants: [
      { id: 'p1', name: 'John Smith', email: 'john@acme.com', role: 'signer', status: 'not_sent' },
      { id: 'p2', name: 'Jane Doe', email: 'jane@acme.com', role: 'signer', status: 'not_sent' },
    ],
    tags: ['VIP client'], folder: undefined, activities: [
      { id: 'a1', type: 'created', actor: 'Ahmed Medhat', timestamp: daysAgo(2), description: 'Document created' },
    ],
    createdAt: daysAgo(2), modifiedAt: hoursAgo(3), progress: 0, isFavorite: true,
  },
  {
    id: '2', name: 'CloudVault NDA', stage: 'draft', category: 'NDA',
    owner: 'Ahmed Medhat', counterparty: 'CloudVault Inc',
    participants: [
      { id: 'p3', name: 'Mike Chen', email: 'mike@cloudvault.io', role: 'signer', status: 'not_sent' },
    ],
    tags: ['NDA'], activities: [
      { id: 'a2', type: 'created', actor: 'Ahmed Medhat', timestamp: daysAgo(1), description: 'Document created' },
    ],
    createdAt: daysAgo(1), modifiedAt: hoursAgo(6), progress: 0, isFavorite: false,
  },
  {
    id: '3', name: 'TechFlow Consulting Agreement', stage: 'draft', category: 'Agreement',
    owner: 'Ahmed Medhat', counterparty: 'TechFlow',
    participants: [
      { id: 'p4', name: 'Lisa Wang', email: 'lisa@techflow.dev', role: 'signer', status: 'not_sent' },
      { id: 'p5', name: 'Tom Harris', email: 'tom@techflow.dev', role: 'viewer', status: 'not_sent' },
    ],
    tags: [], activities: [
      { id: 'a3', type: 'created', actor: 'Ahmed Medhat', timestamp: daysAgo(5), description: 'Document created' },
    ],
    createdAt: daysAgo(5), modifiedAt: daysAgo(1), progress: 0, isFavorite: false,
  },
  {
    id: '4', name: 'HR Onboarding Package Q2', stage: 'draft', category: 'HR',
    owner: 'Ahmed Medhat', folder: 'HR Onboarding',
    participants: [
      { id: 'p6', name: 'Emily Davis', email: 'emily@company.com', role: 'signer', status: 'not_sent' },
      { id: 'p7', name: 'Robert Kim', email: 'robert@company.com', role: 'approver', status: 'not_sent' },
    ],
    tags: [], activities: [
      { id: 'a4', type: 'created', actor: 'Ahmed Medhat', timestamp: daysAgo(3), description: 'Document created' },
    ],
    createdAt: daysAgo(3), modifiedAt: daysAgo(2), progress: 0, isFavorite: false,
  },
  {
    id: '5', name: 'Procurement Framework 2026', stage: 'draft', category: 'Contract',
    owner: 'Ahmed Medhat', folder: 'Procurement',
    participants: [
      { id: 'p8', name: 'Diana Ross', email: 'diana@vendor.com', role: 'signer', status: 'not_sent' },
      { id: 'p9', name: 'Sam Wilson', email: 'sam@company.com', role: 'approver', status: 'not_sent' },
      { id: 'p10', name: 'Alex Turner', email: 'alex@company.com', role: 'viewer', status: 'not_sent' },
    ],
    tags: [], activities: [
      { id: 'a5', type: 'created', actor: 'Ahmed Medhat', timestamp: daysAgo(7), description: 'Document created' },
    ],
    createdAt: daysAgo(7), modifiedAt: daysAgo(4), progress: 0, isFavorite: true,
  },
  // APPROVAL CYCLE (4)
  {
    id: '6', name: 'Enterprise License Agreement', stage: 'approving', category: 'Contract',
    owner: 'Ahmed Medhat', counterparty: 'Enterprise Corp',
    workflow: 'Standard NDA Approval', workflowStep: 'Legal Review',
    participants: [
      { id: 'p11', name: 'Legal Team', email: 'legal@company.com', role: 'approver', status: 'pending' },
      { id: 'p12', name: 'CFO Office', email: 'cfo@company.com', role: 'approver', status: 'not_sent' },
    ],
    approvalSteps: [
      { name: 'Manager Approval', status: 'completed', assignee: 'Sarah Johnson' },
      { name: 'Legal Review', status: 'in_progress', assignee: 'Legal Team' },
      { name: 'CFO Sign-off', status: 'pending', assignee: 'CFO Office' },
    ],
    tags: [], activities: [
      { id: 'a6', type: 'created', actor: 'Ahmed Medhat', timestamp: daysAgo(10), description: 'Document created' },
      { id: 'a7', type: 'approved', actor: 'Sarah Johnson', timestamp: daysAgo(5), description: 'Manager approval completed' },
    ],
    createdAt: daysAgo(10), modifiedAt: daysAgo(2), progress: 33,
    waitingFor: { name: 'Legal Team', since: hoursAgo(48) }, isFavorite: false,
  },
  {
    id: '7', name: 'Vendor Onboarding Contract', stage: 'approving', category: 'Contract',
    owner: 'Ahmed Medhat', counterparty: 'Vendor Co',
    workflow: 'Procurement Approval', workflowStep: 'Procurement Review',
    participants: [
      { id: 'p13', name: 'Procurement Lead', email: 'proc@company.com', role: 'approver', status: 'pending' },
    ],
    approvalSteps: [
      { name: 'Procurement Review', status: 'in_progress', assignee: 'Procurement Lead' },
      { name: 'Finance Check', status: 'pending', assignee: 'Finance Team' },
    ],
    tags: [], folder: 'Procurement', activities: [
      { id: 'a8', type: 'created', actor: 'Ahmed Medhat', timestamp: daysAgo(6), description: 'Document created' },
    ],
    createdAt: daysAgo(6), modifiedAt: daysAgo(1), progress: 25,
    waitingFor: { name: 'Procurement Lead', since: hoursAgo(24) }, isFavorite: false,
  },
  {
    id: '8', name: 'Partnership MOU', stage: 'approved', category: 'Agreement',
    owner: 'Ahmed Medhat', counterparty: 'Partner Inc',
    workflow: 'Enterprise Contract Review',
    participants: [
      { id: 'p14', name: 'VP Sales', email: 'vp@company.com', role: 'approver', status: 'signed' },
      { id: 'p15', name: 'Partner Rep', email: 'rep@partner.com', role: 'signer', status: 'not_sent' },
    ],
    approvalSteps: [
      { name: 'Sales Review', status: 'completed', assignee: 'VP Sales' },
      { name: 'Legal Review', status: 'completed', assignee: 'Legal Team' },
    ],
    tags: [], activities: [
      { id: 'a9', type: 'approved', actor: 'Legal Team', timestamp: daysAgo(1), description: 'All approvals completed' },
    ],
    createdAt: daysAgo(14), modifiedAt: daysAgo(1), progress: 100, isFavorite: false,
  },
  {
    id: '9', name: 'Data Processing Agreement', stage: 'approving', category: 'NDA',
    owner: 'Ahmed Medhat', counterparty: 'DataCorp',
    workflow: 'Standard NDA Approval', workflowStep: 'Compliance Review',
    participants: [
      { id: 'p16', name: 'Compliance Officer', email: 'compliance@company.com', role: 'approver', status: 'pending' },
    ],
    approvalSteps: [
      { name: 'Legal Review', status: 'completed', assignee: 'Legal Team' },
      { name: 'Compliance Review', status: 'in_progress', assignee: 'Compliance Officer' },
    ],
    tags: ['NDA'], activities: [
      { id: 'a10', type: 'created', actor: 'Ahmed Medhat', timestamp: daysAgo(8), description: 'Document created' },
    ],
    createdAt: daysAgo(8), modifiedAt: daysAgo(2), progress: 50,
    waitingFor: { name: 'Compliance Officer', since: hoursAgo(36) }, isFavorite: false,
  },
  // IN SIGNING (6)
  {
    id: '10', name: 'Office Lease Renewal', stage: 'sent', category: 'Contract',
    owner: 'Ahmed Medhat', counterparty: 'BuildingCo LLC',
    participants: [
      { id: 'p17', name: 'Landlord Rep', email: 'rep@buildingco.com', role: 'signer', status: 'pending' },
      { id: 'p18', name: 'Property Manager', email: 'pm@buildingco.com', role: 'signer', status: 'pending' },
    ],
    tags: ['renewal'], activities: [
      { id: 'a11', type: 'sent', actor: 'Ahmed Medhat', timestamp: daysAgo(3), description: 'Document sent for signing' },
    ],
    createdAt: daysAgo(7), modifiedAt: daysAgo(3), progress: 0,
    waitingFor: { name: 'Landlord Rep', since: hoursAgo(72) }, isFavorite: false,
  },
  {
    id: '11', name: 'Employee Offer Letter — Sarah', stage: 'partially_signed', category: 'HR',
    owner: 'Ahmed Medhat', counterparty: 'Sarah Martinez',
    participants: [
      { id: 'p19', name: 'Ahmed Medhat', email: 'ahmed@company.com', role: 'signer', status: 'signed', signedAt: daysAgo(2) },
      { id: 'p20', name: 'Sarah Martinez', email: 'sarah.m@email.com', role: 'signer', status: 'pending' },
    ],
    tags: [], folder: 'HR Onboarding', activities: [
      { id: 'a12', type: 'signed', actor: 'Ahmed Medhat', timestamp: daysAgo(2), description: 'Ahmed Medhat signed' },
      { id: 'a13', type: 'sent', actor: 'System', timestamp: daysAgo(2), description: 'Sent to Sarah Martinez' },
    ],
    createdAt: daysAgo(5), modifiedAt: daysAgo(2), progress: 50,
    waitingFor: { name: 'Sarah Martinez', since: hoursAgo(48) }, isFavorite: true,
  },
  {
    id: '12', name: 'Mutual NDA — Meridian', stage: 'waiting', category: 'NDA',
    owner: 'Ahmed Medhat', counterparty: 'Meridian Group',
    participants: [
      { id: 'p21', name: 'Mark Stevens', email: 'mark@meridian.com', role: 'signer', status: 'viewed', viewedAt: hoursAgo(4) },
      { id: 'p22', name: 'Laura Chen', email: 'laura@meridian.com', role: 'signer', status: 'pending' },
    ],
    tags: ['NDA'], activities: [
      { id: 'a14', type: 'viewed', actor: 'Mark Stevens', timestamp: hoursAgo(4), description: 'Mark Stevens viewed the document' },
    ],
    createdAt: daysAgo(4), modifiedAt: hoursAgo(4), progress: 0,
    waitingFor: { name: 'Mark Stevens', since: hoursAgo(4) }, isFavorite: false,
  },
  {
    id: '13', name: 'Service Level Agreement', stage: 'requires_action', category: 'Agreement',
    owner: 'Sarah Johnson', counterparty: 'Company',
    participants: [
      { id: 'p23', name: 'Sarah Johnson', email: 'sarah@vendor.com', role: 'signer', status: 'signed', signedAt: daysAgo(1) },
      { id: 'p24', name: 'Ahmed Medhat', email: 'ahmed@company.com', role: 'signer', status: 'pending' },
    ],
    tags: ['urgent'], activities: [
      { id: 'a15', type: 'signed', actor: 'Sarah Johnson', timestamp: daysAgo(1), description: 'Sarah Johnson signed' },
      { id: 'a16', type: 'reminder', actor: 'System', timestamp: hoursAgo(6), description: 'Reminder sent to Ahmed Medhat' },
    ],
    createdAt: daysAgo(6), modifiedAt: daysAgo(1), progress: 50,
    waitingFor: { name: 'You', since: hoursAgo(24) }, isFavorite: false,
  },
  {
    id: '14', name: 'Consulting SOW Q2', stage: 'expiring', category: 'SOW',
    owner: 'Ahmed Medhat', counterparty: 'ConsultCo',
    participants: [
      { id: 'p25', name: 'Dan Brown', email: 'dan@consultco.com', role: 'signer', status: 'pending' },
      { id: 'p26', name: 'Eve White', email: 'eve@consultco.com', role: 'viewer', status: 'viewed' },
    ],
    tags: [], activities: [
      { id: 'a17', type: 'sent', actor: 'Ahmed Medhat', timestamp: daysAgo(12), description: 'Document sent' },
      { id: 'a18', type: 'reminder', actor: 'System', timestamp: daysAgo(1), description: 'Expiry reminder sent' },
    ],
    createdAt: daysAgo(14), modifiedAt: daysAgo(1), expiresAt: daysAgo(-3), progress: 0,
    waitingFor: { name: 'Dan Brown', since: hoursAgo(288) }, isFavorite: false,
  },
  {
    id: '15', name: 'Amendment #3 — CloudVault', stage: 'waiting', category: 'Amendment',
    owner: 'Ahmed Medhat', counterparty: 'CloudVault Inc',
    participants: [
      { id: 'p27', name: 'Mike Chen', email: 'mike@cloudvault.io', role: 'signer', status: 'pending' },
      { id: 'p28', name: 'Amy Liu', email: 'amy@cloudvault.io', role: 'signer', status: 'pending' },
      { id: 'p29', name: 'James Park', email: 'james@company.com', role: 'viewer', status: 'viewed' },
    ],
    tags: [], activities: [
      { id: 'a19', type: 'sent', actor: 'Ahmed Medhat', timestamp: daysAgo(2), description: 'Document sent for signing' },
    ],
    createdAt: daysAgo(3), modifiedAt: daysAgo(2), progress: 0,
    waitingFor: { name: 'Mike Chen', since: hoursAgo(48) }, isFavorite: false,
  },
  // COMPLETED (5)
  {
    id: '16', name: 'Annual Review — Acme Corp', stage: 'completed', category: 'Contract',
    owner: 'Ahmed Medhat', counterparty: 'Acme Corp',
    participants: [
      { id: 'p30', name: 'John Smith', email: 'john@acme.com', role: 'signer', status: 'signed', signedAt: daysAgo(3) },
      { id: 'p31', name: 'Ahmed Medhat', email: 'ahmed@company.com', role: 'signer', status: 'signed', signedAt: daysAgo(4) },
    ],
    tags: ['VIP client'], activities: [
      { id: 'a20', type: 'signed', actor: 'John Smith', timestamp: daysAgo(3), description: 'All parties signed' },
    ],
    createdAt: daysAgo(20), modifiedAt: daysAgo(3), progress: 100, isFavorite: true,
  },
  {
    id: '17', name: 'Freelancer Agreement — John', stage: 'completed', category: 'Agreement',
    owner: 'Ahmed Medhat', counterparty: 'John Doe',
    participants: [
      { id: 'p32', name: 'John Doe', email: 'john.doe@email.com', role: 'signer', status: 'signed', signedAt: daysAgo(5) },
    ],
    tags: [], activities: [
      { id: 'a21', type: 'signed', actor: 'John Doe', timestamp: daysAgo(5), description: 'Document signed' },
    ],
    createdAt: daysAgo(15), modifiedAt: daysAgo(5), progress: 100, isFavorite: false,
  },
  {
    id: '18', name: 'Board Resolution 2026', stage: 'completed', category: 'Resolution',
    owner: 'Ahmed Medhat',
    participants: [
      { id: 'p33', name: 'Board Member A', email: 'a@board.com', role: 'signer', status: 'signed', signedAt: daysAgo(7) },
      { id: 'p34', name: 'Board Member B', email: 'b@board.com', role: 'signer', status: 'signed', signedAt: daysAgo(8) },
      { id: 'p35', name: 'Board Member C', email: 'c@board.com', role: 'signer', status: 'signed', signedAt: daysAgo(9) },
    ],
    tags: [], activities: [
      { id: 'a22', type: 'signed', actor: 'Board Member A', timestamp: daysAgo(7), description: 'Final signature completed' },
    ],
    createdAt: daysAgo(30), modifiedAt: daysAgo(7), progress: 100, isFavorite: false,
  },
  {
    id: '19', name: 'IP Assignment — TechFlow', stage: 'completed', category: 'Agreement',
    owner: 'Ahmed Medhat', counterparty: 'TechFlow',
    participants: [
      { id: 'p36', name: 'Lisa Wang', email: 'lisa@techflow.dev', role: 'signer', status: 'signed', signedAt: daysAgo(10) },
    ],
    tags: ['assignment'], activities: [
      { id: 'a23', type: 'signed', actor: 'Lisa Wang', timestamp: daysAgo(10), description: 'Document signed' },
    ],
    createdAt: daysAgo(20), modifiedAt: daysAgo(10), progress: 100, isFavorite: false,
  },
  {
    id: '20', name: 'Arbitration Agreement', stage: 'completed', category: 'Agreement',
    owner: 'Ahmed Medhat',
    participants: [
      { id: 'p37', name: 'Client Rep', email: 'client@email.com', role: 'signer', status: 'signed', signedAt: daysAgo(12) },
      { id: 'p38', name: 'Ahmed Medhat', email: 'ahmed@company.com', role: 'signer', status: 'signed', signedAt: daysAgo(13) },
    ],
    tags: ['arbitration'], activities: [
      { id: 'a24', type: 'signed', actor: 'Client Rep', timestamp: daysAgo(12), description: 'All parties signed' },
    ],
    createdAt: daysAgo(25), modifiedAt: daysAgo(12), progress: 100, isFavorite: false,
  },
  // FAILED (5)
  {
    id: '21', name: 'Vendor Terms — Declined', stage: 'declined', category: 'Contract',
    owner: 'Ahmed Medhat', counterparty: 'VendorX',
    participants: [
      { id: 'p39', name: 'Vendor Contact', email: 'contact@vendorx.com', role: 'signer', status: 'declined' },
    ],
    tags: [], activities: [
      { id: 'a25', type: 'declined', actor: 'Vendor Contact', timestamp: daysAgo(4), description: 'Signer declined to sign' },
    ],
    createdAt: daysAgo(15), modifiedAt: daysAgo(4), progress: 0, isFavorite: false,
  },
  {
    id: '22', name: 'Old NDA — Voided', stage: 'voided', category: 'NDA',
    owner: 'Ahmed Medhat', counterparty: 'OldPartner LLC',
    participants: [
      { id: 'p40', name: 'Old Partner', email: 'partner@old.com', role: 'signer', status: 'not_sent' },
    ],
    tags: ['NDA'], activities: [
      { id: 'a26', type: 'voided', actor: 'Ahmed Medhat', timestamp: daysAgo(6), description: 'Document voided by sender' },
    ],
    createdAt: daysAgo(30), modifiedAt: daysAgo(6), progress: 0, isFavorite: false,
  },
  {
    id: '23', name: 'Expired Lease Option', stage: 'expired', category: 'Contract',
    owner: 'Ahmed Medhat', counterparty: 'PropertyCo',
    participants: [
      { id: 'p41', name: 'Property Owner', email: 'owner@propertyco.com', role: 'signer', status: 'pending' },
    ],
    tags: [], activities: [
      { id: 'a27', type: 'expired', actor: 'System', timestamp: daysAgo(2), description: 'Document expired' },
    ],
    createdAt: daysAgo(28), modifiedAt: daysAgo(2), expiresAt: daysAgo(2), progress: 0, isFavorite: false,
  },
  {
    id: '24', name: 'Rejected Procurement', stage: 'declined', category: 'Contract',
    owner: 'Ahmed Medhat', counterparty: 'SupplierZ',
    participants: [
      { id: 'p42', name: 'Supplier Contact', email: 'contact@supplierz.com', role: 'signer', status: 'declined' },
      { id: 'p43', name: 'Ahmed Medhat', email: 'ahmed@company.com', role: 'signer', status: 'signed', signedAt: daysAgo(10) },
    ],
    tags: [], folder: 'Procurement', activities: [
      { id: 'a28', type: 'declined', actor: 'Supplier Contact', timestamp: daysAgo(3), description: 'Supplier declined terms' },
    ],
    createdAt: daysAgo(18), modifiedAt: daysAgo(3), progress: 50, isFavorite: false,
  },
  {
    id: '25', name: 'Lapsed Insurance Cert', stage: 'expired', category: 'Certificate',
    owner: 'Ahmed Medhat', counterparty: 'InsureCo',
    participants: [
      { id: 'p44', name: 'Insurance Agent', email: 'agent@insureco.com', role: 'signer', status: 'pending' },
      { id: 'p45', name: 'Risk Manager', email: 'risk@company.com', role: 'viewer', status: 'viewed' },
    ],
    tags: [], activities: [
      { id: 'a29', type: 'expired', actor: 'System', timestamp: daysAgo(1), description: 'Certificate expired' },
    ],
    createdAt: daysAgo(25), modifiedAt: daysAgo(1), expiresAt: daysAgo(1), progress: 0, isFavorite: false,
  },
];
