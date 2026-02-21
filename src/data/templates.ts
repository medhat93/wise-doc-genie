export interface Template {
  id: string;
  name: string;
  description?: string;
  category?: string;
  gradient: string;
  pageCount: number;
  source?: "user" | "library";
  subtitle?: string;
  sharedBy?: string;
  sharedByInitials?: string;
  isShared?: boolean;
}

const libGradients = [
  "from-blue-500 to-blue-600",
  "from-emerald-500 to-emerald-600",
  "from-violet-500 to-violet-600",
  "from-amber-500 to-amber-600",
  "from-rose-500 to-rose-600",
  "from-cyan-500 to-cyan-600",
  "from-indigo-500 to-indigo-600",
  "from-teal-500 to-teal-600",
  "from-pink-500 to-pink-600",
  "from-orange-500 to-orange-600",
  "from-sky-500 to-sky-600",
  "from-lime-500 to-lime-600",
  "from-yellow-500 to-yellow-600",
  "from-fuchsia-500 to-fuchsia-600",
];

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
  // Additional library templates for pagination
  { id: "lib-15", name: "Software License Agreement", description: "End-user license agreement for software products and SaaS platforms.", category: "Technology Agreements", gradient: "from-blue-500 to-blue-600", source: "library", pageCount: 8 },
  { id: "lib-16", name: "Data Processing Agreement", description: "GDPR-compliant data processing agreement for third-party processors.", category: "Compliance Documents", gradient: "from-emerald-500 to-emerald-600", source: "library", pageCount: 11 },
  { id: "lib-17", name: "Franchise Agreement", description: "Franchise licensing agreement with territorial rights and royalty terms.", category: "Licensing Deals", gradient: "from-violet-500 to-violet-600", source: "library", pageCount: 18 },
  { id: "lib-18", name: "Construction Contract", description: "General contractor agreement with scope, milestones, and liability clauses.", category: "Construction Contracts", gradient: "from-amber-500 to-amber-600", source: "library", pageCount: 14 },
  { id: "lib-19", name: "Partnership Agreement", description: "Business partnership agreement defining roles, equity, and profit-sharing.", category: "Partnership Agreements", gradient: "from-rose-500 to-rose-600", source: "library", pageCount: 9 },
  { id: "lib-20", name: "Power of Attorney", description: "Legal document granting authority to act on someone's behalf.", category: "Compliance Documents", gradient: "from-cyan-500 to-cyan-600", source: "library", pageCount: 3 },
  { id: "lib-21", name: "Cease and Desist Letter", description: "Formal demand to stop infringing activity with legal consequences outlined.", category: "Intellectual Property", gradient: "from-indigo-500 to-indigo-600", source: "library", pageCount: 2 },
  { id: "lib-22", name: "Sublease Agreement", description: "Agreement for subleasing commercial or residential property to a third party.", category: "Commercial Leases", gradient: "from-teal-500 to-teal-600", source: "library", pageCount: 7 },
  { id: "lib-23", name: "Trademark License", description: "License to use registered trademarks under specific terms and conditions.", category: "Intellectual Property", gradient: "from-pink-500 to-pink-600", source: "library", pageCount: 5 },
  { id: "lib-24", name: "Merger Agreement", description: "Agreement outlining terms for company merger including due diligence.", category: "Merger Acquisitions", gradient: "from-orange-500 to-orange-600", source: "library", pageCount: 22 },
  { id: "lib-25", name: "Promissory Note", description: "Written promise to pay a specified amount by a certain date.", category: "Financial Reports", gradient: "from-sky-500 to-sky-600", source: "library", pageCount: 2 },
  { id: "lib-26", name: "Government RFP Response", description: "Structured response template for government request for proposal.", category: "Government Contracts", gradient: "from-lime-500 to-lime-600", source: "library", pageCount: 16 },
  { id: "lib-27", name: "Student Enrollment Form", description: "Enrollment and registration form for educational institutions.", category: "Education Documents", gradient: "from-yellow-500 to-yellow-600", source: "library", pageCount: 4 },
  { id: "lib-28", name: "Procurement RFQ", description: "Request for quotation template for procurement departments.", category: "Procurement Forms", gradient: "from-fuchsia-500 to-fuchsia-600", source: "library", pageCount: 3 },
  { id: "lib-29", name: "Equity Investment Agreement", description: "Investment agreement with equity allocation, vesting, and dilution terms.", category: "Financial Reports", gradient: "from-blue-500 to-blue-600", source: "library", pageCount: 12 },
  { id: "lib-30", name: "IT Service Level Agreement", description: "SLA for managed IT services with uptime guarantees and support tiers.", category: "Technology Agreements", gradient: "from-emerald-500 to-emerald-600", source: "library", pageCount: 8 },
  { id: "lib-31", name: "Employee Handbook", description: "Comprehensive employee handbook covering policies, benefits, and conduct.", category: "Employment Offers", gradient: "from-violet-500 to-violet-600", source: "library", pageCount: 30 },
  { id: "lib-32", name: "Sponsorship Agreement", description: "Event or brand sponsorship agreement with deliverables and payment terms.", category: "Marketing Agreements", gradient: "from-amber-500 to-amber-600", source: "library", pageCount: 6 },
  { id: "lib-33", name: "Subcontractor Agreement", description: "Agreement between contractor and subcontractor for project work.", category: "Construction Contracts", gradient: "from-rose-500 to-rose-600", source: "library", pageCount: 9 },
  { id: "lib-34", name: "Patent License Agreement", description: "License to use patented technology under royalty or flat-fee terms.", category: "Intellectual Property", gradient: "from-cyan-500 to-cyan-600", source: "library", pageCount: 7 },
  { id: "lib-35", name: "Joint Venture Agreement", description: "Agreement for a joint venture between two or more business entities.", category: "Partnership Agreements", gradient: "from-indigo-500 to-indigo-600", source: "library", pageCount: 13 },
  { id: "lib-36", name: "Terms of Service", description: "Website or app terms of service covering usage rights and limitations.", category: "Technology Agreements", gradient: "from-teal-500 to-teal-600", source: "library", pageCount: 6 },
  { id: "lib-37", name: "Privacy Policy", description: "Privacy policy template compliant with GDPR and CCPA requirements.", category: "Compliance Documents", gradient: "from-pink-500 to-pink-600", source: "library", pageCount: 5 },
  { id: "lib-38", name: "Medical Consent Form", description: "Patient consent form for medical procedures and treatment plans.", category: "Healthcare Forms", gradient: "from-orange-500 to-orange-600", source: "library", pageCount: 2 },
  { id: "lib-39", name: "Academic Research Agreement", description: "Collaboration agreement for joint academic research projects.", category: "Education Documents", gradient: "from-sky-500 to-sky-600", source: "library", pageCount: 8 },
  { id: "lib-40", name: "Supply Chain Agreement", description: "End-to-end supply chain management agreement with logistics terms.", category: "Procurement Forms", gradient: "from-lime-500 to-lime-600", source: "library", pageCount: 11 },
];

