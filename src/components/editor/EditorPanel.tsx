import { ArrowLeft, X } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import type { PanelId } from "./EditorPanelToolbar";
import EditorAIPanel from "./EditorAIPanel";
import EditorFieldSettings from "./EditorFieldSettings";
import EditorSmartFieldsPanel from "./EditorSmartFieldsPanel";
import EditorPropertiesPanel from "./EditorPropertiesPanel";
import EditorCommentsPanel from "./EditorCommentsPanel";
import EditorWorkflowPanel from "./EditorWorkflowPanel";
import EditorFieldsSidebar from "./EditorFieldsSidebar";
import EditorParticipantsViewPanel from "./EditorParticipantsViewPanel";
import EditorTasksPanel from "./EditorTasksPanel";
import { useEditorContext } from "./EditorContext";

const PANEL_TITLES: Record<PanelId, string> = {
  annotations: "Fields",
  participants: "Participants",
  ai: "AI Assistant",
  comments: "Comments",
  properties: "Properties",
  fields: "Variables",
  workflow: "Workflow",
  tasks: "Tasks",
  "field-settings": "Field Settings",
};

interface EditorPanelProps {
  panelId: PanelId;
  onClose: () => void;
  docType?: string;
}

const EditorPanel = ({ panelId, onClose, docType }: EditorPanelProps) => {
  const { selectedFieldId, setSelectedFieldId } = useEditorContext();

  const showFieldSettings = panelId === "annotations" && !!selectedFieldId;

  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 380, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="border-l bg-card flex flex-col overflow-hidden flex-shrink-0"
    >
      {showFieldSettings ? (
        <EditorFieldSettings onClose={() => setSelectedFieldId(null)} showBackButton />
      ) : (
        <>
          {/* Header */}
          <div className="h-12 px-4 flex items-center justify-between border-b flex-shrink-0">
            <span className="font-semibold text-sm">{PANEL_TITLES[panelId]}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X size={14} />
            </Button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4">
            {panelId === "annotations" ? (
              <EditorFieldsSidebar asPanel />
            ) : panelId === "ai" ? (
              <EditorAIPanel docType={docType} />
            ) : panelId === "fields" ? (
              <EditorSmartFieldsPanel />
            ) : panelId === "properties" ? (
              <EditorPropertiesPanel />
            ) : panelId === "comments" ? (
              <EditorCommentsPanel />
            ) : panelId === "workflow" ? (
              <EditorWorkflowPanel />
            ) : panelId === "tasks" ? (
              <EditorTasksPanel />
            ) : panelId === "participants" ? (
              <EditorParticipantsViewPanel />
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <p className="text-sm font-medium text-foreground mb-1">{PANEL_TITLES[panelId]}</p>
                <p className="text-xs text-muted-foreground">Panel content coming soon</p>
              </div>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
};

export default EditorPanel;
