export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  gradient: string;
  pageCount: number;
  source?: "user" | "library";
  subtitle?: string;
  sharedBy?: string;
  sharedByInitials?: string;
  isShared?: boolean;
}

export const libraryTemplates: Template[] = [
  { id: "lib-1", name: "Sales Proposal", description: "Professional sales proposal with pricing tables and deliverables section.", category: "Sales Proposals", gradient: "from-blue-500 to-blue-600", source: "library", pageCount: 8 },
  { id: "lib-2", name: "NDA Agreement", description: "Standard non-disclosure agreement for protecting confidential information.", category: "Non-Disclosure", gradient: "from-emerald-500 to-emerald-600", source: "library", pageCount: 4 },
  { id: "lib-3", name: "Service Contract", description: "Detailed service contract with terms, conditions, and SLA definitions.", category: "Service Contracts", gradient: "from-violet-500 to-violet-600", source: "library", pageCount: 12 },
  { id: "lib-4", name: "Invoice", description: "Clean invoice template with line items, taxes, and payment terms.", category: "Financial Reports", gradient: "from-amber-500 to-amber-600", source: "library", pageCount: 2 },
  { id: "lib-5", name: "Employment Offer", description: "Job offer letter with compensation details and start date.", category: "Employment Offers", gradient: "from-rose-500 to-rose-600", source: "library", pageCount: 3 },
  { id: "lib-6", name: "Project Scope", description: "Project scope document outlining objectives, timeline, and resources.", category: "Sales Proposals", gradient: "from-cyan-500 to-cyan-600", source: "library", pageCount: 6 },
  { id: "lib-7", name: "Vendor Agreement", description: "Vendor partnership agreement with payment schedules and obligations.", category: "Vendor Agreements", gradient: "from-indigo-500 to-indigo-600", source: "library", pageCount: 10 },
  { id: "lib-8", name: "Mutual NDA", description: "Bilateral non-disclosure agreement for two-party confidentiality.", category: "Non-Disclosure", gradient: "from-teal-500 to-teal-600", source: "library", pageCount: 5 },
  { id: "lib-9", name: "Consulting Agreement", description: "Consulting services agreement with hourly rates and project milestones.", category: "Consulting Services", gradient: "from-pink-500 to-pink-600", source: "library", pageCount: 7 },
  { id: "lib-10", name: "Real Estate Lease", description: "Residential or commercial property lease agreement with standard clauses.", category: "Commercial Leases", gradient: "from-orange-500 to-orange-600", source: "library", pageCount: 14 },
  { id: "lib-11", name: "HIPAA Business Associate", description: "Business associate agreement for HIPAA-covered healthcare entities.", category: "Healthcare Forms", gradient: "from-sky-500 to-sky-600", source: "library", pageCount: 6 },
  { id: "lib-12", name: "Insurance Claim Form", description: "Standard insurance claim submission form with supporting fields.", category: "Insurance Claims", gradient: "from-lime-500 to-lime-600", source: "library", pageCount: 3 },
  { id: "lib-13", name: "Purchase Order", description: "Procurement purchase order with line items, delivery terms, and approvals.", category: "Purchase Orders", gradient: "from-yellow-500 to-yellow-600", source: "library", pageCount: 2 },
  { id: "lib-14", name: "Marketing Brief", description: "Campaign brief covering objectives, audience, messaging, and timelines.", category: "Marketing Agreements", gradient: "from-fuchsia-500 to-fuchsia-600", source: "library", pageCount: 5 },
];

