import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import EditorTopBar from "@/components/editor/EditorTopBar";
import EditorDocumentTabs from "@/components/editor/EditorDocumentTabs";
import EditorCanvas from "@/components/editor/EditorCanvas";
import EditorPanelToolbar, { type PanelId } from "@/components/editor/EditorPanelToolbar";
import EditorPanel from "@/components/editor/EditorPanel";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const EditorPage = () => {
  const [searchParams] = useSearchParams();
  const docType = searchParams.get("type") || "";
  const mode = searchParams.get("mode") || "full";
  const isMobile = useIsMobile();

  const [activeTab, setActiveTab] = useState("1");
  const [activePanel, setActivePanel] = useState<PanelId | null>(null);

  const handlePanelToggle = (id: PanelId) => {
    setActivePanel((prev) => (prev === id ? null : id));
  };

  const showToolbar = mode !== "esign";

  return (
    <div className="h-screen flex flex-col bg-background">
      <EditorTopBar />
      <EditorDocumentTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex flex-1 overflow-hidden">
        <EditorCanvas showToolbar={showToolbar} />

        {/* Desktop panel */}
        {!isMobile && (
          <AnimatePresence>
            {activePanel && (
              <EditorPanel
                key={activePanel}
                panelId={activePanel}
                onClose={() => setActivePanel(null)}
                docType={docType}
              />
            )}
          </AnimatePresence>
        )}

        {/* Desktop toolbar strip */}
        {!isMobile && (
          <EditorPanelToolbar
            activePanel={activePanel}
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

export default EditorPage;
