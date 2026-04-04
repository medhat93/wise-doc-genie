import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { AnimatePresence, motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { X, Copy, Trash2, Bold, Italic, Highlighter, MessageSquare } from "lucide-react";
import EditorToolbar from "./EditorToolbar";
import type { EditorDocument } from "./EditorDocumentsPopover";
import { FIELD_TYPES, type PlacedField } from "./EditorFieldsPanel";
import { useEditorContext, COMMENT_SECTIONS, type Comment } from "./EditorContext";
import { toast } from "sonner";

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

/* ── Document content blocks with comment highlights ── */
const CommentHighlight = ({
  children,
  sectionRef,
  comments,
  onClickHighlight,
}: {
  children: React.ReactNode;
  sectionRef: string;
  comments: Comment[];
  onClickHighlight: (sectionRef: string) => void;
}) => {
  const sectionComments = comments.filter((c) => c.type === "inline" && c.sectionRef === sectionRef);
  if (sectionComments.length === 0) return <>{children}</>;

  const hasOpen = sectionComments.some((c) => c.status === "open");
  const bgClass = hasOpen ? "bg-amber-100/50 dark:bg-amber-900/20" : "bg-emerald-100/30 dark:bg-emerald-900/15";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          data-comment-section={sectionRef}
          className={cn("rounded-sm px-0.5 cursor-pointer transition-colors hover:opacity-80", bgClass)}
          onClick={(e) => { e.stopPropagation(); onClickHighlight(sectionRef); }}
        >
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs max-w-[200px]">
        {sectionComments.length === 1
          ? `${sectionComments[0].author}: "${sectionComments[0].text.slice(0, 60)}..."`
          : `${sectionComments.length} comments on this section`}
      </TooltipContent>
    </Tooltip>
  );
};

const Doc1Content = ({ comments, onClickHighlight }: { comments: Comment[]; onClickHighlight: (ref: string) => void }) => (
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
    <h2 className="text-base font-semibold text-foreground mt-8 mb-3">
      <CommentHighlight sectionRef="Section 2: Scope of Services" comments={comments} onClickHighlight={onClickHighlight}>
        2. Scope of Services
      </CommentHighlight>
    </h2>
    <p className="text-sm leading-relaxed text-foreground/80 mb-4">
      <CommentHighlight sectionRef="Section 2: Scope of Services" comments={comments} onClickHighlight={onClickHighlight}>
        The Service Provider agrees to perform the Services as described in one or more Statements
        of Work to be mutually agreed upon and executed by both parties. Each Statement of Work
        shall specify the scope, timeline, deliverables, and fees for the applicable Services.
      </CommentHighlight>
    </p>
    <h2 className="text-base font-semibold text-foreground mt-8 mb-3">
      <CommentHighlight sectionRef="Section 3: Payment Terms" comments={comments} onClickHighlight={onClickHighlight}>
        3. Payment Terms
      </CommentHighlight>
    </h2>
    <p className="text-sm leading-relaxed text-foreground/80 mb-4">
      <CommentHighlight sectionRef="Section 3: Payment Terms" comments={comments} onClickHighlight={onClickHighlight}>
        Client shall pay the Service Provider the fees set forth in each Statement of Work. Unless
        otherwise specified, invoices shall be issued monthly and are due within thirty (30) days
        of the invoice date. Late payments shall accrue interest at the rate of 1.5% per month.
      </CommentHighlight>
    </p>
    <h2 className="text-base font-semibold text-foreground mt-8 mb-3">4. Confidentiality</h2>
    <p className="text-sm leading-relaxed text-foreground/80 mb-4">
      Each party agrees to hold in confidence all Confidential Information received from the
      other party. "Confidential Information" includes any non-public technical, business, or
      financial information disclosed by either party during the term of this Agreement.
    </p>
    <h2 className="text-base font-semibold text-foreground mt-8 mb-3">
      <CommentHighlight sectionRef="Section 5: Termination" comments={comments} onClickHighlight={onClickHighlight}>
        5. Term and Termination
      </CommentHighlight>
    </h2>
    <p className="text-sm leading-relaxed text-foreground/80 mb-4">
      <CommentHighlight sectionRef="Section 5: Termination" comments={comments} onClickHighlight={onClickHighlight}>
        This Agreement shall commence on the Effective Date and continue for a period of twelve
        (12) months unless terminated earlier. Either party may terminate this Agreement with
        thirty (30) days' prior written notice.
      </CommentHighlight>
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
      {[
        ["Company Name", "Acme Professional Services LLC"],
        ["Policy Number", "INS-2026-04871-GL"],
        ["Coverage Type", "General Liability"],
        ["Coverage Amount", "$2,000,000 per occurrence"],
        ["Effective Date", "January 1, 2026"],
        ["Expiration Date", "December 31, 2026"],
        ["Insurance Provider", "National Indemnity Company"],
      ].map(([label, value], i, arr) => (
        <div key={label} className={cn("flex justify-between pb-2", i < arr.length - 1 && "border-b border-dashed border-border")}>
          <span className="font-medium text-foreground">{label}</span>
          <span>{value}</span>
        </div>
      ))}
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

/* ── Text selection toolbar ── */
const SelectionToolbar = ({
  position,
  onComment,
  onDismiss,
}: {
  position: { x: number; y: number };
  onComment: () => void;
  onDismiss: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 4 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 4 }}
    transition={{ duration: 0.15 }}
    className="fixed z-50 flex items-center gap-0.5 bg-card border shadow-lg rounded-lg px-1 py-1"
    style={{ left: position.x, top: position.y }}
    onMouseDown={(e) => e.preventDefault()}
  >
    <button className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent">
      <Bold size={14} />
    </button>
    <button className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent">
      <Italic size={14} />
    </button>
    <button className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent">
      <Highlighter size={14} />
    </button>
    <div className="w-px h-5 bg-border mx-0.5" />
    <button
      className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
      onClick={onComment}
    >
      <MessageSquare size={14} />
    </button>
  </motion.div>
);

