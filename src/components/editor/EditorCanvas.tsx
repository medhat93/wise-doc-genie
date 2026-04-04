import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { AnimatePresence, motion } from "framer-motion";
import EditorToolbar from "./EditorToolbar";
import type { EditorDocument } from "./EditorDocumentsPopover";

/* ── Mock documents ── */
export const MOCK_DOCUMENTS: EditorDocument[] = [
  { id: "doc-1", name: "Master Services Agreement", docType: "primary", fileType: "pdf" },
  { id: "doc-2", name: "Schedule A — Pricing", docType: "supplement", fileType: "docx" },
  { id: "doc-3", name: "Insurance Certificate", docType: "attachment", fileType: "pdf" },
];

const DOC_TYPE_DOT: Record<string, string> = {
  primary: "bg-[hsl(var(--brand-indigo))]",
  supplement: "bg-amber-500",
  attachment: "bg-muted-foreground/50",
};

const DOC_TYPE_LABEL: Record<string, { label: string; className: string }> = {
  primary: { label: "Primary", className: "bg-[hsl(var(--brand-indigo))]/15 text-[hsl(var(--brand-indigo))]" },
  supplement: { label: "Supplement", className: "bg-amber-500/15 text-amber-700 dark:text-amber-400" },
  attachment: { label: "Attachment", className: "bg-muted text-muted-foreground" },
};

const DOC_BORDER: Record<string, string> = {
  primary: "",
  supplement: "border-l-[3px] border-l-amber-400",
  attachment: "border-l-[3px] border-l-muted-foreground/30 bg-muted/30",
};

/* ── Document content blocks ── */
const Doc1Content = () => (
  <>
    <h1 className="text-2xl font-bold text-foreground mb-1">Master Services Agreement</h1>
    <p className="text-xs text-muted-foreground mb-8">Effective Date: April 4, 2026</p>
    <p className="text-sm leading-relaxed text-foreground/90 mb-6">
      This Master Services Agreement ("Agreement") is entered into by and between the parties
      identified below. This Agreement sets forth the terms and conditions under which the
      Service Provider shall provide services to the Client.
    </p>
    <h2 className="text-base font-semibold text-foreground mt-8 mb-3">1. Definitions</h2>
    <p className="text-sm leading-relaxed text-foreground/80 mb-4">
      "Services" means the professional services described in each Statement of Work executed
      under this Agreement. "Deliverables" means all work product, reports, and materials
      produced by the Service Provider in connection with the Services.
    </p>
    <h2 className="text-base font-semibold text-foreground mt-8 mb-3">2. Scope of Services</h2>
    <p className="text-sm leading-relaxed text-foreground/80 mb-4">
      The Service Provider agrees to perform the Services as described in one or more Statements
      of Work to be mutually agreed upon and executed by both parties. Each Statement of Work
      shall specify the scope, timeline, deliverables, and fees for the applicable Services.
    </p>
    <h2 className="text-base font-semibold text-foreground mt-8 mb-3">3. Payment Terms</h2>
    <p className="text-sm leading-relaxed text-foreground/80 mb-4">
      Client shall pay the Service Provider the fees set forth in each Statement of Work. Unless
      otherwise specified, invoices shall be issued monthly and are due within thirty (30) days
      of the invoice date. Late payments shall accrue interest at the rate of 1.5% per month.
    </p>
    <h2 className="text-base font-semibold text-foreground mt-8 mb-3">4. Confidentiality</h2>
    <p className="text-sm leading-relaxed text-foreground/80 mb-4">
      Each party agrees to hold in confidence all Confidential Information received from the
      other party. "Confidential Information" includes any non-public technical, business, or
      financial information disclosed by either party during the term of this Agreement.
    </p>
    <h2 className="text-base font-semibold text-foreground mt-8 mb-3">5. Term and Termination</h2>
    <p className="text-sm leading-relaxed text-foreground/80 mb-4">
      This Agreement shall commence on the Effective Date and continue for a period of twelve
      (12) months unless terminated earlier. Either party may terminate this Agreement with
      thirty (30) days' prior written notice.
    </p>
    <h2 className="text-base font-semibold text-foreground mt-8 mb-3">6. Limitation of Liability</h2>
    <p className="text-sm leading-relaxed text-foreground/80 mb-4">
      In no event shall either party be liable for any indirect, incidental, special, consequential,
      or punitive damages, regardless of the cause of action or the theory of liability, even if
      such party has been advised of the possibility of such damages.
    </p>
    <h2 className="text-base font-semibold text-foreground mt-8 mb-3">7. Governing Law</h2>
    <p className="text-sm leading-relaxed text-foreground/80 mb-4">
      This Agreement shall be governed by and construed in accordance with the laws of the State
      of Delaware, without regard to its conflict of laws provisions.
    </p>
  </>
);

