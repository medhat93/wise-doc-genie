import React from 'react';
import { cn } from '@/lib/utils';
import { SigningDocument } from './signingDocuments';

interface Props {
  doc: SigningDocument;
  accepted: boolean;
  onAccept: (id: string) => void;
}

const SCHEDULE_A_CONTENT = [
  { title: 'SCHEDULE A — PRICING & FEE STRUCTURE', content: 'This Schedule A forms part of the Master Services Agreement dated April 4, 2026 between Acme Corporation and Meridian Data Systems GmbH.' },
  { title: '1. SERVICE FEES', content: 'The following fees shall apply for services rendered under this Agreement:\n\n• Platform Access License: $45,000/year per seat\n• Implementation & Onboarding: $25,000 one-time fee\n• Custom Integration Development: $200/hour\n• Premium Support (24/7): $12,000/year\n• Data Migration Services: $15,000 flat fee' },
  { title: '2. PAYMENT TERMS', content: 'All invoices are due within thirty (30) days of receipt. Late payments shall incur interest at a rate of 1.5% per month or the maximum rate permitted by law, whichever is lower. The Client shall be responsible for all costs of collection, including reasonable attorney fees.' },
  { title: '3. ANNUAL ADJUSTMENTS', content: 'Service fees may be adjusted annually by no more than 5% with 60 days prior written notice. Volume discounts apply for commitments of 10+ seats. Enterprise pricing available upon request for deployments exceeding 50 seats.' },
];

const CONFIDENTIAL_CONTENT = [
  { title: 'CONFIDENTIAL TERMS ADDENDUM', content: 'This Confidential Terms Addendum supplements the Master Services Agreement and contains additional terms regarding the handling of sensitive financial and proprietary information.' },
  { title: '1. ENHANCED CONFIDENTIALITY', content: 'In addition to the standard confidentiality obligations, the Receiving Party agrees to implement enhanced security measures including: encryption at rest (AES-256), encrypted transit (TLS 1.3), access logging with 90-day retention, and quarterly security audits performed by an independent third party.' },
  { title: '2. DATA HANDLING', content: 'All confidential data must be stored in SOC 2 Type II certified facilities within the agreed-upon jurisdictions. Cross-border data transfers require prior written approval and must comply with applicable data protection regulations including GDPR and CCPA.' },
];

export default function SupplementDocument({ doc }: Props) {
  const content = doc.id === 'schedule-a' ? SCHEDULE_A_CONTENT : CONFIDENTIAL_CONTENT;
  const pageCount = doc.pages;

  return (
    <div className="flex flex-col h-full">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto relative">
        <div className="max-w-2xl mx-auto space-y-8">
          {Array.from({ length: pageCount }, (_, pageIdx) => (
            <div key={pageIdx} className="bg-card rounded-xl shadow border border-border p-10 space-y-6">
              {(pageIdx === 0 ? content.slice(0, Math.ceil(content.length / 2)) : content.slice(Math.ceil(content.length / 2))).map((section, i) => (
                <div key={i}>
                  <h2 className={cn('font-semibold mb-3', i === 0 && pageIdx === 0 ? 'text-2xl text-center mb-8' : 'text-base')}>{section.title}</h2>
                  <p className="text-sm leading-relaxed whitespace-pre-line">{section.content}</p>
                </div>
              ))}
              <div className="border-b border-border pt-4" />
              <p className="text-xs text-muted-foreground text-center">Page {pageIdx + 1} of {pageCount}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
