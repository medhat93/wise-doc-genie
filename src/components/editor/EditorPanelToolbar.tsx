import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserMultiple02Icon,
  Comment01Icon,
  PropertyEditIcon,
  TextField,
  WorkflowSquare10Icon,
  CursorAddSelection02Icon,
  CheckmarkSquare02Icon,
  CheckListIcon,
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
  | "tasks"
  | "checklist";

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
  { id: "checklist", label: "Ready for signature", shortcut: "⌘1", icon: CheckListIcon, clmOnly: true, group: "main" },
  { id: "participants", label: "Participants", shortcut: "⌘2", icon: UserMultiple02Icon, group: "main" },
  { id: "annotations", label: "Fields", shortcut: "⌘3", icon: CursorAddSelection02Icon, group: "main" },
  { id: "ai", label: "AI Assistant ✨", shortcut: "⌘4", useAiIcon: true, clmOnly: true, group: "main" },
  { id: "fields", label: "Placeholders", shortcut: "⌘5", icon: TextField, clmOnly: true, group: "overflow" },
  { id: "comments", label: "Comments", shortcut: "⌘6", icon: Comment01Icon, clmOnly: true, group: "overflow" },
  { id: "tasks", label: "Tasks", shortcut: "⌘7", icon: CheckmarkSquare02Icon, clmOnly: true, group: "overflow" },
  { id: "properties", label: "Properties", shortcut: "⌘8", icon: PropertyEditIcon, clmOnly: true, group: "overflow" },
  { id: "workflow", label: "Workflow", shortcut: "⌘9", icon: WorkflowSquare10Icon, clmOnly: true, group: "overflow" },
];

// Heights in px
const ITEM_HEIGHT = 40; // button h-9/h-10 + gap
const CHEVRON_HEIGHT = 42; // chevron button + separator
const PADDING = 24; // py-3 top + bottom

interface EditorPanelToolbarProps {
  activePanel: PanelId | null;
  onPanelToggle: (id: PanelId) => void;
  className?: string;
  isEsign?: boolean;
  checklistIncomplete?: boolean;
}

const EditorPanelToolbar = ({ activePanel, onPanelToggle, className, isEsign, checklistIncomplete }: EditorPanelToolbarProps) => {
  const [expanded, setExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(0);

  const visiblePanels = useMemo(
    () => (isEsign ? PANELS.filter((p) => !p.clmOnly) : PANELS),
    [isEsign]
  );

  // Measure available height
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainerHeight(entry.contentRect.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Calculate how many items can be shown directly vs overflow
  const { directItems, overflowItems } = useMemo(() => {
    const totalItems = visiblePanels.length;
    if (containerHeight === 0) {
      // Before measurement, use the original grouping
      return {
        directItems: visiblePanels.filter(p => p.group === "main"),
        overflowItems: visiblePanels.filter(p => p.group === "overflow"),
      };
    }

    const availableHeight = containerHeight - PADDING;

    if (expanded) {
      // When expanded, all items + chevron must fit
      const allFit = (totalItems * ITEM_HEIGHT + CHEVRON_HEIGHT) <= availableHeight;
      if (allFit) {
        return {
          directItems: visiblePanels.filter(p => p.group === "main"),
          overflowItems: visiblePanels.filter(p => p.group === "overflow"),
        };
      }
      // Not all fit when expanded — calculate how many main items to keep
      // We need: directCount * ITEM_HEIGHT + CHEVRON_HEIGHT + overflowCount * ITEM_HEIGHT <= availableHeight
      // Total = totalItems, so: totalItems * ITEM_HEIGHT + CHEVRON_HEIGHT <= availableHeight
      // If that doesn't fit, reduce direct items (move to overflow)
      const maxTotal = Math.floor((availableHeight - CHEVRON_HEIGHT) / ITEM_HEIGHT);
      const originalMainCount = visiblePanels.filter(p => p.group === "main").length;
      // Keep at least 1 direct item
      const directCount = Math.max(1, Math.min(originalMainCount, maxTotal - (totalItems - originalMainCount)));
      
      if (directCount >= originalMainCount) {
        // All main items fit, trim from overflow if needed
        const overflowMax = maxTotal - originalMainCount;
        return {
          directItems: visiblePanels.filter(p => p.group === "main"),
          overflowItems: visiblePanels.filter(p => p.group === "overflow").slice(0, Math.max(0, overflowMax)),
        };
      }
      
      // Need to move some main items to overflow
      const allOrdered = [...visiblePanels];
      return {
        directItems: allOrdered.slice(0, directCount),
        overflowItems: allOrdered.slice(directCount),
      };
    } else {
      // When collapsed, direct items + chevron button must fit
      const originalMain = visiblePanels.filter(p => p.group === "main");
      const originalOverflow = visiblePanels.filter(p => p.group === "overflow");
      const hasOverflow = originalOverflow.length > 0;
      const overhead = hasOverflow ? CHEVRON_HEIGHT : 0;
      const maxDirect = Math.floor((availableHeight - overhead) / ITEM_HEIGHT);

      if (maxDirect >= originalMain.length) {
        return { directItems: originalMain, overflowItems: originalOverflow };
      }

      // Move excess main items into overflow
      const kept = originalMain.slice(0, Math.max(1, maxDirect));
      const moved = originalMain.slice(Math.max(1, maxDirect));
      return {
        directItems: kept,
        overflowItems: [...moved, ...originalOverflow],
      };
    }
  }, [visiblePanels, containerHeight, expanded]);

  const hasOverflow = overflowItems.length > 0;
  const overflowIds = overflowItems.map(p => p.id);
  const hasActiveOverflow = activePanel && overflowIds.includes(activePanel);

  const renderButton = useCallback((panel: PanelItem) => {
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
              
              <div className="relative z-10 flex items-center justify-center h-full w-full rounded-xl">
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

    const isChecklist = panel.id === "checklist";

    return (
      <Tooltip key={panel.id} delayDuration={0}>
        <TooltipTrigger asChild>
          <button
            onClick={() => onPanelToggle(panel.id)}
            className={cn(
              "h-9 w-9 rounded-lg flex items-center justify-center transition-colors relative",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <HugeiconsIcon icon={panel.icon} size={18} />
            {isChecklist && !isActive && (
              <span className={cn(
                "absolute top-0.5 right-0.5 h-1.5 w-1.5 rounded-full",
                checklistIncomplete ? "bg-destructive" : "bg-emerald-500"
              )} />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="left">
          {panel.label} <span className="text-muted-foreground ml-1">({panel.shortcut})</span>
        </TooltipContent>
      </Tooltip>
    );
  }, [activePanel, onPanelToggle, checklistIncomplete]);

  return (
    <div ref={containerRef} className={cn("w-12 border-l bg-card flex flex-col items-center py-3 gap-1 flex-shrink-0", className)}>
      {directItems.map(renderButton)}

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
                {overflowItems.map(renderButton)}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
};

export default EditorPanelToolbar;