export const userTemplates: Template[] = [
  { id: "user-1", name: "My Sales Proposal", description: "Custom sales proposal tailored for enterprise clients.", category: "Sales Proposals", gradient: "", source: "user", subtitle: "Created by you", pageCount: 6 },
  { id: "user-7", name: "Quick Memo", gradient: "", source: "user", subtitle: "Created by you", pageCount: 1 },
  { id: "user-2", name: "Standard NDA v2", description: "Team-approved NDA with updated confidentiality clauses.", category: "Non-Disclosure", gradient: "", source: "user", subtitle: "Team template", pageCount: 4 },
  { id: "user-3", name: "Client Service Agreement", description: "Service agreement for long-term client engagements.", category: "Service Contracts", gradient: "", source: "user", subtitle: "Created by you", pageCount: 9 },
  { id: "user-8", name: "Meeting Notes Template", gradient: "", source: "user", subtitle: "Created by you", pageCount: 2 },
  { id: "user-4", name: "Monthly Invoice", description: "Recurring invoice template for monthly billing cycles.", category: "Financial Reports", gradient: "", source: "user", subtitle: "Created by you", pageCount: 1 },
  { id: "user-5", name: "Consulting SOW", description: "Statement of work for consulting engagements and deliverables.", category: "Sales Proposals", gradient: "", source: "user", subtitle: "Team template", pageCount: 5 },
  { id: "user-6", name: "Vendor Agreement", description: "Vendor onboarding agreement with customized payment terms.", category: "Service Contracts", gradient: "", source: "user", subtitle: "Created by you", pageCount: 8 },
  // Additional user templates for pagination
  { id: "user-9", name: "Quarterly Report", description: "Internal quarterly performance report with KPIs.", category: "Financial Reports", gradient: "", source: "user", subtitle: "Created by you", pageCount: 4 },
  { id: "user-10", name: "Client Onboarding Checklist", description: "Step-by-step checklist for onboarding new clients.", category: "Service Contracts", gradient: "", source: "user", subtitle: "Team template", pageCount: 3 },
  { id: "user-11", name: "Freelancer Contract", description: "Short-term freelancer engagement contract.", category: "Service Contracts", gradient: "", source: "user", subtitle: "Created by you", pageCount: 5 },
  { id: "user-12", name: "Budget Proposal Q2", description: "Department budget proposal for the second quarter.", category: "Financial Reports", gradient: "", source: "user", subtitle: "Created by you", pageCount: 6 },
  { id: "user-13", name: "Team OKR Document", description: "Objectives and key results for the engineering team.", category: "Sales Proposals", gradient: "", source: "user", subtitle: "Team template", pageCount: 2 },
  { id: "user-14", name: "Investor Update", description: "Monthly investor update letter with metrics and highlights.", category: "Financial Reports", gradient: "", source: "user", subtitle: "Created by you", pageCount: 3 },
  { id: "user-15", name: "Partnership Proposal", description: "Proposal for strategic partnership with key deliverables.", category: "Sales Proposals", gradient: "", source: "user", subtitle: "Created by you", pageCount: 7 },
  { id: "user-16", name: "Employee Review Form", description: "Annual performance review form with rating scales.", category: "Non-Disclosure", gradient: "", source: "user", subtitle: "Team template", pageCount: 2 },
  { id: "user-17", name: "Product Spec Sheet", description: "Detailed product specifications and feature matrix.", category: "Sales Proposals", gradient: "", source: "user", subtitle: "Created by you", pageCount: 4 },
  { id: "user-18", name: "Event Planning Brief", description: "Brief for corporate event planning with timeline and budget.", category: "Service Contracts", gradient: "", source: "user", subtitle: "Created by you", pageCount: 3 },
  { id: "user-19", name: "Contractor NDA", description: "NDA specifically designed for independent contractors.", category: "Non-Disclosure", gradient: "", source: "user", subtitle: "Created by you", pageCount: 4 },
  { id: "user-20", name: "Sales Deck Outline", description: "Outline template for creating client-facing sales presentations.", category: "Sales Proposals", gradient: "", source: "user", subtitle: "Team template", pageCount: 8 },
];

