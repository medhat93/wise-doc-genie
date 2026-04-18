import { useState } from "react";
import { ChevronDown, Sparkles } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ReviewSetup {
  perspective: string;
  scope: string;
  playbook: string;
  output: string;
}

export const REVIEW_OPTIONS = {
  perspective: ["Client", "Vendor", "Neutral"],
  scope: ["Full document", "Selected text", "Current section"],
  playbook: ["Vendor MSA Playbook", "Standard NDA Playbook", "No playbook"],
  output: ["Comments + redlines", "Comments only", "Redlines only", "Summary only"],
};

interface InlineFieldProps {
  value: string;
  options: string[];
  onChange: (v: string) => void;
}

const InlineField = ({ value, options, onChange }: InlineFieldProps) => {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="inline-flex items-center gap-0.5 font-semibold text-foreground bg-primary/10 hover:bg-primary/20 transition-colors rounded px-1.5 py-0.5 mx-0.5">
          {value}
          <ChevronDown size={10} className="opacity-60" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-52 p-1">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => {
              onChange(opt);
              setOpen(false);
            }}
            className={cn(
              "w-full text-left px-2 py-1.5 rounded text-xs hover:bg-accent transition-colors",
              opt === value && "bg-primary/10 text-primary font-medium"
            )}
          >
            {opt}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
};

export interface ReviewSetupCardProps {
  setup: ReviewSetup;
  onChange: (setup: ReviewSetup) => void;
  onStart: () => void;
  onEdit?: () => void;
  started?: boolean;
}

const ReviewSetupCard = ({
  setup,
  onChange,
  onStart,
  onEdit,
  started,
}: ReviewSetupCardProps) => {
  const update = (key: keyof ReviewSetup, value: string) =>
    onChange({ ...setup, [key]: value });

  return (
    <div className="rounded-xl border bg-background/60 mt-2 overflow-hidden">
      <div className="px-3 pt-2.5 pb-1 flex items-center gap-1.5">
        <Sparkles size={11} className="text-primary" />
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Review setup
        </span>
      </div>
      <div className="px-3 pb-3 text-xs leading-relaxed text-foreground/90">
        I'll review as{" "}
        <InlineField
          value={setup.perspective}
          options={REVIEW_OPTIONS.perspective}
          onChange={(v) => update("perspective", v)}
        />
        ·{" "}
        <InlineField
          value={setup.scope}
          options={REVIEW_OPTIONS.scope}
          onChange={(v) => update("scope", v)}
        />
        · using{" "}
        <InlineField
          value={setup.playbook}
          options={REVIEW_OPTIONS.playbook}
          onChange={(v) => update("playbook", v)}
        />
        · output{" "}
        <InlineField
          value={setup.output}
          options={REVIEW_OPTIONS.output}
          onChange={(v) => update("output", v)}
        />
        .
      </div>
      <div className="flex items-center justify-between px-3 py-2 border-t border-border/60 bg-muted/20">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-[11px]"
          onClick={onEdit}
          disabled={started}
        >
          Edit setup
        </Button>
        <Button
          size="sm"
          className="h-7 text-[11px]"
          onClick={onStart}
          disabled={started}
        >
          {started ? "Review running…" : "Start review"}
        </Button>
      </div>
    </div>
  );
};

export default ReviewSetupCard;
