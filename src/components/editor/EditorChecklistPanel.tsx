import { useState } from "react";
import { Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useEditorContext } from "./EditorContext";
import type { PanelId } from "./EditorPanelToolbar";
import ParticipantsDialog from "@/components/ParticipantsDialog";

interface ChecklistItem {
  id: string;
  title: string;
  checked: boolean;
  statusText: string;
  actionLabel: string;
  onAction: () => void;
  editLabel?: string;
  onEdit?: () => void;
  warning?: boolean;
  visible: boolean;
}

interface EditorChecklistPanelProps {
  onSwitchPanel: (id: PanelId) => void;
}

const EditorChecklistPanel = ({ onSwitchPanel }: EditorChecklistPanelProps) => {
  const { participants, placedFields, usedVariables, variableValues } = useEditorContext();
  const [participantsOpen, setParticipantsOpen] = useState(false);

  // Mock flags
  const workflowEnforced = false;
  const hasRequiredProperties = false;

  // Compute checklist items
  const hasParticipants = participants.length > 0;
  const hasFields = placedFields.length > 0;

  const usedTokens = new Set(usedVariables);
  const hasVariables = usedTokens.size > 0;
  const filledVarCount = Array.from(usedTokens).filter(t => variableValues[t]?.trim()).length;
  const allVarsFilled = hasVariables && filledVarCount === usedTokens.size;

  const items: ChecklistItem[] = [
    {
      id: "participants",
      title: "Add participants",
      checked: hasParticipants,
      statusText: hasParticipants ? `${participants.length} participant${participants.length !== 1 ? "s" : ""} added` : "",
      actionLabel: hasParticipants ? "Manage →" : "Add participants →",
      onAction: () => setParticipantsOpen(true),
      visible: true,
    },
    {
      id: "fields",
      title: "Place annotation fields",
      checked: hasFields,
      statusText: hasFields ? `${placedFields.length} field${placedFields.length !== 1 ? "s" : ""} placed` : "",
      actionLabel: hasFields ? "Edit →" : "Open fields panel →",
      onAction: () => onSwitchPanel("annotations"),
      visible: true,
    },
    {
      id: "variables",
      title: "Fill in placeholders",
      checked: allVarsFilled,
      statusText: allVarsFilled
        ? `All ${usedTokens.size} placeholders filled`
        : `${filledVarCount} of ${usedTokens.size} placeholders need values`,
      actionLabel: allVarsFilled ? "Edit →" : "Open placeholders →",
      onAction: () => onSwitchPanel("fields"),
      warning: hasVariables && !allVarsFilled,
      visible: hasVariables,
    },
    {
      id: "properties",
      title: "Fill required properties",
      checked: false,
      statusText: "Required properties need values",
      actionLabel: "Open properties →",
      onAction: () => onSwitchPanel("properties"),
      visible: hasRequiredProperties,
    },
    {
      id: "workflow",
      title: "Apply approval workflow",
      checked: false,
      statusText: "No workflow applied",
      actionLabel: "Open workflow →",
      onAction: () => onSwitchPanel("workflow"),
      visible: workflowEnforced,
    },
  ].filter(i => i.visible);

  const completedCount = items.filter(i => i.checked).length;
  const totalCount = items.length;
  const allComplete = completedCount === totalCount;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Subtitle */}
      {allComplete ? (
        <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">All set! Your document is ready to send ✓</p>
      ) : (
        <p className="text-xs text-muted-foreground">Complete these items before sending</p>
      )}

      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className={cn("text-xs font-medium", allComplete ? "text-emerald-600 dark:text-emerald-400" : "text-foreground")}>
            {allComplete ? "All complete ✓" : `${completedCount} of ${totalCount} complete`}
          </span>
        </div>
        <Progress value={progressPercent} className="h-1.5" />
      </div>

      {/* Checklist items */}
      <div className="space-y-2">
        {items.map(item => (
          <div
            key={item.id}
            className={cn(
              "rounded-lg border p-3 transition-colors",
              item.checked
                ? "bg-emerald-500/5 border-emerald-500/20"
                : "bg-card border-border"
            )}
          >
            <div className="flex items-start gap-3">
              {/* Circle */}
              <div className="flex-shrink-0 mt-0.5">
                {item.checked ? (
                  <div className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center">
                    <Check size={12} className="text-white" />
                  </div>
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <span className={cn(
                  "text-sm font-medium",
                  item.checked ? "text-muted-foreground" : "text-foreground"
                )}>
                  {item.title}
                </span>
                {item.statusText && (
                  <p className={cn(
                    "text-[10px] mt-0.5",
                    item.checked ? "text-emerald-600 dark:text-emerald-400" : item.warning ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
                  )}>
                    {item.warning && <AlertTriangle size={10} className="inline mr-1 -mt-0.5" />}
                    {item.statusText}
                  </p>
                )}
              </div>

              {/* Action */}
              <button
                onClick={item.onAction}
                className={cn(
                  "text-xs flex-shrink-0 hover:underline",
                  item.checked ? "text-muted-foreground" : "text-primary"
                )}
              >
                {item.actionLabel}
              </button>
            </div>
          </div>
        ))}
      </div>

      <ParticipantsDialog open={participantsOpen} onOpenChange={setParticipantsOpen} />
    </div>
  );
};

export default EditorChecklistPanel;
