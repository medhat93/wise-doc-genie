import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { X, Copy, Trash2, Bold, Italic, Highlighter, MessageSquare, Sparkles, ArrowRight, Check, Pencil } from "lucide-react";
import EditorToolbar from "./EditorToolbar";
import type { EditorDocument } from "./EditorDocumentsPopover";
import { FIELD_TYPES, type PlacedField } from "./EditorFieldsPanel";
import { useEditorContext, COMMENT_SECTIONS, type Comment, type AiSuggestion, type AnnotationType } from "./EditorContext";
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

  const hasAi = sectionComments.some(c => c.annotationType === "ai_suggestion");
  const hasSuggestion = sectionComments.some(c => c.annotationType === "suggestion");
  const hasOpen = sectionComments.some((c) => c.status === "open");
  
  const bgClass = hasAi
    ? "bg-violet-100/50 dark:bg-violet-900/20"
    : hasSuggestion
    ? "bg-amber-100/70 dark:bg-amber-900/30"
    : hasOpen
    ? "bg-amber-100/50 dark:bg-amber-900/20"
    : "bg-emerald-100/30 dark:bg-emerald-900/15";

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
          : `${sectionComments.length} annotations on this section`}
      </TooltipContent>
    </Tooltip>
  );
};

/* ── Variable Token inline ── */
const VariableToken = ({ token, values }: { token: string; values: Record<string, string> }) => {
  const value = values[token]?.trim();
  const filled = !!value;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn(
          "font-mono text-xs rounded-sm px-1 py-0.5 cursor-default inline",
          filled
            ? "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
            : "bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300"
        )}>
          {filled ? value : `[${token}]`}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        <span className="font-mono">[{token}]</span> — {filled ? `"${value}"` : "Not set"}
      </TooltipContent>
    </Tooltip>
  );
};

