import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, ArrowRight, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogPortal,
} from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import EditorParticipantsPanel from "@/components/editor/EditorParticipantsPanel";
import { useEditorContext } from "@/components/editor/EditorContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ParticipantsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** If true, we're reopening from the editor — "Done" button instead of "Continue to editor" */
  fromEditor?: boolean;
}

const ParticipantsDialog = ({ open, onOpenChange, fromEditor = false }: ParticipantsDialogProps) => {
  const navigate = useNavigate();
  const { participants, setParticipants } = useEditorContext();

  const handleSkip = () => {
    onOpenChange(false);
    if (!fromEditor) {
      navigate("/editor");
    }
  };

  const handleContinue = () => {
    onOpenChange(false);
    if (!fromEditor) {
      navigate("/editor");
    }
  };

  const handleQuickAddSelf = () => {
    if (participants.some((p) => p.email === "ahmed@signit.sa")) {
      toast.error("You are already added as a participant");
      return;
    }
    const COLORS = ["#4F46E5", "#DC2626", "#059669", "#D97706", "#7C3AED", "#0891B2", "#BE185D", "#65A30D"];
    const maxOrder = Math.max(0, ...participants.filter(p => p.role === "signer").map(p => p.order));
    setParticipants((prev) => [
      ...prev,
      {
        id: `p${Date.now()}`,
        name: "Ahmad Medhat",
        email: "ahmed@signit.sa",
        role: "signer" as const,
        color: COLORS[participants.length % COLORS.length],
        order: maxOrder + 1,
        language: "en" as const,
        sendingMethod: "email" as const,
        needsVerification: false,
      },
    ]);
    toast.success("Added as sole signer");
    onOpenChange(false);
    if (!fromEditor) {
      navigate("/editor");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/50" />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-[50%] top-[50%] z-50 w-full max-w-[700px] translate-x-[-50%] translate-y-[-50%] bg-card rounded-xl shadow-2xl overflow-hidden flex flex-col",
            "max-h-[85vh]",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]"
          )}
        >
          {/* Header */}
          <div className="p-6 border-b flex-shrink-0">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold">Add Participants</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Add the people who need to sign, review, or receive this document
                </p>
              </div>
              <DialogPrimitive.Close asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 -mr-2">
                  <X className="h-4 w-4" />
                </Button>
              </DialogPrimitive.Close>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Quick add shortcut */}
            <button
              onClick={handleQuickAddSelf}
              className="w-full mb-4 border rounded-lg p-3 bg-muted/30 hover:bg-muted/50 transition-colors flex items-center justify-between group"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">I will sign it by myself only</span>
              </div>
              <ArrowRight size={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>

            <EditorParticipantsPanel />
          </div>

          {/* Footer */}
          <div className="p-4 border-t flex items-center justify-end gap-3 flex-shrink-0">
            {participants.length === 0 && (
              <span className="text-xs text-muted-foreground mr-auto">
                You can add participants later from the editor
              </span>
            )}
            <Button variant="outline" size="sm" className="text-xs" onClick={handleSkip}>
              Skip for now
            </Button>
            <Button
              size="sm"
              className="gap-1.5 bg-[hsl(var(--brand-indigo))] hover:bg-[hsl(var(--brand-indigo))]/90"
              onClick={handleContinue}
              disabled={participants.length === 0}
            >
              Save and continue
              <ArrowRight size={14} />
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
};

export default ParticipantsDialog;
