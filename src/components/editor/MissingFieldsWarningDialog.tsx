import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { AlertTriangle, FileText, Paperclip, Info } from "lucide-react";
import type { Participant } from "./EditorParticipantsPanel";
import type { AcknowledgmentLevel } from "./EditorContext";

const ROLE_STYLES: Record<string, string> = {
  signer: "bg-[hsl(var(--brand-indigo))]/15 text-[hsl(var(--brand-indigo))] border-[hsl(var(--brand-indigo))]/30",
  approver: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
};

/* ── Types ── */
export interface DocumentIssue {
  documentId: string;
  documentName: string;
  documentType: "primary" | "supplement" | "attachment";
  issueType: "no_fields_primary" | "no_fields_supplement";
}

export interface ParticipantIssue {
  participant: Participant;
  issues: DocumentIssue[];
}

/* ── Small pulsing illustration for primary no-fields ── */
const MiniFieldIllustration = () => (
  <div className="flex items-center justify-center h-[80px]">
    <svg width="60" height="72" viewBox="0 0 60 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="2" width="52" height="68" rx="3" className="fill-card stroke-border" strokeWidth="1.5" />
      <rect x="12" y="14" width="36" height="3" rx="1.5" className="fill-muted" />
      <rect x="12" y="22" width="28" height="3" rx="1.5" className="fill-muted" />
      <rect x="10" y="34" width="40" height="10" rx="2"
        className="stroke-amber-400 dark:stroke-amber-500" strokeWidth="1.5" strokeDasharray="4 3" fill="none">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
      </rect>
      <rect x="10" y="50" width="40" height="10" rx="2"
        className="stroke-amber-400 dark:stroke-amber-500" strokeWidth="1.5" strokeDasharray="4 3" fill="none">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" begin="0.5s" />
      </rect>
    </svg>
  </div>
);

const ACK_OPTIONS: { value: AcknowledgmentLevel; label: string; desc: string }[] = [
  { value: "none", label: "No action needed", desc: "Document is available for reference only" },
];

interface MissingFieldsWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participantIssues: ParticipantIssue[];
  onGoBack: () => void;
  onAddFields: (participantId: string) => void;
  onContinue: (acknowledgments: Record<string, Record<string, AcknowledgmentLevel>>) => void;
}

const MissingFieldsWarningDialog = ({
  open,
  onOpenChange,
  participantIssues,
  onGoBack,
  onAddFields,
  onContinue,
}: MissingFieldsWarningDialogProps) => {
  // Local ack state: docId -> participantId -> level
  const [ackState, setAckState] = useState<Record<string, Record<string, AcknowledgmentLevel>>>({});

  const getAck = (docId: string, pId: string): AcknowledgmentLevel =>
    ackState[docId]?.[pId] ?? "none";

  const setAck = (docId: string, pId: string, level: AcknowledgmentLevel) => {
    setAckState((prev) => ({
      ...prev,
      [docId]: { ...prev[docId], [pId]: level },
    }));
  };

  const handleContinue = () => {
    onContinue(ackState);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] max-h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <DialogTitle className="text-base">Review before sending</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Some participants need your attention</p>
            </div>
          </div>
          <DialogDescription className="sr-only">Review participant field assignments and document acknowledgments</DialogDescription>
        </DialogHeader>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-4">
          {participantIssues.map(({ participant: p, issues }) => (
            <div key={p.id} className="rounded-lg border bg-card overflow-hidden">
              {/* Card header */}
              <div className="flex items-center gap-2 px-4 py-3 bg-muted/30 border-b">
                <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                <span className="text-sm font-medium">{p.name}</span>
                <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 h-4 font-medium border", ROLE_STYLES[p.role])}>
                  {p.role === "signer" ? "Signer" : "Approver"}
                </Badge>
              </div>

              {/* Issues */}
              <div className="p-4 space-y-0">
                {issues.map((issue, idx) => (
                  <div key={`${issue.documentId}-${issue.issueType}`}>
                    {idx > 0 && <Separator className="my-3 border-dashed" />}

                    {issue.issueType === "no_fields_primary" ? (
                      /* Case A: No fields on primary */
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <FileText size={14} className="text-muted-foreground" />
                          <span className="font-medium">{issue.documentName}</span>
                          <Badge variant="outline" className="text-[9px] px-1.5 h-4 bg-primary/10 text-primary border-primary/20">Primary</Badge>
                        </div>
                        <MiniFieldIllustration />
                        <p className="text-xs text-muted-foreground">
                          No fields placed. This signer will place their own signature and fields during the signing session.
                        </p>
                      </div>
                    ) : (
                      /* Case B: Visible to supplement/attachment with no fields */
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Paperclip size={14} className="text-muted-foreground" />
                          <span className="font-medium">{issue.documentName}</span>
                          <Badge variant="outline" className={cn(
                            "text-[9px] px-1.5 h-4",
                            issue.documentType === "supplement"
                              ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                              : "bg-muted text-muted-foreground border-border"
                          )}>
                            {issue.documentType === "supplement" ? "Supplement" : "Attachment"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          What should {p.name.split(" ")[0]} do with this document?
                        </p>
                        <RadioGroup
                          value={getAck(issue.documentId, p.id)}
                          onValueChange={(v) => setAck(issue.documentId, p.id, v as AcknowledgmentLevel)}
                          className="space-y-2"
                        >
                          {ACK_OPTIONS.map((opt) => (
                            <div key={opt.value} className="flex items-start gap-2.5">
                              <RadioGroupItem value={opt.value} id={`${issue.documentId}-${p.id}-${opt.value}`} className="mt-0.5" />
                              <Label htmlFor={`${issue.documentId}-${p.id}-${opt.value}`} className="cursor-pointer">
                                <span className="text-sm font-medium">{opt.label}</span>
                                <p className="text-[11px] text-muted-foreground mt-0.5">{opt.desc}</p>
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Info note */}
          <div className="flex items-start gap-2 rounded-lg p-3 bg-muted/50 border">
            <Info size={14} className="text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              When signers don't have pre-placed fields, they'll see a toolbar to add their own signature, initials, and other fields while reviewing the document.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex items-center justify-between flex-shrink-0">
          <Button variant="outline" size="sm" onClick={onGoBack}>Go back</Button>
          <Button size="sm" onClick={handleContinue}>Continue to send</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MissingFieldsWarningDialog;
