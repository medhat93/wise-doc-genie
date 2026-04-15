import { useState, useEffect, useRef } from "react";
import { UploadedDocument } from "@/types/document";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { RotateCw, Minus, Plus, ChevronLeft, ChevronRight, X, Maximize2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  doc: UploadedDocument | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rotationMode?: boolean;
}

function normalizeRotation(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

const ZOOM_LEVELS = [50, 75, 100, 125, 150, 200];
const FIT_OPTIONS = ["Fit Width", "Fit Page", "Actual Size"] as const;
type FitOption = typeof FIT_OPTIONS[number];

const DocumentPreviewDialog = ({ doc, open, onOpenChange }: Props) => {
  const pageCount = doc?.pageCount ?? 0;
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [fitMode, setFitMode] = useState<FitOption>("Fit Width");
  const [rotation, setRotation] = useState(0);
  const [prevDocId, setPrevDocId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  if (doc && doc.id !== prevDocId) {
    setPrevDocId(doc.id);
    setCurrentPage(1);
    setZoom(100);
    setRotation(0);
    setFitMode("Fit Width");
  }

  const zoomIn = () => {
    const next = ZOOM_LEVELS.find(z => z > zoom);
    if (next) setZoom(next);
  };

  const zoomOut = () => {
    const prev = [...ZOOM_LEVELS].reverse().find(z => z < zoom);
    if (prev) setZoom(prev);
  };

  const rotate = () => {
    setRotation(prev => normalizeRotation(prev + 90));
  };

  const goPage = (dir: -1 | 1) => {
    setCurrentPage(p => Math.max(1, Math.min(pageCount, p + dir)));
  };

  if (!doc) return null;

  const classificationLabel = doc.documentType === "supplement" ? "Supplements" : doc.documentType === "amendment" ? "Amendment" : "Primary";
  const typeLabel = doc.isTemplate ? "Template" : doc.isAI ? "AI Generated" : doc.type.split("/").pop()?.toUpperCase() || "File";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[92vh] p-0 gap-0 flex flex-col overflow-hidden [&>button]:hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-background">
          <h3 className="text-sm font-semibold truncate pr-4">
            Document Preview - {doc.name}
          </h3>
          <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={() => onOpenChange(false)}>
            <X size={16} />
          </Button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-center gap-1 px-4 py-2 border-b bg-muted/30">
          {/* Page navigation */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => goPage(-1)} disabled={currentPage <= 1}>
              <ChevronLeft size={14} />
            </Button>
            <span className="text-xs text-muted-foreground min-w-[80px] text-center">
              Page {currentPage} of {pageCount || 1}
            </span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => goPage(1)} disabled={currentPage >= pageCount}>
              <ChevronRight size={14} />
            </Button>
          </div>

          <div className="w-px h-5 bg-border mx-1" />

          {/* Zoom */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={zoomOut} disabled={zoom <= ZOOM_LEVELS[0]}>
              <Minus size={14} />
            </Button>
            <span className="text-xs text-muted-foreground min-w-[36px] text-center">{zoom}%</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={zoomIn} disabled={zoom >= ZOOM_LEVELS[ZOOM_LEVELS.length - 1]}>
              <Plus size={14} />
            </Button>
          </div>

          <div className="w-px h-5 bg-border mx-1" />

          {/* Rotate */}
          <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs px-2" onClick={rotate}>
            <RotateCw size={13} />
            Rotate
          </Button>

          <div className="w-px h-5 bg-border mx-1" />

          {/* Fit mode */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1 px-2.5">
                {fitMode}
                <ChevronDown size={12} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-[140px]">
              {FIT_OPTIONS.map(opt => (
                <DropdownMenuItem key={opt} onClick={() => setFitMode(opt)} className={cn("text-xs", fitMode === opt && "font-medium bg-accent")}>
                  {opt}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Fullscreen */}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
            const el = document.querySelector('[data-preview-container]');
            if (el) el.requestFullscreen?.();
          }}>
            <Maximize2 size={13} />
          </Button>
        </div>

        {/* Scrollable content */}
        <div ref={scrollRef} data-preview-container className="flex-1 overflow-y-auto bg-muted/50 p-6">
          <div className="flex flex-col items-center gap-6">
            {Array.from({ length: pageCount || 1 }, (_, i) => (
              <div
                key={i}
                className="bg-white rounded-sm shadow-md transition-transform duration-300 overflow-hidden"
                style={{
                  width: fitMode === "Fit Page" ? `${Math.min(zoom * 5.5, 700)}px` : fitMode === "Actual Size" ? `${zoom * 6.12}px` : "100%",
                  maxWidth: fitMode === "Fit Width" ? `${zoom * 6.12}px` : undefined,
                  transform: `rotate(${rotation}deg)`,
                }}
              >
                <div className="aspect-[210/297] flex flex-col justify-center p-8 sm:p-12">
                  {/* Mock document content */}
                  <div className="space-y-3 w-full max-w-[480px] mx-auto">
                    {i === 0 && (
                      <>
                        <div className="h-[6px] bg-gray-300 rounded w-2/3 mb-6" />
                        <div className="h-[4px] bg-gray-200 rounded w-full" />
                        <div className="h-[4px] bg-gray-200 rounded w-[90%]" />
                        <div className="h-[4px] bg-gray-200 rounded w-full" />
                        <div className="h-[4px] bg-gray-200 rounded w-[80%]" />
                        <div className="h-[4px] bg-gray-200 rounded w-full" />
                        <div className="h-[4px] bg-gray-200 rounded w-[70%]" />
                        <div className="mt-6 h-[4px] bg-gray-200 rounded w-full" />
                        <div className="h-[4px] bg-gray-200 rounded w-[85%]" />
                        <div className="h-[4px] bg-gray-200 rounded w-full" />
                        <div className="h-[4px] bg-gray-200 rounded w-[60%]" />
                      </>
                    )}
                    {i > 0 && (
                      <>
                        <div className="h-[5px] bg-gray-300 rounded w-1/2 mb-4" />
                        <div className="h-[4px] bg-gray-200 rounded w-full" />
                        <div className="h-[4px] bg-gray-200 rounded w-[90%]" />
                        <div className="h-[4px] bg-gray-200 rounded w-full" />
                        <div className="h-[4px] bg-gray-200 rounded w-[75%]" />
                        <div className="h-[4px] bg-gray-200 rounded w-full" />
                        <div className="h-[4px] bg-gray-200 rounded w-[85%]" />
                        <div className="mt-6 h-[4px] bg-gray-200 rounded w-full" />
                        <div className="h-[4px] bg-gray-200 rounded w-[65%]" />
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-t bg-background text-xs text-muted-foreground">
          <span>Pages: {pageCount || 1}</span>
          <span>•</span>
          <span>Type: {typeLabel}</span>
          <span>•</span>
          <span>Classification: <span className="font-medium text-foreground">{classificationLabel}</span></span>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentPreviewDialog;
