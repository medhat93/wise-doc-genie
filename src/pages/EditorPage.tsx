import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import EditorTopBar from "@/components/editor/EditorTopBar";
import EditorCanvas from "@/components/editor/EditorCanvas";
import EditorPanelToolbar, { type PanelId } from "@/components/editor/EditorPanelToolbar";
import EditorPanel from "@/components/editor/EditorPanel";
import { EditorProvider, useEditorContext } from "@/components/editor/EditorContext";
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
      <div className="w-[260px] border-r p-4 space-y-3 hidden md:block">
        <Skeleton className="h-9 w-full rounded" />
        <Skeleton className="h-4 w-3/4 rounded" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded" />
        ))}
      </div>
      <div className="flex-1 p-10">
        <div className="max-w-[816px] mx-auto space-y-4">
          <Skeleton className="h-8 w-2/3 rounded" />
          <Skeleton className="h-4 w-1/4 rounded" />
          <Skeleton className="h-20 w-full rounded" />
          <Skeleton className="h-6 w-1/3 rounded" />
          <Skeleton className="h-16 w-full rounded" />
        </div>
      </div>
      <div className="w-12 border-l hidden md:flex flex-col items-center py-3 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-9 rounded-lg" />
        ))}
      </div>
    </div>
  </div>
);

const EditorPageInner = () => {
  const [searchParams] = useSearchParams();
  const docType = searchParams.get("type") || "";
  const mode = searchParams.get("mode") || "full";
  const isEsign = mode === "esign";
  const isMobile = useIsMobile();
  const { selectedFieldId, setSelectedFieldId, setPreviousPanelId, setCommentsPanelOpen } = useEditorContext();

  const [loading, setLoading] = useState(true);
  const [activePanel, setActivePanel] = useState<PanelId | null>("annotations");

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

  if (loading) return <EditorSkeleton />;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="h-screen flex flex-col bg-background"
    >
      <EditorTopBar />

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar — Fields */}
        {!isMobile && <EditorFieldsSidebar />}

        {/* Center — Document canvas */}
        <EditorCanvas
          showToolbar={!isEsign}
          onFieldSelect={handleFieldSelect}
          onOpenComments={handleOpenComments}
          isEsign={isEsign}
        />

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
            isEsign={isEsign}
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
          isEsign={isEsign}
        />
      )}
    </motion.div>
  );
};

const EditorPage = () => (
  <EditorProvider>
    <EditorPageInner />
  </EditorProvider>
);

export default EditorPage;
