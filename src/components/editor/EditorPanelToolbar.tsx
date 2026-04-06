import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserMultiple02Icon,
  Comment01Icon,
  PropertyEditIcon,
  TextField,
  WorkflowSquare10Icon,
  CursorAddSelection02Icon,
  CheckmarkSquare02Icon,
} from "@hugeicons/core-free-icons";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
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
  group: "main" | "overflow";
}

const PANELS: PanelItem[] = [
  // Main visible icons
  { id: "participants", label: "Participants", shortcut: "⌘1", icon: UserMultiple02Icon, group: "main" },
  { id: "annotations", label: "Fields", shortcut: "⌘2", icon: CursorAddSelection02Icon, group: "main" },
  { id: "ai", label: "AI Assistant ✨", shortcut: "⌘3", useAiIcon: true, clmOnly: true, group: "main" },
  { id: "fields", label: "Variables", shortcut: "⌘4", icon: TextField, clmOnly: true, group: "main" },
  // Overflow icons
  { id: "comments", label: "Comments", shortcut: "⌘5", icon: Comment01Icon, clmOnly: true, group: "overflow" },
  { id: "tasks", label: "Tasks", shortcut: "⌘6", icon: CheckmarkSquare02Icon, clmOnly: true, group: "overflow" },
  { id: "properties", label: "Properties", shortcut: "⌘7", icon: PropertyEditIcon, clmOnly: true, group: "overflow" },
  { id: "workflow", label: "Workflow", shortcut: "⌘8", icon: WorkflowSquare10Icon, clmOnly: true, group: "overflow" },
];

const OVERFLOW_IDS = PANELS.filter(p => p.group === "overflow").map(p => p.id);

interface EditorPanelToolbarProps {
  activePanel: PanelId | null;
  onPanelToggle: (id: PanelId) => void;
  className?: string;
  isEsign?: boolean;
}

const EditorPanelToolbar = ({ activePanel, onPanelToggle, className, isEsign }: EditorPanelToolbarProps) => {
  const [expanded, setExpanded] = useState(false);
  const visiblePanels = isEsign ? PANELS.filter((p) => !p.clmOnly) : PANELS;

  const mainPanels = visiblePanels.filter((p) => p.group === "main");
  const overflowPanels = visiblePanels.filter((p) => p.group === "overflow");
  const hasOverflow = overflowPanels.length > 0;
  const hasActiveOverflow = activePanel && OVERFLOW_IDS.includes(activePanel);

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

  return (
    <div className={cn("w-12 border-l bg-card flex flex-col items-center py-3 gap-1 flex-shrink-0", className)}>
      {mainPanels.map(renderButton)}

      {hasOverflow && (
        <>
          <div className="w-6 h-px bg-border my-1" />

          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={() => setExpanded(prev => !prev)}
                className="relative h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                <motion.div
                  animate={{ rotate: expanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown size={16} />
                </motion.div>
                {/* Active dot indicator when overflow panel is active but collapsed */}
                {!expanded && hasActiveOverflow && (
                  <span className="absolute top-0.5 right-0.5 h-1.5 w-1.5 rounded-full bg-primary" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="left">
              More panels
            </TooltipContent>
          </Tooltip>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden flex flex-col items-center gap-1"
              >
                {overflowPanels.map(renderButton)}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
};

export default EditorPanelToolbar;
