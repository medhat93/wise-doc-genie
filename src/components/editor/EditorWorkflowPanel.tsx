import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { FileText, Search, ShieldCheck, UserCheck } from "lucide-react";

interface WorkflowStep {
  step: number;
  name: string;
  assignee: string;
  status: "complete" | "not-started";
  icon: React.ElementType;
}

const WORKFLOWS: Record<string, WorkflowStep[]> = {
  standard: [
    { step: 0, name: "Drafting", assignee: "You", status: "complete", icon: FileText },
    { step: 1, name: "Legal Review", assignee: "Unassigned", status: "not-started", icon: Search },
    { step: 2, name: "Manager Approval", assignee: "Unassigned", status: "not-started", icon: UserCheck },
  ],
  legal: [
    { step: 0, name: "Drafting", assignee: "You", status: "complete", icon: FileText },
    { step: 1, name: "Paralegal Review", assignee: "Unassigned", status: "not-started", icon: Search },
    { step: 2, name: "Senior Legal Review", assignee: "Unassigned", status: "not-started", icon: ShieldCheck },
    { step: 3, name: "Legal Director Approval", assignee: "Unassigned", status: "not-started", icon: UserCheck },
  ],
  executive: [
    { step: 0, name: "Drafting", assignee: "You", status: "complete", icon: FileText },
    { step: 1, name: "Department Review", assignee: "Unassigned", status: "not-started", icon: Search },
    { step: 2, name: "VP Approval", assignee: "Unassigned", status: "not-started", icon: UserCheck },
    { step: 3, name: "Legal Review", assignee: "Unassigned", status: "not-started", icon: ShieldCheck },
    { step: 4, name: "Executive Sign-off", assignee: "Unassigned", status: "not-started", icon: UserCheck },
  ],
};

const EditorWorkflowPanel = () => {
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>("none");

  const steps = selectedWorkflow !== "none" ? WORKFLOWS[selectedWorkflow] || [] : [];
  const hasUnassigned = steps.some((s) => s.step > 0 && s.assignee === "Unassigned");

  return (
    <div className="flex flex-col h-full -m-4 p-4">
      <p className="text-xs text-muted-foreground mb-4">Select and configure an approval workflow</p>

      {/* Workflow selector */}
      <div className="mb-5">
        <label className="text-xs font-medium text-foreground mb-1.5 block">Choose a workflow</label>
        <Select value={selectedWorkflow} onValueChange={setSelectedWorkflow}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Select workflow" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No workflow</SelectItem>
            <SelectItem value="standard">Standard Approval — 2 Steps</SelectItem>
            <SelectItem value="legal">Legal Review — 3 Steps</SelectItem>
            <SelectItem value="executive">Executive Approval — 4 Steps</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Workflow preview */}
      {steps.length > 0 && (
        <div className="flex-1 overflow-y-auto mb-4">
          <div className="relative">
            {steps.map((step, i) => {
              const Icon = step.icon;
              const isFirst = step.step === 0;
              const isLast = i === steps.length - 1;

              return (
                <div key={step.step} className="flex gap-3 relative">
                  {/* Vertical line */}
                  {!isLast && (
                    <div className="absolute left-[15px] top-[32px] bottom-0 w-px border-l border-dashed border-border" />
                  )}

                  {/* Step circle */}
                  <div
                    className={cn(
                      "h-[30px] w-[30px] rounded-full flex items-center justify-center flex-shrink-0 z-10",
                      isFirst
                        ? "bg-primary/15 text-primary"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Icon size={14} />
                  </div>

                  {/* Step content */}
                  <div className={cn("flex-1 pb-5", i === steps.length - 1 && "pb-0")}>
                    <div className="bg-muted/50 border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-foreground">
                          Step {step.step}: {step.name}
                        </span>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-[10px] h-5",
                            isFirst
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {isFirst ? "Current" : "Not started"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {isFirst ? (
                          <span className="text-xs text-muted-foreground">{step.assignee}</span>
                        ) : (
                          <>
                            <span className="text-xs text-muted-foreground">{step.assignee}</span>
                            <span className="text-[11px] text-primary hover:underline cursor-pointer">
                              Select assignee
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {selectedWorkflow === "none" && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">No workflow selected</p>
            <p className="text-xs text-muted-foreground/70">Choose a workflow above to add approval steps</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex-shrink-0 space-y-2">
        <Button
          className="w-full"
          size="sm"
          disabled={selectedWorkflow === "none" || hasUnassigned}
        >
          Send for Approval
        </Button>
        <p className="text-[11px] text-muted-foreground text-center">
          Workflow will start before sending for signature
        </p>
      </div>
    </div>
  );
};

export default EditorWorkflowPanel;
