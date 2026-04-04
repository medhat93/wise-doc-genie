import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserMultiple02Icon,
  Comment01Icon,
  PropertyEditIcon,
  TextField,
  WorkflowSquare10Icon,
} from "@hugeicons/core-free-icons";
import AiIcon from "@/components/AiIcon";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type PanelId =
  | "participants"
  | "ai"
  | "comments"
  | "properties"
  | "fields"
  | "workflow"
  | "field-settings";

interface PanelItem {
  id: PanelId;
  label: string;
  shortcut: string;
  icon?: any;
  useAiIcon?: boolean;
  clmOnly?: boolean;
}

const PANELS: PanelItem[] = [
  { id: "participants", label: "Participants", shortcut: "⌘1", icon: UserMultiple02Icon },
  { id: "ai", label: "AI Assistant", shortcut: "⌘2", useAiIcon: true, clmOnly: true },
  { id: "comments", label: "Comments", shortcut: "⌘3", icon: Comment01Icon },
  { id: "properties", label: "Properties", shortcut: "⌘4", icon: PropertyEditIcon, clmOnly: true },
  { id: "fields", label: "Variables", shortcut: "⌘5", icon: TextField, clmOnly: true },
  { id: "workflow", label: "Workflow", shortcut: "⌘6", icon: WorkflowSquare10Icon, clmOnly: true },
];

interface EditorPanelToolbarProps {
  activePanel: PanelId | null;
  onPanelToggle: (id: PanelId) => void;
  className?: string;
  isEsign?: boolean;
}

const EditorPanelToolbar = ({ activePanel, onPanelToggle, className, isEsign }: EditorPanelToolbarProps) => {
  const visiblePanels = isEsign ? PANELS.filter((p) => !p.clmOnly) : PANELS;

  return (
    <div className={cn("w-12 border-l bg-card flex flex-col items-center py-3 gap-1 flex-shrink-0", className)}>
      {visiblePanels.map((panel) => {
        const isActive = activePanel === panel.id;
        return (
          <Tooltip key={panel.id} delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={() => onPanelToggle(panel.id)}
                className={cn(
                  "h-9 w-9 rounded-lg flex items-center justify-center transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                {panel.useAiIcon ? (
                  <AiIcon size={18} />
                ) : (
                  <HugeiconsIcon icon={panel.icon} size={18} />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="left">
              {panel.label} <span className="text-muted-foreground ml-1">({panel.shortcut})</span>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
};

export default EditorPanelToolbar;
