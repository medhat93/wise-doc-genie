import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import EditorTopBar from "@/components/editor/EditorTopBar";
import EditorCanvas from "@/components/editor/EditorCanvas";
import EditorPanelToolbar, { type PanelId } from "@/components/editor/EditorPanelToolbar";
import EditorPanel from "@/components/editor/EditorPanel";
import EditorFieldsSidebar from "@/components/editor/EditorFieldsSidebar";
import { EditorProvider, useEditorContext } from "@/components/editor/EditorContext";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const EditorPageInner = () => {
  const [searchParams] = useSearchParams();
  const docType = searchParams.get("type") || "";
  const mode = searchParams.get("mode") || "full";
  const isMobile = useIsMobile();
  const {
    selectedFieldId,
    setSelectedFieldId,
    setPreviousPanelId,
    isDraggingField,
    isPlacementMode,
    setIsPlacementMode,
  } = useEditorContext();

  // Default to participants panel open
  const [activePanel, setActivePanel] = useState<PanelId | null>("participants");
  const panelBeforeDrag = useRef<PanelId | null>(null);
  const restoreTimer = useRef<ReturnType<typeof setTimeout>>();
  const lastDropTime = useRef<number>(0);
  const dropCount = useRef<number>(0);
  const placementTimeout = useRef<ReturnType<typeof setTimeout>>();

  // Auto-collapse right panel when dragging starts
  useEffect(() => {
    if (isDraggingField && activePanel && activePanel !== "field-settings") {
      panelBeforeDrag.current = activePanel;
      setActivePanel(null);
      // Cancel any pending restore
      clearTimeout(restoreTimer.current);
    }
  }, [isDraggingField, activePanel]);

  // Track drops for continuous placement mode
  const handleFieldDropped = useCallback(() => {
    const now = Date.now();
    const timeSinceLastDrop = now - lastDropTime.current;

    if (timeSinceLastDrop < 3000) {
      dropCount.current += 1;
    } else {
      dropCount.current = 1;
    }
    lastDropTime.current = now;

    // Enter continuous placement mode after 2+ drops within 3s
    if (dropCount.current >= 2) {
      setIsPlacementMode(true);
      clearTimeout(restoreTimer.current);
      clearTimeout(placementTimeout.current);

      // Auto-exit after 5s of no activity
      placementTimeout.current = setTimeout(() => {
        exitPlacementMode();
      }, 5000);
      return;
    }

    // Single drop: restore panel after 500ms
    clearTimeout(restoreTimer.current);
    restoreTimer.current = setTimeout(() => {
      if (panelBeforeDrag.current) {
        setActivePanel(panelBeforeDrag.current);
        panelBeforeDrag.current = null;
      }
    }, 500);
  }, [setIsPlacementMode]);

  // If drag starts again during restore window, cancel restore
  useEffect(() => {
    if (isDraggingField) {
      clearTimeout(restoreTimer.current);

      // Reset placement timeout if in placement mode
      if (isPlacementMode) {
        clearTimeout(placementTimeout.current);
        placementTimeout.current = setTimeout(() => {
          exitPlacementMode();
        }, 5000);
      }
    }
  }, [isDraggingField, isPlacementMode]);

  const exitPlacementMode = useCallback(() => {
    setIsPlacementMode(false);
    dropCount.current = 0;
    clearTimeout(placementTimeout.current);
    if (panelBeforeDrag.current) {
      setActivePanel(panelBeforeDrag.current);
      panelBeforeDrag.current = null;
    }
  }, [setIsPlacementMode]);

  // Listen for drops on the canvas
  useEffect(() => {
    const handleDrop = () => {
      handleFieldDropped();
    };
    window.addEventListener("field-placed", handleDrop);
    return () => window.removeEventListener("field-placed", handleDrop);
  }, [handleFieldDropped]);

  // Cleanup timers
  useEffect(() => {
    return () => {
      clearTimeout(restoreTimer.current);
      clearTimeout(placementTimeout.current);
    };
  }, []);

  const handlePanelToggle = (id: PanelId) => {
    setActivePanel((prev) => (prev === id ? null : id));
    if (activePanel === "field-settings" && id !== "field-settings") {
      setSelectedFieldId(null);
    }
  };

  const handleFieldSelect = (fieldId: string | null) => {
    if (fieldId) {
      if (activePanel && activePanel !== "field-settings") {
        setPreviousPanelId(activePanel);
      }
      setSelectedFieldId(fieldId);
      setActivePanel("field-settings");
    } else {
      setSelectedFieldId(null);
      if (activePanel === "field-settings") {
        setActivePanel(null);
      }
    }
  };

  const handleFieldSettingsClose = () => {
    setSelectedFieldId(null);
    setActivePanel(null);
  };

  const showToolbar = mode !== "esign";

  return (
    <div className="h-screen flex flex-col bg-background">
      <EditorTopBar />

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar — Fields */}
        {!isMobile && <EditorFieldsSidebar />}

        {/* Center — Document canvas */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <EditorCanvas showToolbar={showToolbar} onFieldSelect={handleFieldSelect} />

          {/* Continuous placement mode pill */}
          <AnimatePresence>
            {isPlacementMode && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="absolute top-14 right-4 z-30 flex items-center gap-2 bg-card border shadow-sm rounded-full px-3 py-1"
              >
                <span className="text-xs text-muted-foreground">Placing fields...</span>
                <span className="text-[2px] text-muted-foreground">·</span>
                <button
                  onClick={exitPlacementMode}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Done
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Desktop panel */}
        {!isMobile && (
          <AnimatePresence>
            {activePanel && (
              <EditorPanel
                key={activePanel}
                panelId={activePanel}
                onClose={activePanel === "field-settings" ? handleFieldSettingsClose : () => setActivePanel(null)}
                docType={docType}
              />
            )}
          </AnimatePresence>
        )}

        {/* Desktop toolbar strip */}
        {!isMobile && (
          <EditorPanelToolbar
            activePanel={activePanel === "field-settings" ? null : activePanel}
            onPanelToggle={handlePanelToggle}
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
        />
      )}
    </div>
  );
};

const EditorPage = () => (
  <EditorProvider>
    <EditorPageInner />
  </EditorProvider>
);

export default EditorPage;
