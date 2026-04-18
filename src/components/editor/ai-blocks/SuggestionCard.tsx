import { useState } from "react";
import { ChevronRight, Check, X, RefreshCw, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import CitationPill from "./CitationPill";
import { jumpToSection } from "./aiBlockUtils";

export type Severity = "Critical" | "Medium" | "Low" | "Info";

const SEVERITY_STYLES: Record<Severity, string> = {
  Critical: "bg-destructive/10 text-destructive border-destructive/20",
  Medium: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  Low: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20",
  Info: "bg-muted text-muted-foreground border-border",
};

export interface SuggestionCardProps {
  severity: Severity;
  title: string;
  description?: string;
  citation?: string;
  oldText?: string;
  newText: string;
  reasoning?: string;
  onApply?: () => void;
  onDismiss?: () => void;
  onRevise?: () => void;
}

const SuggestionCard = ({
  severity,
  title,
  description,
  citation,
  oldText,
  newText,
  reasoning,
  onApply,
  onDismiss,
  onRevise,
}: SuggestionCardProps) => {
  const [open, setOpen] = useState(false);
  const [resolved, setResolved] = useState<"applied" | "dismissed" | null>(null);

  const handleApply = () => {
    setResolved("applied");
    onApply?.();
    toast.success("Suggestion applied as tracked change");
  };
  const handleDismiss = () => {
    setResolved("dismissed");
    onDismiss?.();
    toast("Suggestion dismissed");
  };
  const handleRevise = () => {
    onRevise?.();
    toast("Tell Signit AI how to revise this");
  };

  return (
    <div
      className={cn(
        "rounded-xl border bg-background/60 backdrop-blur-sm mt-2 overflow-hidden transition-opacity",
        resolved === "dismissed" && "opacity-50"
      )}
    >
      {/* Header */}
      <div className="px-3 pt-2.5 pb-2">
        <div className="flex items-center gap-2 mb-1.5">
          <span
            className={cn(
              "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide border",
              SEVERITY_STYLES[severity]
            )}
          >
            {severity}
          </span>
          {citation && <CitationPill label={citation} />}
        </div>
        <div className="text-xs font-semibold text-foreground leading-snug">{title}</div>
        {description && (
          <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{description}</div>
        )}
      </div>

      {/* Diff preview */}
      <div className="px-3 pb-2 space-y-1">
        {oldText && (
          <div className="text-[11px] leading-snug rounded-md bg-destructive/5 px-2 py-1.5 text-foreground/80">
            <span className="line-through decoration-destructive/70 decoration-[1.5px]">
              {oldText}
            </span>
          </div>
        )}
        <div className="text-[11px] leading-snug rounded-md bg-emerald-500/10 px-2 py-1.5 text-foreground">
          <span className="text-emerald-700 dark:text-emerald-400">{newText}</span>
        </div>
      </div>

      {/* Reasoning collapsible */}
      {reasoning && (
        <div className="px-3 pb-2">
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronRight size={11} className={cn("transition-transform", open && "rotate-90")} />
            Reasoning
          </button>
          {open && (
            <div className="mt-1.5 text-[11px] text-muted-foreground leading-snug pl-3.5 border-l-2 border-border">
              {reasoning}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-border/60 bg-muted/20">
        <div className="flex items-center gap-1">
          <button
            disabled={!!resolved}
            onClick={handleApply}
            className={cn(
              "inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium",
              "bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            )}
          >
            <Check size={11} />
            {resolved === "applied" ? "Applied" : "Apply"}
          </button>
          <button
            disabled={!!resolved}
            onClick={handleDismiss}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <X size={11} />
            Dismiss
          </button>
          <button
            disabled={!!resolved}
            onClick={handleRevise}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-primary hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw size={11} />
            Revise
          </button>
        </div>
        {citation && (
          <button
            onClick={() => jumpToSection(citation)}
            className="inline-flex items-center gap-0.5 text-[10px] font-medium text-primary hover:underline"
          >
            Jump to section
            <ArrowRight size={10} />
          </button>
        )}
      </div>
    </div>
  );
};

export default SuggestionCard;
