import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tick01Icon } from "@hugeicons/core-free-icons";

export type FlowMode = "normal" | "correction" | "followup";

interface StepIndicatorProps {
  currentStep: 1 | 2 | 3;
  mode?: FlowMode;
}

const STEP_LABELS: Record<FlowMode, string[]> = {
  normal: ["Add Documents", "Add Participants", "Prepare & Send"],
  correction: ["Documents", "Participants", "Review & Save"],
  followup: ["Add Documents", "Participants", "Prepare & Send"],
};

const StepIndicator = ({ currentStep, mode = "normal" }: StepIndicatorProps) => {
  const labels = STEP_LABELS[mode];

  return (
    <div className="hidden sm:flex items-center gap-2">
      {labels.map((label, i) => {
        const num = i + 1;
        const isDone = num < currentStep;
        const isActive = num === currentStep;
        const isFuture = num > currentStep;

        return (
          <div key={num} className="flex items-center gap-2">
            {i > 0 && <div className="w-6 h-px bg-border" />}
            <div className="flex items-center gap-1.5">
              <div
                className={cn(
                  "h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold",
                  isDone && "bg-primary",
                  isActive && "bg-primary",
                  isFuture && "border-2 border-muted-foreground/30 text-muted-foreground/50"
                )}
              >
                {isDone ? (
                  <HugeiconsIcon icon={Tick01Icon} size={12} className="text-primary-foreground" />
                ) : (
                  <span className={cn(isActive ? "text-primary-foreground" : "")}>{num}</span>
                )}
              </div>
              <span
                className={cn(
                  "text-xs",
                  isDone && "text-muted-foreground",
                  isActive && "font-medium text-foreground",
                  isFuture && "text-muted-foreground/50"
                )}
              >
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StepIndicator;
