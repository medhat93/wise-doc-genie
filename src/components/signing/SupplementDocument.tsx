import React, { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, CheckCircle2 } from 'lucide-react';
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

export default function SupplementDocument({ doc, accepted, onAccept }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [reachedBottom, setReachedBottom] = useState(false);
  const [checkboxChecked, setCheckboxChecked] = useState(false);
  const [loading, setLoading] = useState(false);

  const content = doc.id === 'schedule-a' ? SCHEDULE_A_CONTENT : CONFIDENTIAL_CONTENT;
  const pageCount = doc.pages;

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setReachedBottom(true);
      },
      { root: container, threshold: 0.8 }
    );

    if (bottomRef.current) observer.observe(bottomRef.current);

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const pct = Math.min(100, Math.round((scrollTop / (scrollHeight - clientHeight)) * 100));
      setScrollProgress(pct);
    };
    container.addEventListener('scroll', handleScroll);

    return () => {
      observer.disconnect();
      container.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleAccept = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onAccept(doc.id);
    }, 500);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Banner */}
      <div className={cn(
        'mx-auto max-w-2xl w-full rounded-lg border p-3 mb-4 flex items-start gap-3',
        accepted
          ? 'bg-green-50 border-green-200'
          : 'bg-amber-50 border-amber-200'
      )}>
        {accepted ? (
          <CheckCircle2 size={18} className="text-green-600 shrink-0 mt-0.5" />
        ) : (
          <Eye size={18} className="text-amber-600 shrink-0 mt-0.5" />
        )}
        <div>
          {accepted ? (
            <p className="text-sm font-medium text-green-800">✓ Document accepted</p>
          ) : (
            <>
              <p className="text-sm font-medium text-amber-800">You must view and accept this document before proceeding</p>
              <p className="text-xs text-amber-600 mt-0.5">Scroll through all pages and accept to confirm your review</p>
            </>
          )}
        </div>
      </div>

      {/* Scrollable content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto relative">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Pages */}
          {Array.from({ length: pageCount }, (_, pageIdx) => {
            const pageContent = pageIdx === 0 ? content : content.slice(Math.floor(content.length / 2));
            return (
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
            );
          })}

          {/* Accept card at the bottom */}
          {!accepted && (
            <div className="border-2 border-primary rounded-xl p-6 max-w-md mx-auto mt-8 mb-4 text-center space-y-4">
              <CheckCircle2 size={32} className="text-primary mx-auto" />
              <h3 className="text-lg font-semibold">Accept this document</h3>
              <p className="text-sm text-muted-foreground">By clicking accept, you confirm that you have reviewed and agree to the terms in this document</p>
              <div className="flex items-start gap-2 justify-center text-left">
                <Checkbox
                  checked={checkboxChecked}
                  onCheckedChange={v => setCheckboxChecked(v === true)}
                  id={`accept-${doc.id}`}
                  className="mt-0.5"
                />
                <label htmlFor={`accept-${doc.id}`} className="text-sm text-muted-foreground cursor-pointer leading-tight">
                  I have read and understood the contents of this document
                </label>
              </div>
              <Button
                className="w-full"
                disabled={!checkboxChecked || !reachedBottom || loading}
                onClick={handleAccept}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    Accepting...
                  </span>
                ) : 'Accept'}
              </Button>
              {!reachedBottom && checkboxChecked && (
                <p className="text-xs text-muted-foreground">Scroll to the bottom of the document first</p>
              )}
            </div>
          )}

          <div ref={bottomRef} className="h-1" />
        </div>

        {/* Scroll progress pill */}
        {!accepted && !reachedBottom && scrollProgress > 0 && (
          <div className="sticky bottom-4 flex justify-center pointer-events-none">
            <div className="bg-card border border-border shadow-sm rounded-full px-3 py-1 text-xs text-muted-foreground">
              Scroll progress: {scrollProgress}%
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