/* ── Floating comment bubble ── */
const CommentBubble = ({ comment, count, onClick }: { comment: Comment; count: number; onClick: () => void }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.15 }}
        onClick={onClick}
        className={cn(
          "relative h-7 w-7 rounded-full flex items-center justify-center text-white text-[10px] font-semibold shadow-sm hover:shadow-md hover:scale-110 transition-all cursor-pointer",
          comment.status === "resolved" && "opacity-40"
        )}
        style={{ backgroundColor: comment.authorColor }}
      >
        {comment.authorInitials}
        {count > 1 && (
          <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-foreground text-background text-[8px] flex items-center justify-center font-bold">
            {count}
          </span>
        )}
      </motion.button>
    </TooltipTrigger>
    <TooltipContent side="left" className="text-xs max-w-[200px]">
      <p className="font-medium">{comment.author}</p>
      <p className="text-muted-foreground line-clamp-2">{comment.text}</p>
    </TooltipContent>
  </Tooltip>
);

/* ── Field overlay component ── */
const FieldOverlay = ({
  field,
  isSelected,
  onSelect,
  onRemove,
  onDuplicate,
}: {
  field: PlacedField;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onDuplicate: () => void;
}) => {
  const ft = FIELD_TYPES.find((f) => f.id === field.fieldTypeId);
  const Icon = ft?.icon;
  const label = ft?.label || field.fieldTypeId;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          onClick={(e) => { e.stopPropagation(); onSelect(); }}
          className={cn(
            "absolute select-none transition-all",
            isSelected ? "cursor-move z-20" : "cursor-move z-10 group"
          )}
          style={{
            left: field.x,
            top: field.y,
            width: field.width,
            height: field.height,
            backgroundColor: `${field.participantColor}10`,
            border: isSelected
              ? `2px solid ${field.participantColor}`
              : `1.5px dashed ${field.participantColor}`,
            borderRadius: 4,
          }}
        >
          <div className="flex items-center gap-1 px-2 h-full overflow-hidden">
            {Icon && <Icon size={11} style={{ color: field.participantColor }} className="flex-shrink-0" />}
            <span className="text-[10px] truncate" style={{ color: field.participantColor }}>
              {label}
            </span>
          </div>

          {isSelected && (
            <div
              className="absolute -bottom-0.5 -right-0.5 h-2 w-2 cursor-nwse-resize rounded-sm"
              style={{ backgroundColor: field.participantColor }}
            />
          )}

          {isSelected && (
            <div
              className="absolute -bottom-8 left-0 flex items-center gap-1 bg-card border shadow-sm rounded-md px-1.5 py-0.5 z-30"
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={onDuplicate} className="h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent">
                <Copy size={10} />
              </button>
              <button onClick={onRemove} className="h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-accent">
                <Trash2 size={10} />
              </button>
              <div className="h-3 w-px bg-border mx-0.5" />
              <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: field.participantColor }} />
              <span className="text-[9px] text-muted-foreground whitespace-nowrap">{field.participantName.split(" ")[0]}</span>
            </div>
          )}

          {!isSelected && (
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
            >
              <X size={8} />
            </button>
          )}
        </div>
      </TooltipTrigger>
      {!isSelected && (
        <TooltipContent side="top" className="text-xs">
          {label} — {field.participantName}
        </TooltipContent>
      )}
    </Tooltip>
  );
};

