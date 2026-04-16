import { useState } from "react";
import { UploadedDocument } from "@/types/document";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Minus, Plus, RotateCw, Maximize2, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  doc: UploadedDocument | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rotationMode?: boolean;
}

const ZOOM_STEPS = [50, 75, 100, 125, 150, 200];

const DocumentPreviewDialog = ({ doc, open, onOpenChange }: Props) => {
  const pageCount = doc?.pageCount ?? 0;
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [fitMode, setFitMode] = useState<string>("fit-width");
  const [rotation, setRotation] = useState(0);
  const [prevDocId, setPrevDocId] = useState<string | null>(null);

  if (doc && doc.id !== prevDocId) {
    setPrevDocId(doc.id);
    setCurrentPage(1);
    setZoom(100);
    setRotation(0);
    setFitMode("fit-width");
  }

  if (!doc) return null;

  const goPage = (dir: -1 | 1) => {
    setCurrentPage((p) => Math.max(1, Math.min(pageCount, p + dir)));
  };

  const zoomIn = () => {
    const next = ZOOM_STEPS.find((z) => z > zoom);
    if (next) setZoom(next);
  };

  const zoomOut = () => {
    const prev = [...ZOOM_STEPS].reverse().find((z) => z < zoom);
    if (prev) setZoom(prev);
  };

  const handleRotate = () => {
    setRotation((r) => (r + 90) % 360);
    toast.success("Pages rotated");
  };

  const docTypeLabel = doc.isTemplate
    ? "Template"
    : doc.isAI
      ? "AI Generated"
      : doc.type.split("/").pop()?.toUpperCase() || "File";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0 flex flex-col overflow-hidden [&>button]:hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="text-sm font-medium truncate pr-4">
            Document Preview - {doc.name}
          </h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 flex-shrink-0"
            onClick={() => onOpenChange(false)}
          >
            <X size={16} />
          </Button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-center gap-1 px-4 py-2 border-b bg-muted/30">
          {/* Page navigation */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={currentPage <= 1}
              onClick={() => goPage(-1)}
            >
              <ChevronLeft size={16} />
            </Button>
            <span className="text-xs text-muted-foreground min-w-[80px] text-center">
              Page {currentPage} of {pageCount}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={currentPage >= pageCount}
              onClick={() => goPage(1)}
            >
              <ChevronRight size={16} />
            </Button>
          </div>

          <div className="w-px h-5 bg-border mx-1" />

          {/* Zoom */}
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={zoomOut} disabled={zoom <= ZOOM_STEPS[0]}>
              <Minus size={14} />
            </Button>
            <span className="text-xs text-muted-foreground min-w-[36px] text-center">{zoom}%</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={zoomIn} disabled={zoom >= ZOOM_STEPS[ZOOM_STEPS.length - 1]}>
              <Plus size={14} />
            </Button>
          </div>

          <div className="w-px h-5 bg-border mx-1" />

          {/* Rotate */}
          <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs px-2" onClick={handleRotate}>
            <RotateCw size={14} />
            Rotate
          </Button>

          <div className="w-px h-5 bg-border mx-1" />

          {/* Fit mode */}
          <Select value={fitMode} onValueChange={setFitMode}>
            <SelectTrigger className="h-7 w-[100px] text-xs border-0 bg-transparent shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fit-width">Fit Width</SelectItem>
              <SelectItem value="fit-page">Fit Page</SelectItem>
              <SelectItem value="actual">Actual Size</SelectItem>
            </SelectContent>
          </Select>

          {/* Fullscreen */}
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Maximize2 size={14} />
          </Button>
        </div>

        {/* Scrollable page content */}
        <div className="flex-1 overflow-y-auto bg-muted/40 p-6">
          <div className="flex justify-center">
            <div
              className="bg-white shadow-lg transition-transform duration-300"
              style={{
                width: fitMode === "fit-page" ? "auto" : "100%",
                maxWidth: fitMode === "actual" ? "none" : "680px",
                aspectRatio: "210 / 297",
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                transformOrigin: "top center",
              }}
            >
              {/* Mock page content */}
              <div className="p-10 h-full flex flex-col gap-4">
                <div className="space-y-2.5 w-full">
                  <div className="h-[5px] bg-muted-foreground/15 rounded w-full" />
                  <div className="h-[5px] bg-muted-foreground/10 rounded w-4/5" />
                  <div className="h-[5px] bg-muted-foreground/15 rounded w-full" />
                  <div className="h-[5px] bg-muted-foreground/10 rounded w-3/5" />
                  <div className="h-[5px] bg-muted-foreground/15 rounded w-full" />
                  <div className="h-[5px] bg-muted-foreground/10 rounded w-2/3" />
                  <div className="h-[5px] bg-muted-foreground/15 rounded w-full" />
                  <div className="h-[5px] bg-muted-foreground/10 rounded w-4/5" />
                  <div className="h-[5px] bg-muted-foreground/15 rounded w-full" />
                  <div className="h-[5px] bg-muted-foreground/10 rounded w-1/2" />
                </div>
                <div className="mt-auto text-center">
                  <span className="text-lg font-semibold text-muted-foreground/20">
                    {currentPage}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info bar */}
        <div className="flex items-center gap-4 px-4 py-2.5 border-t text-xs text-muted-foreground bg-background">
          <span>Pages: <strong className="text-foreground">{pageCount}</strong></span>
          <span>•</span>
          <span>Type: <strong className="text-foreground">{docTypeLabel}</strong></span>
          <span>•</span>
          <span>Classification: <strong className="text-foreground capitalize">{doc.documentType === "supplement" ? "Supplements" : doc.documentType === "primary" ? "Primary" : doc.documentType}</strong></span>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentPreviewDialog;