export const userTemplates: Template[] = [
  { id: "user-1", name: "My Sales Proposal", description: "Custom sales proposal tailored for enterprise clients.", category: "Sales Proposals", gradient: "", source: "user", subtitle: "Created by you", pageCount: 6 },
  { id: "user-2", name: "Standard NDA v2", description: "Team-approved NDA with updated confidentiality clauses.", category: "Non-Disclosure", gradient: "", source: "user", subtitle: "Team template", pageCount: 4 },
  { id: "user-3", name: "Client Service Agreement", description: "Service agreement for long-term client engagements.", category: "Service Contracts", gradient: "", source: "user", subtitle: "Created by you", pageCount: 9 },
  { id: "user-4", name: "Monthly Invoice", description: "Recurring invoice template for monthly billing cycles.", category: "Financial Reports", gradient: "", source: "user", subtitle: "Created by you", pageCount: 1 },
  { id: "user-5", name: "Consulting SOW", description: "Statement of work for consulting engagements and deliverables.", category: "Sales Proposals", gradient: "", source: "user", subtitle: "Team template", pageCount: 5 },
  { id: "user-6", name: "Vendor Agreement", description: "Vendor onboarding agreement with customized payment terms.", category: "Service Contracts", gradient: "", source: "user", subtitle: "Created by you", pageCount: 8 },
];

export const sharedTemplates: Template[] = [
  { id: "shared-1", name: "Q1 Sales Proposal", description: "Quarterly sales proposal for enterprise accounts.", category: "Sales Proposals", gradient: "", source: "user", subtitle: "Shared by Sarah M.", isShared: true, sharedBy: "Sarah M.", sharedByInitials: "SM", pageCount: 7 },
  { id: "shared-2", name: "Master Services Agreement", description: "Comprehensive MSA for long-term client partnerships.", category: "Service Contracts", gradient: "", source: "user", subtitle: "Shared by David K.", isShared: true, sharedBy: "David K.", sharedByInitials: "DK", pageCount: 15 },
  { id: "shared-3", name: "Executive NDA", description: "Executive-level NDA for board and leadership discussions.", category: "Non-Disclosure", gradient: "", source: "user", subtitle: "Shared by Lisa R.", isShared: true, sharedBy: "Lisa R.", sharedByInitials: "LR", pageCount: 3 },
  { id: "shared-4", name: "Quarterly Report Template", description: "Standardized quarterly financial report format.", category: "Financial Reports", gradient: "", source: "user", subtitle: "Shared by James T.", isShared: true, sharedBy: "James T.", sharedByInitials: "JT", pageCount: 10 },
];

export const templates: Template[] = [...libraryTemplates, ...userTemplates];

export const allCategories = [
  "All",
  "Sales Proposals",
  "Service Contracts",
  "Non-Disclosure",
  "Employment Offers",
  "Commercial Leases",
  "Purchase Orders",
  "Vendor Agreements",
  "Consulting Services",
  "Partnership Agreements",
  "Licensing Deals",
  "Insurance Claims",
  "Healthcare Forms",
  "Real Estate Closings",
  "Construction Contracts",
  "Financial Reports",
  "Marketing Agreements",
  "Procurement Forms",
  "Government Contracts",
  "Education Documents",
  "Technology Agreements",
  "Compliance Documents",
  "Intellectual Property",
  "Merger Acquisitions",
];

export const quickFilterCategories = [
  "All",
  "Sales Proposals",
  "Service Contracts",
  "Non-Disclosure",
  "Employment Offers",
  "Commercial Leases",
  "Purchase Orders",
];

export const libraryCategories = allCategories;

export const myTemplateCategories = ["All", "Service Contracts", "Sales Proposals", "Non-Disclosure", "Financial Reports"];

export const categories = myTemplateCategories;

export const categoryBadgeMap: Record<string, string> = {
  "Sales Proposal": "Proposal",
  "NDA Agreement": "Legal",
  "Service Contract": "Contract",
  "Invoice": "Finance",
  "Employment Offer": "HR",
  "Project Scope": "Project",
  "Vendor Agreement": "Legal",
  "Mutual NDA": "Legal",
  "Consulting Agreement": "Contract",
  "Real Estate Lease": "Real Estate",
  "HIPAA Business Associate": "Healthcare",
  "Insurance Claim Form": "Insurance",
  "Purchase Order": "Procurement",
  "Marketing Brief": "Marketing",
};
