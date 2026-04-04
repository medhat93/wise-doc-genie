import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
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
  const { selectedFieldId, setSelectedFieldId, setPreviousPanelId, setCommentsPanelOpen } = useEditorContext();

  // Default to participants panel open
  const [activePanel, setActivePanel] = useState<PanelId | null>("participants");

  // Sync commentsPanelOpen with context
  useEffect(() => {
    setCommentsPanelOpen(activePanel === "comments");
  }, [activePanel, setCommentsPanelOpen]);

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

  const handleOpenComments = useCallback(() => {
    setActivePanel("comments");
  }, []);

  const showToolbar = mode !== "esign";

  return (
    <div className="h-screen flex flex-col bg-background">
      <EditorTopBar />

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar — Fields */}
        {!isMobile && <EditorFieldsSidebar />}

        {/* Center — Document canvas */}
        <EditorCanvas showToolbar={showToolbar} onFieldSelect={handleFieldSelect} />

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
