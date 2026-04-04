import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tick01Icon } from "@hugeicons/core-free-icons";

interface StepIndicatorProps {
  currentStep: 1 | 2 | 3;
}

const STEPS = [
  { num: 1, label: "Add Documents" },
  { num: 2, label: "Add Participants" },
  { num: 3, label: "Prepare & Send" },
];

const StepIndicator = ({ currentStep }: StepIndicatorProps) => (
  <div className="hidden sm:flex items-center gap-2">
    {STEPS.map((step, i) => {
      const isDone = step.num < currentStep;
      const isActive = step.num === currentStep;
      const isFuture = step.num > currentStep;

      return (
        <div key={step.num} className="flex items-center gap-2">
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
                <span className={cn(isActive ? "text-primary-foreground" : "")}>{step.num}</span>
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
              {step.label}
            </span>
          </div>
        </div>
      );
    })}
  </div>
);

export default StepIndicator;
