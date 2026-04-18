import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import EditorTopBar from "@/components/editor/EditorTopBar";
import EditorCanvas from "@/components/editor/EditorCanvas";
import EditorPanelToolbar, { type PanelId } from "@/components/editor/EditorPanelToolbar";
import EditorPanel from "@/components/editor/EditorPanel";
import EditorFieldSettings from "@/components/editor/EditorFieldSettings";
import { useEditorContext } from "@/components/editor/EditorContext";
import CorrectionBanner from "@/components/editor/CorrectionBanner";
import VersionHistoryOverlay from "@/components/editor/VersionHistoryOverlay";
import EditorSlashMenu from "@/components/editor/EditorSlashMenu";
import SelectionAIMenu from "@/components/editor/SelectionAIMenu";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

/* ── Loading skeleton ── */
const EditorSkeleton = () => (
  <div className="h-screen flex flex-col bg-background">
    <div className="h-14 border-b flex items-center px-4 gap-3 bg-card">
      <Skeleton className="h-8 w-8 rounded" />
      <Skeleton className="h-6 w-40 rounded" />
      <div className="flex-1" />
      <Skeleton className="h-8 w-20 rounded" />
      <Skeleton className="h-8 w-16 rounded" />
    </div>
    <div className="flex flex-1 overflow-hidden">
      <div className="flex-1 p-10">
        <div className="max-w-[816px] mx-auto space-y-4">
          <Skeleton className="h-8 w-2/3 rounded" />
          <Skeleton className="h-4 w-1/4 rounded" />
          <Skeleton className="h-20 w-full rounded" />
          <Skeleton className="h-6 w-1/3 rounded" />
          <Skeleton className="h-16 w-full rounded" />
        </div>
      </div>
      <div className="w-[380px] border-l hidden md:block p-4 space-y-3">
        <Skeleton className="h-9 w-full rounded" />
        <Skeleton className="h-4 w-3/4 rounded" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded" />
        ))}
      </div>
      <div className="w-12 border-l hidden md:flex flex-col items-center py-3 gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-9 rounded-lg" />
        ))}
      </div>
    </div>
  </div>
);

