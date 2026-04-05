import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import StepIndicator from "@/components/StepIndicator";
import EditorParticipantsPanel from "@/components/editor/EditorParticipantsPanel";
import { useEditorContext } from "@/components/editor/EditorContext";

const ParticipantsPageInner = () => {
  const navigate = useNavigate();
  const { participants } = useEditorContext();
  const [title] = useState("Untitled Document");

  const hasSignerOrApprover = participants.some(
    (p) => p.role === "signer" || p.role === "approver"
  );

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top bar */}
      <header className="h-14 border-b flex items-center justify-between px-4 flex-shrink-0 bg-card">
        {/* Left */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0"
            onClick={() => navigate("/create")}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
          </Button>
          <span className="text-sm font-semibold truncate max-w-[200px]">{title}</span>
          <Badge
            variant="secondary"
            className="text-[10px] px-1.5 py-0 h-5 font-medium text-muted-foreground"
          >
            Draft
          </Badge>
        </div>

        {/* Center — Step indicator */}
        <StepIndicator currentStep={2} />

        {/* Right */}
        <div className="flex items-center gap-2 flex-1 justify-end">
          <Button
            size="sm"
            className="h-8 text-xs gap-1.5"
            disabled={!hasSignerOrApprover}
            onClick={() => navigate("/editor")}
          >
            <span className="hidden sm:inline">Next: Prepare Document</span>
            <span className="sm:hidden">Next</span>
            <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
          </Button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[700px] mx-auto px-4 py-8">
          <h1 className="text-xl font-semibold mb-1">Add Participants</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Add people who need to sign, review, or receive this document
          </p>
          <EditorParticipantsPanel />
        </div>
      </div>
    </div>
  );
};

export default ParticipantsPageInner;
