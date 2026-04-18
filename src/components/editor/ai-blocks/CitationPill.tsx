import { cn } from "@/lib/utils";
import { jumpToSection } from "./aiBlockUtils";

interface CitationPillProps {
  label: string;
  className?: string;
}

const CitationPill = ({ label, className }: CitationPillProps) => (
  <button
    onClick={() => jumpToSection(label)}
    className={cn(
      "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium",
      "bg-primary/10 text-primary hover:bg-primary/20 transition-colors mx-0.5 align-baseline",
      className
    )}
    title={`Jump to ${label}`}
  >
    {label}
  </button>
);

export default CitationPill;
