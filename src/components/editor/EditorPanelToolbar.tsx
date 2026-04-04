import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserMultiple02Icon,
  Comment01Icon,
  PropertyEditIcon,
  TextField,
  WorkflowSquare10Icon,
  CursorAddSelection02Icon,
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
  icon?: any;
  useAiIcon?: boolean;
}

const PANELS: PanelItem[] = [
  { id: "participants", label: "Participants", icon: UserMultiple02Icon },
  { id: "ai", label: "AI Assistant", useAiIcon: true },
  { id: "comments", label: "Comments", icon: Comment01Icon },
  { id: "properties", label: "Properties", icon: PropertyEditIcon },
  { id: "fields", label: "Smart Fields", icon: TextField },
  { id: "workflow", label: "Workflow", icon: WorkflowSquare10Icon },
];

interface EditorPanelToolbarProps {
  activePanel: PanelId | null;
  onPanelToggle: (id: PanelId) => void;
  className?: string;
}

const EditorPanelToolbar = ({ activePanel, onPanelToggle, className }: EditorPanelToolbarProps) => {
  return (
    <div className={cn("w-12 border-l bg-card flex flex-col items-center py-3 gap-1 flex-shrink-0", className)}>
      {PANELS.map((panel) => {
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
            <TooltipContent side="left">{panel.label}</TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
};

export default EditorPanelToolbar;