/* ══════════ MAIN ══════════ */
interface EditorCanvasProps {
  showToolbar?: boolean;
  onFieldSelect?: (fieldId: string | null) => void;
  onOpenComments?: () => void;
  isEsign?: boolean;
}

const EditorCanvas = ({ showToolbar = true, onFieldSelect, onOpenComments, isEsign }: EditorCanvasProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const docRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [activeDocId, setActiveDocId] = useState<string | null>(MOCK_DOCUMENTS[0].id);
  const [showIndicator, setShowIndicator] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();

  const { placedFields, setPlacedFields, selectedFieldId, setSelectedFieldId, comments, commentsPanelOpen, setPendingCommentRef } = useEditorContext();

  // Text selection toolbar state
  const [selectionToolbar, setSelectionToolbar] = useState<{ x: number; y: number; text: string } | null>(null);

  const removePlacedField = useCallback((id: string) => {
    setPlacedFields((prev) => prev.filter((f) => f.id !== id));
    if (selectedFieldId === id) {
      setSelectedFieldId(null);
      onFieldSelect?.(null);
    }
  }, [selectedFieldId, setPlacedFields, setSelectedFieldId, onFieldSelect]);

  const duplicateField = useCallback((field: PlacedField) => {
    const newField = { ...field, id: `f${Date.now()}`, x: field.x + 20, y: field.y + 20 };
    setPlacedFields((prev) => [...prev, newField]);
    setSelectedFieldId(newField.id);
    onFieldSelect?.(newField.id);
    toast.success("Field duplicated");
  }, [setPlacedFields, setSelectedFieldId, onFieldSelect]);

  const handleFieldSelect = useCallback((fieldId: string) => {
    setSelectedFieldId(fieldId);
    onFieldSelect?.(fieldId);
  }, [setSelectedFieldId, onFieldSelect]);

  const handleDrop = useCallback((e: React.DragEvent, docId: string) => {
    e.preventDefault();
    const data = e.dataTransfer.getData("application/field-type");
    if (!data) return;
    try {
      const parsed = JSON.parse(data);
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = e.clientX - rect.left - parsed.defaultWidth / 2;
      const y = e.clientY - rect.top - parsed.defaultHeight / 2;
      const newField: PlacedField = {
        id: `f${Date.now()}`,
        fieldTypeId: parsed.id,
        participantId: parsed.participantId,
        participantName: parsed.participantName,
        participantColor: parsed.participantColor,
        page: MOCK_DOCUMENTS.findIndex((d) => d.id === docId) + 1,
        x: Math.max(0, x),
        y: Math.max(0, y),
        width: parsed.defaultWidth,
        height: parsed.defaultHeight,
      };
      setPlacedFields((prev) => [...prev, newField]);
      setSelectedFieldId(newField.id);
      onFieldSelect?.(newField.id);
    } catch {}
  }, [setPlacedFields, setSelectedFieldId, onFieldSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes("application/field-type")) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    }
  }, []);

  const handleCanvasClick = useCallback(() => {
    if (selectedFieldId) {
      setSelectedFieldId(null);
      onFieldSelect?.(null);
    }
    // Don't clear selection toolbar if there's an active text selection
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) {
      setSelectionToolbar(null);
    }
  }, [selectedFieldId, setSelectedFieldId, onFieldSelect]);

  // Text selection handler
  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      return;
    }
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const text = selection.toString().trim();
    if (text.length > 0) {
      setSelectionToolbar({
        x: rect.left + rect.width / 2 - 80,
        y: rect.top - 48,
        text: text.length > 50 ? text.slice(0, 50) + "..." : text,
      });
    }
  }, []);

  // Handle comment from selection toolbar
  const handleSelectionComment = useCallback(() => {
    if (!selectionToolbar) return;
    setPendingCommentRef(selectionToolbar.text);
    setSelectionToolbar(null);
    window.getSelection()?.removeAllRanges();
    onOpenComments?.();
  }, [selectionToolbar, setPendingCommentRef, onOpenComments]);

  // Handle clicking comment highlights in document
  const handleClickHighlight = useCallback((sectionRef: string) => {
    setPendingCommentRef(null);
    onOpenComments?.();
  }, [setPendingCommentRef, onOpenComments]);

  // Dismiss selection toolbar on scroll/escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectionToolbar(null);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

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

  const handleScroll = useCallback(() => {
    setShowIndicator(true);
    setSelectionToolbar(null);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowIndicator(false), 2000);
  }, []);

  const scrollToDoc = useCallback((id: string) => {
    docRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const activeDoc = MOCK_DOCUMENTS.find((d) => d.id === activeDocId) ?? null;

  // Inline comments for margin display (only when comments panel is closed)
  const inlineComments = comments.filter((c) => c.type === "inline");

  // Group comments by sectionRef for bubble display
  const commentsBySection = inlineComments.reduce<Record<string, Comment[]>>((acc, c) => {
    (acc[c.sectionRef] = acc[c.sectionRef] || []).push(c);
    return acc;
  }, {});

  // Measure positions of comment sections relative to document container
  const [sectionPositions, setSectionPositions] = useState<Record<string, number>>({});
  const doc1Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const measure = () => {
      const container = doc1Ref.current;
      if (!container) return;
      const containerRect = container.getBoundingClientRect();
      const positions: Record<string, number> = {};
      const els = container.querySelectorAll("[data-comment-section]");
      els.forEach((el) => {
        const ref = el.getAttribute("data-comment-section");
        if (ref && !positions[ref]) {
          positions[ref] = el.getBoundingClientRect().top - containerRect.top;
        }
      });
      setSectionPositions(positions);
    };
    measure();
    const timer = setInterval(measure, 1000);
    return () => clearInterval(timer);
  }, [comments]);

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
        className={cn("flex-1 overflow-y-auto relative", isEsign ? "bg-muted/40" : "bg-muted/20")}
        onScroll={handleScroll}
        onClick={handleCanvasClick}
        onMouseUp={handleMouseUp}
      >
        <ScrollIndicator doc={showIndicator ? activeDoc : null} />

        {/* Selection toolbar */}
        <AnimatePresence>
          {selectionToolbar && (
            <SelectionToolbar
              position={{ x: selectionToolbar.x, y: selectionToolbar.y }}
              onComment={handleSelectionComment}
              onDismiss={() => setSelectionToolbar(null)}
            />
          )}
        </AnimatePresence>

        <div className="p-6 md:p-10 space-y-0">
          {MOCK_DOCUMENTS.map((doc, idx) => {
            const docFields = placedFields.filter((f) => f.page === idx + 1);
            return (
              <div key={doc.id}>
                {idx > 0 && <DocumentDivider doc={doc} />}
                <div className="relative">
                  <div
                    ref={(el) => { docRefs.current[doc.id] = el; }}
                    data-doc-id={doc.id}
                    onDrop={(e) => handleDrop(e, doc.id)}
                    onDragOver={handleDragOver}
                    className={cn(
                      "max-w-[816px] mx-auto bg-card shadow-sm border rounded-sm min-h-[800px] p-12 md:p-16 relative",
                      DOC_BORDER[doc.docType]
                    )}
                  >
                    <div ref={doc.id === "doc-1" ? doc1Ref : undefined}>
                      {doc.id === "doc-1" ? (
                        <Doc1Content comments={comments} onClickHighlight={handleClickHighlight} />
                      ) : doc.id === "doc-2" ? (
                        <Doc2Content />
                      ) : (
                        <Doc3Content />
                      )}
                    </div>
                    {docFields.map((f) => (
                      <FieldOverlay
                        key={f.id}
                        field={f}
                        isSelected={selectedFieldId === f.id}
                        onSelect={() => handleFieldSelect(f.id)}
                        onRemove={() => removePlacedField(f.id)}
                        onDuplicate={() => duplicateField(f)}
                      />
                    ))}
                  </div>

                  {/* Floating comment bubbles — aligned to actual text */}
                  {doc.id === "doc-1" && !commentsPanelOpen && (
                    <div className="absolute top-0 right-0 translate-x-[calc(100%+8px)] hidden xl:block" style={{ width: 36 }}>
                      <AnimatePresence>
                        {Object.entries(commentsBySection).map(([sectionRef, sectionComments]) => {
                          const yPos = sectionPositions[sectionRef];
                          if (yPos === undefined) return null;
                          const first = sectionComments[0];
                          return (
                            <div key={sectionRef} style={{ position: "absolute", top: yPos }} className="flex items-center">
                              <CommentBubble
                                comment={first}
                                count={sectionComments.length}
                                onClick={() => onOpenComments?.()}
                              />
                            </div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div className="h-20" />
        </div>
      </div>
    </div>
  );
};

export default EditorCanvas;
