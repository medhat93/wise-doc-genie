import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { AlertTriangle, FileText, HelpCircle, Info } from "lucide-react";
import type { Participant } from "./EditorParticipantsPanel";

const ROLE_STYLES: Record<string, string> = {
  signer: "bg-[hsl(var(--brand-indigo))]/15 text-[hsl(var(--brand-indigo))] border-[hsl(var(--brand-indigo))]/30",
  approver: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
};

interface MissingFieldsWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  affectedParticipants: Participant[];
  allSignersAffected: boolean;
  onGoBack: () => void;
  onSendAnyway: () => void;
}

/* ── Animated illustration ── */
const WarningIllustration = ({ allEmpty }: { allEmpty: boolean }) => (
  <div className="flex items-center justify-center h-[140px] relative">
    {/* Document */}
    <div className="relative">
      <svg width="80" height="100" viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Document body */}
        <rect x="4" y="4" width="72" height="92" rx="4" className="fill-card stroke-border" strokeWidth="2" />
        {/* Lines */}
        <rect x="16" y="20" width="48" height="4" rx="2" className="fill-muted" />
        <rect x="16" y="30" width="36" height="4" rx="2" className="fill-muted" />
        <rect x="16" y="40" width="42" height="4" rx="2" className="fill-muted" />
        {/* Dotted field placeholders */}
        <rect
          x="14" y="56" width="52" height="14" rx="3"
          className="stroke-amber-400 dark:stroke-amber-500"
          strokeWidth="1.5"
          strokeDasharray="4 3"
          fill="none"
        >
          <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite" />
        </rect>
        <rect
          x="14" y="76" width="52" height="14" rx="3"
          className="stroke-amber-400 dark:stroke-amber-500"
          strokeWidth="1.5"
          strokeDasharray="4 3"
          fill="none"
        >
          <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite" begin="0.5s" />
        </rect>
      </svg>
    </div>

    {/* Person with question mark */}
    <div className="absolute right-[calc(50%-70px)] bottom-3">
      <div className="relative">
        <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="8" r="4" className="fill-amber-500 dark:fill-amber-400" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" className="stroke-amber-500 dark:stroke-amber-400" strokeWidth="2" strokeLinecap="round" fill="none" />
          </svg>
        </div>
        <div className="absolute -top-5 left-1/2 -translate-x-1/2">
          <span className="text-amber-500 dark:text-amber-400 font-bold text-lg">
            <span className="inline-block animate-bounce">?</span>
          </span>
        </div>
      </div>
    </div>
  </div>
);

const MissingFieldsWarningDialog = ({
  open,
  onOpenChange,
  affectedParticipants,
  allSignersAffected,
  onGoBack,
  onSendAnyway,
}: MissingFieldsWarningDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400" />
            </div>
            <DialogTitle className="text-base">
              {allSignersAffected ? "No fields placed for any signer" : "Some participants have no fields"}
            </DialogTitle>
          </div>
          <DialogDescription className="sr-only">Warning about missing field placements</DialogDescription>
        </DialogHeader>

        {/* Illustration */}
        <WarningIllustration allEmpty={allSignersAffected} />

        {/* Warning text */}
        <p className="text-sm text-muted-foreground">
          The following participants don't have any fields assigned to them. They will need to place their own signature and fields during the signing session.
        </p>

        {/* Affected participant list */}
        <div className="space-y-1.5">
          {affectedParticipants.map((p) => (
            <div key={p.id} className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-card">
              <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
              <span className="text-sm font-medium flex-1 truncate">{p.name}</span>
              <Badge
                variant="outline"
                className={cn("text-[9px] px-1.5 py-0 h-4 font-medium border", ROLE_STYLES[p.role])}
              >
                {p.role === "signer" ? "Signer" : "Approver"}
              </Badge>
              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">0 fields</span>
            </div>
          ))}
        </div>

        {/* Info note */}
        <div className="flex items-start gap-2 rounded-lg p-3 bg-muted/50 border">
          <Info size={14} className="text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            When signers don't have pre-placed fields, they'll see a toolbar to add their own signature, initials, and other fields while reviewing the document. This works but gives you less control over where fields are placed.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          <Button variant="outline" size="sm" className="font-medium" onClick={onGoBack}>
            Go back and add fields
          </Button>
          <Button size="sm" onClick={onSendAnyway}>
            Send anyway
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MissingFieldsWarningDialog;
