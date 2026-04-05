import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { AlertTriangle, Link as LinkIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import StepIndicator, { type FlowMode } from "@/components/StepIndicator";
import EditorParticipantsPanel from "@/components/editor/EditorParticipantsPanel";
import { useEditorContext } from "@/components/editor/EditorContext";
import { toast } from "sonner";

const ParticipantsPageInner = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { participants } = useEditorContext();
  const [title] = useState("Untitled Document");
  const [showCloseDialog, setShowCloseDialog] = useState(false);

  const flowMode = searchParams.get("mode") as "correction" | "followup" | null;
  const correctionDocId = searchParams.get("id");
  const followUpParentId = searchParams.get("parentId");
  const followUpChildType = searchParams.get("childType") || "amendment";
  const relatedTo = searchParams.get("relatedTo");
  const isCorrection = flowMode === "correction";
  const isFollowUp = flowMode === "followup";
  const isRelated = !!relatedTo && !flowMode;

  const stepMode: FlowMode = isCorrection ? "correction" : isFollowUp ? "followup" : "normal";

  const hasSignerOrApprover = participants.some(
    (p) => p.role === "signer" || p.role === "approver"
  );

  // Build URL params to carry forward to editor
  const buildEditorUrl = () => {
    const params = new URLSearchParams();
    if (flowMode) params.set("mode", flowMode);
    if (correctionDocId) params.set("id", correctionDocId);
    if (followUpParentId) params.set("parentId", followUpParentId);
    if (followUpChildType && isFollowUp) params.set("childType", followUpChildType);
    if (relatedTo) params.set("relatedTo", relatedTo);
    return `/editor${params.toString() ? `?${params.toString()}` : ""}`;
  };

  // Build back URL to /create with same params
  const buildBackUrl = () => {
    const params = new URLSearchParams();
    if (flowMode) params.set("mode", flowMode);
    if (correctionDocId) params.set("id", correctionDocId);
    if (followUpParentId) params.set("parentId", followUpParentId);
    if (followUpChildType && isFollowUp) params.set("childType", followUpChildType);
    if (relatedTo) params.set("relatedTo", relatedTo);
    return `/create${params.toString() ? `?${params.toString()}` : ""}`;
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Correction/Follow-up Banners */}
      {isCorrection && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-300 dark:border-amber-800 px-4 py-2 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-sm font-medium text-amber-800 dark:text-amber-300">
            <AlertTriangle size={16} />
            Correcting: Office Lease Renewal. Signers are paused until you save or discard.
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" className="h-7 text-xs" onClick={() => { toast.success("Corrections saved — signing resumed"); navigate("/"); }}>Save &amp; resume signing</Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { toast("Changes discarded"); navigate("/"); }}>Discard changes</Button>
          </div>
        </div>
      )}
      {isFollowUp && (
        <div className="bg-blue-50 dark:bg-blue-950/30 border-b border-blue-300 dark:border-blue-800 px-4 py-2 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-sm font-medium text-blue-800 dark:text-blue-300">
            <LinkIcon size={16} />
            Follow-up to: Annual Review — Acme Corp
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { toast("Follow-up cancelled"); navigate("/"); }}>Cancel follow-up</Button>
          </div>
        </div>
      )}
      {isRelated && (
        <div className="bg-muted/50 border-b px-4 py-2 flex items-center gap-2 text-xs text-muted-foreground shrink-0">
          <LinkIcon size={12} />
          Related to: Annual Review — Acme Corp
        </div>
      )}

      {/* Top bar */}
      <header className="h-14 border-b flex items-center justify-between px-4 flex-shrink-0 bg-card">
        {/* Left */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0"
            onClick={() => setShowCloseDialog(true)}
          >
            <X className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold truncate max-w-[200px]">{title}</span>
          <Badge
            variant="secondary"
            className="text-[10px] px-1.5 py-0 h-5 font-medium text-muted-foreground"
          >
            {isCorrection ? "Correcting" : "Draft"}
          </Badge>
        </div>

        {/* Center — Step indicator */}
        <StepIndicator currentStep={2} mode={stepMode} />

        {/* Right */}
        <div className="flex items-center gap-2 flex-1 justify-end">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => navigate(buildBackUrl())}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <Button
            size="sm"
            className="h-8 text-xs gap-1.5"
            disabled={!hasSignerOrApprover}
            onClick={() => navigate(buildEditorUrl())}
          >
            <span className="hidden sm:inline">Next: {isCorrection ? "Review & Save" : "Prepare Document"}</span>
            <span className="sm:hidden">Next</span>
            <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
          </Button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[700px] mx-auto px-4 py-8">
          {isFollowUp && (
            <div className="mb-4 bg-muted/30 border rounded-lg p-3 text-xs text-muted-foreground flex items-center gap-2">
              <LinkIcon size={12} />
              Participants copied from Annual Review — Acme Corp. You can modify them for this follow-up.
            </div>
          )}
          <h1 className="text-xl font-semibold mb-1">{isCorrection ? "Participants" : "Add Participants"}</h1>
          <p className="text-sm text-muted-foreground mb-6">
            {isCorrection
              ? "Review and modify participants. Signed participants are locked."
              : "Add people who need to sign, review, or receive this document"}
          </p>
          <EditorParticipantsPanel />
        </div>
      </div>
    </div>
  );
};

export default ParticipantsPageInner;
