import { useState } from "react";
import { Check, X, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ChecklistStatus = "passed" | "failed" | "pending";

export interface ChecklistItem {
  id: string;
  label: string;
  status: ChecklistStatus;
  rationale?: string;
}

export interface ChecklistProps {
  items: ChecklistItem[];
  caption?: string;
}

const STATUS_STYLES: Record<ChecklistStatus, { ring: string; icon: React.ReactNode }> = {
  passed: {
    ring: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    icon: <Check size={11} strokeWidth={3} />,
  },
  failed: {
    ring: "bg-destructive/10 text-destructive",
    icon: <X size={11} strokeWidth={3} />,
  },
  pending: {
    ring: "bg-muted text-muted-foreground",
    icon: <Circle size={9} />,
  },
};

const Checklist = ({ items, caption }: ChecklistProps) => {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="rounded-xl border bg-background/60 mt-2 overflow-hidden">
      {caption && (
        <div className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground border-b">
          {caption}
        </div>
      )}
      <ul className="divide-y divide-border/60">
        {items.map((item) => {
          const style = STATUS_STYLES[item.status];
          const isOpen = openId === item.id;
          return (
            <li key={item.id}>
              <button
                onClick={() => item.rationale && setOpenId(isOpen ? null : item.id)}
                className={cn(
                  "w-full flex items-start gap-2 px-3 py-2 text-left text-[11px]",
                  item.rationale && "hover:bg-muted/40 transition-colors cursor-pointer"
                )}
              >
                <span
                  className={cn(
                    "shrink-0 w-4 h-4 rounded-full inline-flex items-center justify-center mt-[1px]",
                    style.ring
                  )}
                >
                  {style.icon}
                </span>
                <span className="text-foreground/90 leading-snug flex-1">{item.label}</span>
              </button>
              {isOpen && item.rationale && (
                <div className="px-3 pb-2 pl-9 text-[11px] text-muted-foreground leading-snug">
                  {item.rationale}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default Checklist;