const EditorPageInner = () => {
  const [searchParams] = useSearchParams();
  const docType = searchParams.get("type") || "";
  const initialMode = searchParams.get("mode") || "full";
  const editorMode = searchParams.get("mode") || "full";
  const isCorrection = editorMode === "correction";
  const isFollowUp = editorMode === "followup";
  const parentName = isFollowUp ? "Annual Review — Acme Corp" : undefined;
  const childType = searchParams.get("childType") || "amendment";
  const [isEsign, setIsEsign] = useState(initialMode === "esign");
  const isMobile = useIsMobile();
  const { selectedFieldId, setSelectedFieldId, setCommentsPanelOpen, participants, placedFields, usedVariables, variableValues, setRequestOpenAiPanel } = useEditorContext();

  const [loading, setLoading] = useState(true);
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);

  // Compute checklist status
  const hasParticipants = participants.length > 0;
  const hasFields = placedFields.length > 0;
  const usedTokens = new Set(usedVariables);
  const hasVariables = usedTokens.size > 0;
  const filledVarCount = Array.from(usedTokens).filter(t => variableValues[t]?.trim()).length;
  const allVarsFilled = !hasVariables || filledVarCount === usedTokens.size;
  const checklistIncomplete = !hasParticipants || !hasFields || !allVarsFilled;

  // Default panel: checklist for CLM, annotations for eSign
  const defaultPanel: PanelId = isEsign ? "annotations" : "checklist";
  const [activePanel, setActivePanel] = useState<PanelId | null>(defaultPanel);

  // Brief loading skeleton
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  // Auto-open AI panel if ai=true
  useEffect(() => {
    if (searchParams.get("ai") === "true" && !isEsign) {
      setActivePanel("ai");
    }
  }, [searchParams, isEsign]);

  useEffect(() => {
    setCommentsPanelOpen(activePanel === "comments");
  }, [activePanel, setCommentsPanelOpen]);

  // Register opener so slash/selection menus can pop the AI panel
  useEffect(() => {
    setRequestOpenAiPanel(() => setActivePanel("ai"));
  }, [setRequestOpenAiPanel]);

  const handlePanelToggle = (id: PanelId) => {
    setActivePanel((prev) => (prev === id ? null : id));
  };

  const handleSwitchPanel = (id: PanelId) => {
    setActivePanel(id);
  };

  const handleFieldSelect = (fieldId: string | null) => {
    setSelectedFieldId(fieldId);
  };

  const handleOpenComments = useCallback(() => {
    setActivePanel("comments");
  }, []);

  const handleOpenAi = useCallback(() => {
    setActivePanel("ai");
  }, []);

  if (loading) return <EditorSkeleton />;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="h-screen flex flex-col bg-background"
    >
      {(isCorrection || isFollowUp) && (
        <CorrectionBanner
          mode={isCorrection ? 'correction' : 'followup'}
          parentName={parentName}
          childType={childType}
        />
      )}

      <EditorTopBar isEsign={isEsign} onToggleEsign={() => setIsEsign(prev => !prev)} onOpenVersionHistory={() => setVersionHistoryOpen(true)} />

      <div className="flex flex-1 overflow-hidden">

        {/* Left — Field settings panel (appears on annotation click) */}
        {!isMobile && (
          <AnimatePresence>
            {selectedFieldId && (
              <motion.div
                key="field-settings-left"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 240, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="border-r bg-card flex flex-col overflow-hidden flex-shrink-0"
              >
                <EditorFieldSettings
                  onClose={() => setSelectedFieldId(null)}
                  showBackButton={false}
                />
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Center — Document canvas (full width now) */}
        <div data-editor-canvas-host className="flex-1 flex flex-col overflow-hidden min-w-0">
          <EditorCanvas
            showToolbar={!isEsign}
            onFieldSelect={handleFieldSelect}
            onOpenComments={handleOpenComments}
            onOpenAi={handleOpenAi}
            onOpenVersionHistory={() => setVersionHistoryOpen(true)}
            isEsign={isEsign}
            hideZoomBar={!!selectedFieldId}
            hideMarginComments={!!selectedFieldId && !!activePanel && activePanel !== "field-settings"}
          />
        </div>

      <VersionHistoryOverlay
        open={versionHistoryOpen}
        onClose={() => setVersionHistoryOpen(false)}
      />

      {/* In-editor AI surfaces */}
      <EditorSlashMenu />
      <SelectionAIMenu />

        {/* Desktop panel */}
        {!isMobile && (
          <AnimatePresence>
            {activePanel && activePanel !== "field-settings" && (
              <EditorPanel
                key={activePanel}
                panelId={activePanel}
                onClose={() => setActivePanel(null)}
                docType={docType}
                onSwitchPanel={handleSwitchPanel}
              />
            )}
          </AnimatePresence>
        )}

        {/* Desktop toolbar strip */}
        {!isMobile && (
          <EditorPanelToolbar
            activePanel={activePanel}
            onPanelToggle={handlePanelToggle}
            isEsign={isEsign}
            checklistIncomplete={checklistIncomplete}
          />
        )}

        {/* Mobile panel as sheet */}
        {isMobile && (
          <Sheet open={!!activePanel} onOpenChange={(open) => !open && setActivePanel(null)}>
            <SheetContent side="bottom" className="h-[80vh] p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Panel</SheetTitle>
              </SheetHeader>
              {activePanel && (
                <EditorPanel
                  panelId={activePanel}
                  onClose={() => setActivePanel(null)}
                  docType={docType}
                  onSwitchPanel={handleSwitchPanel}
                />
              )}
            </SheetContent>
          </Sheet>
        )}
      </div>

      {/* Mobile bottom toolbar */}
      {isMobile && (
        <EditorPanelToolbar
          activePanel={activePanel}
          onPanelToggle={handlePanelToggle}
          className="w-full h-12 flex-row border-t border-l-0 py-0 px-2"
          isEsign={isEsign}
          checklistIncomplete={checklistIncomplete}
        />
      )}
    </motion.div>
  );
};

const EditorPage = () => <EditorPageInner />;

export default EditorPage;