export const sharedTemplates: Template[] = [
  { id: "shared-1", name: "Q1 Sales Proposal", description: "Quarterly sales proposal for enterprise accounts.", category: "Sales Proposals", gradient: "", source: "user", subtitle: "Shared by Sarah M.", isShared: true, sharedBy: "Sarah M.", sharedByInitials: "SM", pageCount: 7 },
  { id: "shared-5", name: "Office Checklist", gradient: "", source: "user", isShared: true, sharedBy: "Mike P.", sharedByInitials: "MP", pageCount: 1 },
  { id: "shared-2", name: "Master Services Agreement", description: "Comprehensive MSA for long-term client partnerships.", category: "Service Contracts", gradient: "", source: "user", subtitle: "Shared by David K.", isShared: true, sharedBy: "David K.", sharedByInitials: "DK", pageCount: 15 },
  { id: "shared-3", name: "Executive NDA", description: "Executive-level NDA for board and leadership discussions.", category: "Non-Disclosure", gradient: "", source: "user", subtitle: "Shared by Lisa R.", isShared: true, sharedBy: "Lisa R.", sharedByInitials: "LR", pageCount: 3 },
  { id: "shared-4", name: "Quarterly Report Template", description: "Standardized quarterly financial report format.", category: "Financial Reports", gradient: "", source: "user", subtitle: "Shared by James T.", isShared: true, sharedBy: "James T.", sharedByInitials: "JT", pageCount: 10 },
  // Additional shared templates
  { id: "shared-6", name: "Marketing Campaign Brief", description: "Template for planning marketing campaigns with budgets.", category: "Sales Proposals", gradient: "", source: "user", isShared: true, sharedBy: "Anna W.", sharedByInitials: "AW", pageCount: 5 },
  { id: "shared-7", name: "Legal Review Checklist", description: "Checklist for reviewing contracts before signing.", category: "Service Contracts", gradient: "", source: "user", isShared: true, sharedBy: "Tom H.", sharedByInitials: "TH", pageCount: 2 },
  { id: "shared-8", name: "Board Meeting Agenda", description: "Standard agenda template for board of directors meetings.", category: "Financial Reports", gradient: "", source: "user", isShared: true, sharedBy: "Rachel S.", sharedByInitials: "RS", pageCount: 3 },
  { id: "shared-9", name: "Vendor Evaluation Form", description: "Scoring template for evaluating potential vendors.", category: "Service Contracts", gradient: "", source: "user", isShared: true, sharedBy: "Chris L.", sharedByInitials: "CL", pageCount: 4 },
  { id: "shared-10", name: "Project Post-Mortem", description: "Post-project review template with lessons learned.", category: "Sales Proposals", gradient: "", source: "user", isShared: true, sharedBy: "Nina B.", sharedByInitials: "NB", pageCount: 3 },
  { id: "shared-11", name: "Client Feedback Survey", description: "Survey template for collecting client satisfaction feedback.", category: "Service Contracts", gradient: "", source: "user", isShared: true, sharedBy: "David K.", sharedByInitials: "DK", pageCount: 2 },
  { id: "shared-12", name: "Expense Policy", description: "Company expense policy covering travel, meals, and equipment.", category: "Financial Reports", gradient: "", source: "user", isShared: true, sharedBy: "Sarah M.", sharedByInitials: "SM", pageCount: 6 },
  { id: "shared-13", name: "Sales Playbook", description: "Comprehensive sales playbook with objection handling scripts.", category: "Sales Proposals", gradient: "", source: "user", isShared: true, sharedBy: "Mike P.", sharedByInitials: "MP", pageCount: 12 },
  { id: "shared-14", name: "Compliance Audit Template", description: "Internal compliance audit checklist and reporting template.", category: "Non-Disclosure", gradient: "", source: "user", isShared: true, sharedBy: "Lisa R.", sharedByInitials: "LR", pageCount: 8 },
  { id: "shared-15", name: "Training Manual Outline", description: "Outline for creating department-specific training manuals.", category: "Service Contracts", gradient: "", source: "user", isShared: true, sharedBy: "James T.", sharedByInitials: "JT", pageCount: 5 },
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

export const myTemplateCategories = ["All", "Service Contracts", "Sales Proposals", "Non-Disclosure", "Financial Reports", "Others"];

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