const Doc1Content = ({ comments, onClickHighlight, variableValues }: { comments: Comment[]; onClickHighlight: (ref: string) => void; variableValues: Record<string, string> }) => (
  <>
    <h1 className="text-2xl font-bold text-foreground mb-1">Master Services Agreement</h1>
    <p className="text-xs text-muted-foreground mb-8">Effective Date: <VariableToken token="Effective.Date" values={variableValues} /></p>
    <p className="text-sm leading-relaxed text-foreground/90 mb-6">
      This Master Services Agreement ("Agreement") is entered into by and between{" "}
      <VariableToken token="Client.Name" values={variableValues} /> and{" "}
      <VariableToken token="Sender.Company" values={variableValues} />.
      This Agreement sets forth the terms and conditions under which the
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
        Client shall pay the Service Provider the fees set forth in each Statement of Work,
        for a total contract value of <VariableToken token="Document.Value" values={variableValues} /> payable within
        thirty (30) days of the invoice date. Late payments shall accrue interest at the rate of 1.5% per month.
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
    <div className="mt-12 pt-6 border-t">
      <p className="text-sm font-semibold text-foreground mb-4">Authorized Signatures</p>
      <div className="grid grid-cols-2 gap-8">
        <div className="space-y-2">
          <div className="h-12 border-b border-foreground/30" />
          <p className="text-xs text-foreground/70">
            <VariableToken token="Signer.Name" values={variableValues} />,{" "}
            <VariableToken token="Signer.Title" values={variableValues} /> at{" "}
            <VariableToken token="Signer.Company" values={variableValues} />
          </p>
        </div>
        <div className="space-y-2">
          <div className="h-12 border-b border-foreground/30" />
          <p className="text-xs text-foreground/70">Authorized Representative</p>
        </div>
      </div>
    </div>
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

/* ── AI Suggestion Block ── */
const AiSuggestionBlock = ({
  suggestion,
  onAccept,
  onReject,
}: {
  suggestion: AiSuggestion;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}) => {
  if (suggestion.status !== "pending") return null;

  return (
    <div data-suggestion-id={suggestion.id} className="my-3 animate-in slide-in-from-top-2 duration-300">
      {/* Deletion / old text */}
      {suggestion.type === "replacement" && suggestion.oldText && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-md px-3 py-2 mb-1">
          <div className="flex items-center gap-1 mb-1">
            <Sparkles size={10} className="text-red-500" />
            <span className="text-[10px] text-red-600 font-medium">Remove</span>
          </div>
          <p className="text-sm text-red-700 dark:text-red-300 line-through">{suggestion.oldText}</p>
        </div>
      )}

      {/* Addition / new text */}
      {(suggestion.type === "addition" || suggestion.type === "replacement") && suggestion.newText && (
        <div className="bg-violet-50 dark:bg-violet-900/20 border-l-[3px] border-l-violet-400 rounded-r-md px-3 py-2">
          <div className="flex items-center gap-1 mb-1">
            <Sparkles size={10} className="text-violet-600" />
            <span className="text-[10px] text-violet-600 font-medium">AI Suggestion</span>
          </div>
          <p className="text-sm text-violet-900 dark:text-violet-200">{suggestion.newText}</p>
          <div className="flex items-center justify-end gap-1.5 mt-2">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 text-[10px] px-2 gap-1 text-destructive hover:text-destructive"
              onClick={() => onReject(suggestion.id)}
            >
              <X size={10} /> Reject
            </Button>
            <Button
              size="sm"
              className="h-6 text-[10px] px-2 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => onAccept(suggestion.id)}
            >
              <Check size={10} /> Accept
            </Button>
          </div>
        </div>
      )}

      {/* Deletion only */}
      {suggestion.type === "deletion" && suggestion.oldText && (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-[3px] border-l-red-400 rounded-r-md px-3 py-2">
          <div className="flex items-center gap-1 mb-1">
            <Sparkles size={10} className="text-red-500" />
            <span className="text-[10px] text-red-600 font-medium">AI Suggestion — Remove</span>
          </div>
          <p className="text-sm text-red-700 dark:text-red-300 line-through">{suggestion.oldText}</p>
          <div className="flex items-center justify-end gap-1.5 mt-2">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 text-[10px] px-2 gap-1 text-destructive hover:text-destructive"
              onClick={() => onReject(suggestion.id)}
            >
              <X size={10} /> Reject
            </Button>
            <Button
              size="sm"
              className="h-6 text-[10px] px-2 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => onAccept(suggestion.id)}
            >
              <Check size={10} /> Accept
            </Button>
          </div>
        </div>
      )}
    </div>
  );
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

/* ── Text selection toolbar ── */
const SelectionToolbar = ({
  position,
  onComment,
  onAskAi,
  onDismiss,
}: {
  position: { x: number; y: number };
  onComment: () => void;
  onAskAi: (question: string) => void;
  onDismiss: () => void;
}) => {
  const [showAiInput, setShowAiInput] = useState(false);
  const [aiQuestion, setAiQuestion] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showAiInput) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [showAiInput]);

  const handleSubmit = () => {
    if (aiQuestion.trim()) {
      onAskAi(aiQuestion.trim());
      setShowAiInput(false);
      setAiQuestion("");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.15 }}
      className="fixed z-50 flex items-center gap-0.5 bg-card border shadow-lg rounded-lg px-1 py-1"
      style={{ left: position.x, top: position.y }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {showAiInput ? (
        <div className="flex items-center gap-1 px-1">
          <Sparkles size={14} className="text-primary shrink-0" />
          <input
            ref={inputRef}
            value={aiQuestion}
            onChange={(e) => setAiQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
              if (e.key === "Escape") { setShowAiInput(false); setAiQuestion(""); }
            }}
            placeholder="Ask AI about this text..."
            className="text-xs bg-transparent border-none outline-none w-[200px] text-foreground placeholder:text-muted-foreground"
          />
          <button
            className="h-6 w-6 flex items-center justify-center rounded text-primary hover:bg-primary/10 disabled:opacity-40"
            onClick={handleSubmit}
            disabled={!aiQuestion.trim()}
          >
            <ArrowRight size={12} />
          </button>
        </div>
      ) : (
        <>
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
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="h-8 w-8 flex items-center justify-center rounded-md text-primary hover:bg-primary/10"
                onClick={() => setShowAiInput(true)}
              >
                <Sparkles size={14} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">Ask AI</TooltipContent>
          </Tooltip>
        </>
      )}
    </motion.div>
  );
};