const Doc2Content = () => (
  <>
    <h1 className="text-2xl font-bold text-foreground mb-1">Schedule A: Pricing & Fee Structure</h1>
    <p className="text-xs text-muted-foreground mb-8">Attached to: Master Services Agreement</p>
    <h2 className="text-base font-semibold text-foreground mt-6 mb-3">1. Service Fees</h2>
    <p className="text-sm leading-relaxed text-foreground/80 mb-4">
      The following table outlines the fees applicable to each category of services provided under
      this Agreement. All fees are quoted in United States Dollars (USD) and are exclusive of
      applicable taxes unless otherwise noted.
    </p>
    <div className="border rounded-md overflow-hidden mb-6">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left px-4 py-2 font-medium text-foreground border-b">Service Category</th>
            <th className="text-left px-4 py-2 font-medium text-foreground border-b">Rate (USD/hr)</th>
            <th className="text-left px-4 py-2 font-medium text-foreground border-b">Est. Hours</th>
            <th className="text-right px-4 py-2 font-medium text-foreground border-b">Total</th>
          </tr>
        </thead>
        <tbody>
          {[
            ["Strategic Consulting", "$250", "40", "$10,000"],
            ["Technical Development", "$185", "120", "$22,200"],
            ["Quality Assurance", "$150", "30", "$4,500"],
            ["Project Management", "$175", "20", "$3,500"],
          ].map(([svc, rate, hrs, total], i) => (
            <tr key={i} className="border-b last:border-0">
              <td className="px-4 py-2 text-foreground/80">{svc}</td>
              <td className="px-4 py-2 text-foreground/80">{rate}</td>
              <td className="px-4 py-2 text-foreground/80">{hrs}</td>
              <td className="px-4 py-2 text-right text-foreground/80">{total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <h2 className="text-base font-semibold text-foreground mt-6 mb-3">2. Payment Schedule</h2>
    <p className="text-sm leading-relaxed text-foreground/80 mb-4">
      Payments shall be made in three installments: 30% upon execution of the Statement of Work,
      40% upon delivery of the initial milestone, and 30% upon final delivery and acceptance of
      all Deliverables. Net payment terms are thirty (30) days from invoice date.
    </p>
    <h2 className="text-base font-semibold text-foreground mt-6 mb-3">3. Expense Policy</h2>
    <p className="text-sm leading-relaxed text-foreground/80 mb-4">
      Reasonable travel and accommodation expenses incurred in connection with the Services shall
      be reimbursed at cost, subject to prior written approval. Expenses exceeding $500 per
      occurrence require advance authorization from the Client.
    </p>
  </>
);

const Doc3Content = () => (
  <>
    <h1 className="text-2xl font-bold text-foreground mb-1">Certificate of Insurance</h1>
    <p className="text-xs text-muted-foreground mb-8">Reference Document — Attachment</p>
    <div className="space-y-3 text-sm text-foreground/80 mb-6">
      <div className="flex justify-between border-b border-dashed border-border pb-2">
        <span className="font-medium text-foreground">Company Name</span>
        <span>Acme Professional Services LLC</span>
      </div>
      <div className="flex justify-between border-b border-dashed border-border pb-2">
        <span className="font-medium text-foreground">Policy Number</span>
        <span>INS-2026-04871-GL</span>
      </div>
      <div className="flex justify-between border-b border-dashed border-border pb-2">
        <span className="font-medium text-foreground">Coverage Type</span>
        <span>General Liability</span>
      </div>
      <div className="flex justify-between border-b border-dashed border-border pb-2">
        <span className="font-medium text-foreground">Coverage Amount</span>
        <span>$2,000,000 per occurrence</span>
      </div>
      <div className="flex justify-between border-b border-dashed border-border pb-2">
        <span className="font-medium text-foreground">Effective Date</span>
        <span>January 1, 2026</span>
      </div>
      <div className="flex justify-between border-b border-dashed border-border pb-2">
        <span className="font-medium text-foreground">Expiration Date</span>
        <span>December 31, 2026</span>
      </div>
      <div className="flex justify-between pb-2">
        <span className="font-medium text-foreground">Insurance Provider</span>
        <span>National Indemnity Company</span>
      </div>
    </div>
    <p className="text-sm leading-relaxed text-foreground/80 mb-4">
      This certificate is issued as a matter of information only and confers no rights upon the
      certificate holder. This certificate does not amend, extend, or alter the coverage afforded
      by the policies listed herein.
    </p>
    <p className="text-sm leading-relaxed text-foreground/80">
      The insurance afforded by the policies described herein is subject to all terms, exclusions,
      and conditions of such policies. Should any of the above described policies be cancelled
      before the expiration date thereof, notice will be delivered in accordance with the policy
      provisions.
    </p>
  </>
);

const DOC_CONTENT: Record<string, React.FC> = {
  "doc-1": Doc1Content,
  "doc-2": Doc2Content,
  "doc-3": Doc3Content,
};

/* ── Divider ── */
const DocumentDivider = ({ doc }: { doc: EditorDocument }) => {
  const style = DOC_TYPE_LABEL[doc.docType];
  return (
    <div className="h-[60px] bg-muted/50 flex items-center justify-center gap-2 relative">
      <div className="absolute top-0 left-6 right-6 border-t border-dashed border-border" />
      <span className="text-xs font-medium text-muted-foreground truncate max-w-[200px]">{doc.name}</span>
      <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0 h-4 font-medium", style.className)}>
        {style.label}
      </Badge>
      <div className="absolute bottom-0 left-6 right-6 border-t border-dashed border-border" />
    </div>
  );
};

/* ── Scroll indicator ── */
const ScrollIndicator = ({ doc }: { doc: EditorDocument | null }) => (
  <AnimatePresence>
    {doc && (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="absolute top-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 bg-card/90 backdrop-blur border shadow-sm rounded-full px-3 py-1"
      >
        <span className={cn("h-2 w-2 rounded-full flex-shrink-0", DOC_TYPE_DOT[doc.docType])} />
        <span className="text-xs font-medium text-foreground">{doc.name}</span>
      </motion.div>
    )}
  </AnimatePresence>
);

/* ══════════ MAIN ══════════ */
interface EditorCanvasProps {
  showToolbar?: boolean;
}

const EditorCanvas = ({ showToolbar = true }: EditorCanvasProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const docRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [activeDocId, setActiveDocId] = useState<string | null>(MOCK_DOCUMENTS[0].id);
  const [showIndicator, setShowIndicator] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();

  /* IntersectionObserver for active doc detection */
  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveDocId(entry.target.getAttribute("data-doc-id"));
          }
        }
      },
      { root, rootMargin: "-40% 0px -40% 0px", threshold: 0 }
    );

    Object.values(docRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  /* Show floating indicator on scroll */
  const handleScroll = useCallback(() => {
    setShowIndicator(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowIndicator(false), 2000);
  }, []);

  const scrollToDoc = useCallback((id: string) => {
    docRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const activeDoc = MOCK_DOCUMENTS.find((d) => d.id === activeDocId) ?? null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {showToolbar && (
        <EditorToolbar
          documents={MOCK_DOCUMENTS}
          activeDocId={activeDocId}
          onScrollToDoc={scrollToDoc}
        />
      )}

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto bg-muted/20 relative"
        onScroll={handleScroll}
      >
        <ScrollIndicator doc={showIndicator ? activeDoc : null} />

        <div className="p-6 md:p-10 space-y-0">
          {MOCK_DOCUMENTS.map((doc, idx) => {
            const Content = DOC_CONTENT[doc.id];
            return (
              <div key={doc.id}>
                {idx > 0 && <DocumentDivider doc={doc} />}
                <div
                  ref={(el) => { docRefs.current[doc.id] = el; }}
                  data-doc-id={doc.id}
                  className={cn(
                    "max-w-[816px] mx-auto bg-card shadow-sm border rounded-sm min-h-[800px] p-12 md:p-16",
                    DOC_BORDER[doc.docType]
                  )}
                >
                  {Content && <Content />}
                </div>
              </div>
            );
          })}
          {/* bottom spacer */}
          <div className="h-20" />
        </div>
      </div>
    </div>
  );
};

export default EditorCanvas;
