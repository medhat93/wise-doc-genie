import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserMultiple02Icon,
  Comment01Icon,
  PropertyEditIcon,
  TextField,
  WorkflowSquare10Icon,
  CursorAddSelection02Icon,
  TaskDone01Icon,
  CheckmarkSquare02Icon,
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
  | "field-settings"
  | "annotations"
  | "tasks";

interface PanelItem {
  id: PanelId;
  label: string;
  shortcut: string;
  icon?: any;
  useAiIcon?: boolean;
  clmOnly?: boolean;
  group: 1 | 2 | 3;
}

const PANELS: PanelItem[] = [
  // Group 1 — Primary Workflow
  { id: "participants", label: "Participants", shortcut: "⌘1", icon: UserMultiple02Icon, group: 1 },
  { id: "annotations", label: "Fields", shortcut: "⌘2", icon: CursorAddSelection02Icon, group: 1 },
  { id: "fields", label: "Variables", shortcut: "⌘3", icon: TextField, clmOnly: true, group: 1 },
  // Group 2 — AI
  { id: "ai", label: "AI Assistant ✨", shortcut: "⌘4", useAiIcon: true, clmOnly: true, group: 2 },
  // Group 3 — Management
  { id: "comments", label: "Comments", shortcut: "⌘5", icon: Comment01Icon, clmOnly: true, group: 3 },
  { id: "tasks", label: "Tasks", shortcut: "⌘6", icon: CheckmarkSquare02Icon, clmOnly: true, group: 3 },
  { id: "properties", label: "Properties", shortcut: "⌘7", icon: PropertyEditIcon, clmOnly: true, group: 3 },
  { id: "workflow", label: "Workflow", shortcut: "⌘8", icon: WorkflowSquare10Icon, clmOnly: true, group: 3 },
];

interface EditorPanelToolbarProps {
  activePanel: PanelId | null;
  onPanelToggle: (id: PanelId) => void;
  className?: string;
  isEsign?: boolean;
}

const EditorPanelToolbar = ({ activePanel, onPanelToggle, className, isEsign }: EditorPanelToolbarProps) => {
  const visiblePanels = isEsign ? PANELS.filter((p) => !p.clmOnly) : PANELS;

  const group1 = visiblePanels.filter((p) => p.group === 1);
  const group2 = visiblePanels.filter((p) => p.group === 2);
  const group3 = visiblePanels.filter((p) => p.group === 3);

  const renderButton = (panel: PanelItem) => {
    const isActive = activePanel === panel.id;
    const isAi = panel.useAiIcon;

    if (isAi) {
      return (
        <Tooltip key={panel.id} delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              onClick={() => onPanelToggle(panel.id)}
              className={cn(
                "ai-toolbar-btn h-10 w-10 rounded-xl flex items-center justify-center transition-all relative",
                isActive && "ai-toolbar-btn--active"
              )}
            >
              <div className="ai-toolbar-btn__border" />
              <div className={cn(
                "relative z-10 flex items-center justify-center h-full w-full rounded-xl",
                "bg-gradient-to-br from-indigo-500/10 to-violet-500/10"
              )}>
                <AiIcon size={20} className="ai-toolbar-btn__icon" />
              </div>
            </button>
          </TooltipTrigger>
          <TooltipContent side="left">
            {panel.label} <span className="text-muted-foreground ml-1">({panel.shortcut})</span>
          </TooltipContent>
        </Tooltip>
      );
    }

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
            <HugeiconsIcon icon={panel.icon} size={18} />
          </button>
        </TooltipTrigger>
        <TooltipContent side="left">
          {panel.label} <span className="text-muted-foreground ml-1">({panel.shortcut})</span>
        </TooltipContent>
      </Tooltip>
    );
  };

  const renderDivider = () => (
    <div className="w-6 h-px bg-border my-1" />
  );

  return (
    <div className={cn("w-12 border-l bg-card flex flex-col items-center py-3 gap-1 flex-shrink-0", className)}>
      {group1.map(renderButton)}
      {group2.length > 0 && renderDivider()}
      {group2.map(renderButton)}
      {group3.length > 0 && renderDivider()}
      {group3.map(renderButton)}
    </div>
  );
};

export default EditorPanelToolbar;