/* ── Floating comment bubble (always visible, expandable inline) ── */
const BUBBLE_STYLES: Record<AnnotationType, { borderClass: string; bgClass: string }> = {
  comment: { borderClass: "border-border", bgClass: "bg-card" },
  suggestion: { borderClass: "border-amber-200", bgClass: "bg-amber-50 dark:bg-amber-950/40" },
  ai_suggestion: { borderClass: "border-violet-200", bgClass: "bg-violet-50 dark:bg-violet-950/40" },
};

const timeAgo = (d: Date) => {
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
};

const CommentBubble = ({
  comment,
  count,
  allComments,
  onAddReply,
}: {
  comment: Comment;
  count: number;
  allComments: Comment[];
  onAddReply: (commentId: string, text: string) => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const [replyText, setReplyText] = useState("");
  const replyRef = useRef<HTMLInputElement>(null);
  const style = BUBBLE_STYLES[comment.annotationType];
  const isResolved = comment.status === "resolved";

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded((prev) => !prev);
    if (!expanded) {
      setTimeout(() => replyRef.current?.focus(), 100);
    }
  };

  const handleReply = () => {
    if (!replyText.trim()) return;
    onAddReply(comment.id, replyText.trim());
    setReplyText("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8 }}
      transition={{ duration: 0.2 }}
      onClick={handleToggle}
      className={cn(
        "cursor-pointer transition-all rounded-lg border shadow-sm overflow-hidden",
        style.borderClass, style.bgClass,
        isResolved && "opacity-40 border-l-emerald-500",
        !isResolved && "border-l-[3px]",
        comment.annotationType === "suggestion" && !isResolved && "border-l-amber-400",
        comment.annotationType === "ai_suggestion" && !isResolved && "border-l-violet-400",
        expanded && "shadow-md z-30"
      )}
      style={{
        maxWidth: expanded ? 280 : 200,
        ...(comment.annotationType === "comment" && !isResolved ? { borderLeftColor: comment.authorColor } : {}),
      }}
    >
      <div className="px-2.5 py-2">
        {/* Type label */}
        {comment.annotationType !== "comment" && (
          <div className="flex items-center gap-1 mb-0.5">
            {comment.annotationType === "ai_suggestion" && <Sparkles size={9} className="text-violet-600" />}
            {comment.annotationType === "suggestion" && <Pencil size={9} className="text-amber-600" />}
            <span className={cn(
              "text-[8px] font-medium uppercase",
              comment.annotationType === "ai_suggestion" ? "text-violet-600" : "text-amber-600"
            )}>
              {comment.annotationType === "ai_suggestion" ? "AI" : "Suggestion"}
            </span>
          </div>
        )}

        {/* Author + time */}
        <div className="flex items-center gap-1">
          <div
            className="h-4 w-4 rounded-full flex items-center justify-center text-white text-[7px] font-semibold flex-shrink-0"
            style={{ backgroundColor: comment.authorColor }}
          >
            {comment.authorInitials}
          </div>
          <span className="text-[10px] font-medium text-foreground truncate">{comment.author.split(" ")[0]}</span>
          <span className="text-[10px] text-muted-foreground ml-auto">{timeAgo(comment.timestamp)}</span>
        </div>

        {/* Comment text */}
        <p className={cn(
          "text-[11px] text-foreground/80 mt-0.5 transition-all duration-200",
          expanded ? "" : "line-clamp-2"
        )}>
          {comment.text}
        </p>

        {/* Collapsed state: reply count / more count */}
        {!expanded && (
          <>
            {comment.replies.length > 0 && (
              <p className="text-[10px] text-muted-foreground mt-0.5">+{comment.replies.length} {comment.replies.length === 1 ? "reply" : "replies"}</p>
            )}
            {count > 1 && (
              <p className="text-[10px] text-muted-foreground mt-0.5">+{count - 1} more</p>
            )}
          </>
        )}

        {/* Expanded state: replies + reply input */}
        {expanded && (
          <div className="mt-2 space-y-2" onClick={(e) => e.stopPropagation()}>
            {/* Show all comments in this section if count > 1 */}
            {count > 1 && allComments.slice(1).map((c) => (
              <div key={c.id} className="border-t border-border/50 pt-2">
                <div className="flex items-center gap-1">
                  <div className="h-3.5 w-3.5 rounded-full flex items-center justify-center text-white text-[6px] font-semibold flex-shrink-0" style={{ backgroundColor: c.authorColor }}>
                    {c.authorInitials}
                  </div>
                  <span className="text-[10px] font-medium text-foreground">{c.author.split(" ")[0]}</span>
                  <span className="text-[10px] text-muted-foreground ml-auto">{timeAgo(c.timestamp)}</span>
                </div>
                <p className="text-[11px] text-foreground/80 mt-0.5">{c.text}</p>
              </div>
            ))}

            {/* Replies */}
            {comment.replies.length > 0 && (
              <div className="border-t border-border/50 pt-2 space-y-1.5">
                {comment.replies.map((r) => (
                  <div key={r.id}>
                    <div className="flex items-center gap-1">
                      <div className="h-3.5 w-3.5 rounded-full flex items-center justify-center text-white text-[6px] font-semibold flex-shrink-0" style={{ backgroundColor: r.authorColor }}>
                        {r.authorInitials}
                      </div>
                      <span className="text-[10px] font-medium text-foreground">{r.author.split(" ")[0]}</span>
                      <span className="text-[10px] text-muted-foreground ml-auto">{timeAgo(r.timestamp)}</span>
                    </div>
                    <p className="text-[11px] text-foreground/80 mt-0.5 pl-5">{r.text}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Reply input */}
            <div className="flex items-center gap-1 pt-1">
              <input
                ref={replyRef}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleReply(); }}
                placeholder="Reply..."
                className="flex-1 text-[11px] bg-background/80 border rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground"
              />
              <button
                onClick={handleReply}
                disabled={!replyText.trim()}
                className="h-6 w-6 flex items-center justify-center rounded-md text-primary hover:bg-primary/10 disabled:opacity-30"
              >
                <ArrowRight size={12} />
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

/* ── Field overlay component ── */
const FieldOverlay = ({
  field,
  isSelected,
  onSelect,
  onRemove,
  onDuplicate,
  onUpdateField,
}: {
  field: PlacedField;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onUpdateField: (id: string, updates: Partial<PlacedField>) => void;
}) => {
  const ft = FIELD_TYPES.find((f) => f.id === field.fieldTypeId);
  const Icon = ft?.icon;
  const label = ft?.label || field.fieldTypeId;

  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const resizeRef = useRef<{ startX: number; startY: number; origW: number; origH: number } | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragRef.current) {
        e.preventDefault();
        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;
        onUpdateField(field.id, {
          x: Math.max(0, dragRef.current.origX + dx),
          y: Math.max(0, dragRef.current.origY + dy),
        });
      }
      if (resizeRef.current) {
        e.preventDefault();
        const dx = e.clientX - resizeRef.current.startX;
        const dy = e.clientY - resizeRef.current.startY;
        onUpdateField(field.id, {
          width: Math.max(40, resizeRef.current.origW + dx),
          height: Math.max(20, resizeRef.current.origH + dy),
        });
      }
    };
    const handleMouseUp = () => {
      dragRef.current = null;
      resizeRef.current = null;
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [field.id, onUpdateField]);

  const handleDragStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: field.x, origY: field.y };
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    resizeRef.current = { startX: e.clientX, startY: e.clientY, origW: field.width, origH: field.height };
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          onClick={(e) => { e.stopPropagation(); onSelect(); }}
          onMouseDown={handleDragStart}
          className={cn(
            "absolute select-none transition-[border-color,box-shadow]",
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
          <div className="flex items-center gap-1 px-2 h-full overflow-hidden pointer-events-none">
            {Icon && <Icon size={11} style={{ color: field.participantColor }} className="flex-shrink-0" />}
            <span className="text-[10px] truncate" style={{ color: field.participantColor }}>
              {label}
            </span>
          </div>

          {isSelected && (
            <div
              onMouseDown={handleResizeStart}
              className="absolute -bottom-0.5 -right-0.5 h-3 w-3 cursor-nwse-resize rounded-sm"
              style={{ backgroundColor: field.participantColor }}
            />
          )}

          {isSelected && (
            <div
              className="absolute -bottom-8 left-0 flex items-center gap-1 bg-card border shadow-sm rounded-md px-1.5 py-0.5 z-30"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
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
              onMouseDown={(e) => e.stopPropagation()}
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
  onOpenAi?: () => void;
  isEsign?: boolean;
}

const EditorCanvas = ({ showToolbar = true, onFieldSelect, onOpenComments, onOpenAi, isEsign }: EditorCanvasProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const docRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [activeDocId, setActiveDocId] = useState<string | null>(MOCK_DOCUMENTS[0].id);
  const [showIndicator, setShowIndicator] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();

  const { placedFields, setPlacedFields, selectedFieldId, setSelectedFieldId, comments, commentsPanelOpen, setPendingCommentRef, setPendingAiQuestion, variableValues, aiSuggestions, setAiSuggestions } = useEditorContext();

  const [selectionToolbar, setSelectionToolbar] = useState<{ x: number; y: number; text: string } | null>(null);

  const pendingSuggestions = aiSuggestions.filter(s => s.status === "pending");

  const handleAcceptSuggestion = useCallback((id: string) => {
    setAiSuggestions(prev => prev.map(s => s.id === id ? { ...s, status: "accepted" as const } : s));
    toast.success("Suggestion accepted");
  }, [setAiSuggestions]);

  const handleRejectSuggestion = useCallback((id: string) => {
    setAiSuggestions(prev => prev.map(s => s.id === id ? { ...s, status: "rejected" as const } : s));
    toast.success("Suggestion rejected");
  }, [setAiSuggestions]);

  const scrollToNextSuggestion = useCallback(() => {
    const pending = aiSuggestions.find(s => s.status === "pending");
    if (pending) {
      const el = document.querySelector(`[data-suggestion-id="${pending.id}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [aiSuggestions]);

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

  const updateField = useCallback((id: string, updates: Partial<PlacedField>) => {
    setPlacedFields((prev) => prev.map((f) => f.id === id ? { ...f, ...updates } : f));
  }, [setPlacedFields]);

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
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) {
      setSelectionToolbar(null);
    }
  }, [selectedFieldId, setSelectedFieldId, onFieldSelect]);

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

  const handleSelectionComment = useCallback(() => {
    if (!selectionToolbar) return;
    setPendingCommentRef(selectionToolbar.text);
    setSelectionToolbar(null);
    window.getSelection()?.removeAllRanges();
    onOpenComments?.();
  }, [selectionToolbar, setPendingCommentRef, onOpenComments]);

  const handleSelectionAskAi = useCallback((question: string) => {
    if (!selectionToolbar) return;
    setPendingAiQuestion({ question, selectedText: selectionToolbar.text });
    setSelectionToolbar(null);
    window.getSelection()?.removeAllRanges();
    onOpenAi?.();
  }, [selectionToolbar, setPendingAiQuestion, onOpenAi]);

  const handleClickHighlight = useCallback((sectionRef: string) => {
    setPendingCommentRef(null);
    onOpenComments?.();
  }, [setPendingCommentRef, onOpenComments]);

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

  // Comments for margin bubbles (ALWAYS visible now)
  const inlineComments = comments.filter((c) => c.type === "inline");
  const commentsBySection = inlineComments.reduce<Record<string, Comment[]>>((acc, c) => {
    (acc[c.sectionRef] = acc[c.sectionRef] || []).push(c);
    return acc;
  }, {});

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

  // Get AI suggestions per section for doc-1
  const suggestionsBySection = aiSuggestions.reduce<Record<string, AiSuggestion[]>>((acc, s) => {
    (acc[s.sectionRef] = acc[s.sectionRef] || []).push(s);
    return acc;
  }, {});

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

        <AnimatePresence>
          {selectionToolbar && (
            <SelectionToolbar
              position={{ x: selectionToolbar.x, y: selectionToolbar.y }}
              onComment={handleSelectionComment}
              onAskAi={handleSelectionAskAi}
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
                        <>
                          <Doc1Content comments={comments} onClickHighlight={handleClickHighlight} variableValues={variableValues} />
                          {/* AI Suggestion blocks after Section 2 */}
                          {(suggestionsBySection["Section 2: Scope of Services"] || []).map(s => (
                            <AiSuggestionBlock
                              key={s.id}
                              suggestion={s}
                              onAccept={handleAcceptSuggestion}
                              onReject={handleRejectSuggestion}
                            />
                          ))}
                          {/* AI Suggestion blocks after Section 5 */}
                          {(suggestionsBySection["Section 5: Termination"] || []).map(s => (
                            <AiSuggestionBlock
                              key={s.id}
                              suggestion={s}
                              onAccept={handleAcceptSuggestion}
                              onReject={handleRejectSuggestion}
                            />
                          ))}
                        </>
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
                        onUpdateField={updateField}
                      />
                    ))}
                  </div>

                  {/* Floating comment bubbles — ALWAYS visible, expandable inline */}
                  {doc.id === "doc-1" && Object.keys(commentsBySection).length > 0 && (
                    <div className="absolute top-0 -right-[220px] hidden lg:-right-[230px] lg:block" style={{ width: 220 }}>
                      <AnimatePresence>
                        {Object.entries(commentsBySection).map(([sectionRef, sectionComments]) => {
                          const yPos = sectionPositions[sectionRef];
                          if (yPos === undefined) return null;
                          const first = sectionComments[0];
                          return (
                            <div key={sectionRef} style={{ position: "absolute", top: yPos }}>
                              {/* Connector line */}
                              <div
                                className="absolute top-3 -left-3 w-3 h-px"
                                style={{ backgroundColor: first.authorColor }}
                              />
                              <CommentBubble
                                comment={first}
                                count={sectionComments.length}
                                allComments={sectionComments}
                                onAddReply={handleAddReply}
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

          {/* Pending suggestions counter */}
          {pendingSuggestions.length > 0 && (
            <div className="sticky bottom-4 flex justify-center pointer-events-none z-20">
              <button
                onClick={scrollToNextSuggestion}
                className="pointer-events-auto bg-violet-100 text-violet-700 border border-violet-200 text-xs font-medium rounded-full px-3 py-1 shadow-sm hover:bg-violet-200 transition-colors flex items-center gap-1.5"
              >
                <Sparkles size={12} />
                {pendingSuggestions.length} pending suggestion{pendingSuggestions.length !== 1 ? "s" : ""}
              </button>
            </div>
          )}

          <div className="h-20" />
        </div>
      </div>
    </div>
  );
};

export default EditorCanvas;
