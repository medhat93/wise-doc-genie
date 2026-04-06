import { useState, useEffect } from "react";
import { UploadedDocument } from "@/types/document";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RotateCw, RotateCcw, undo2Icon } from "lucide-react";
import { toast } from "sonner";

interface Props {
  doc: UploadedDocument | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rotationMode?: boolean;
}

function normalizeRotation(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

const DocumentPreviewDialog = ({ doc, open, onOpenChange, rotationMode = false }: Props) => {
  const pageCount = doc?.pageCount ?? 0;
  const [rotations, setRotations] = useState<number[]>(() => Array(pageCount).fill(0));
  const [clockwise, setClockwise] = useState(true);
  const [prevDocId, setPrevDocId] = useState<string | null>(null);

  if (doc && doc.id !== prevDocId) {
    setPrevDocId(doc.id);
    setRotations(Array(doc.pageCount ?? 0).fill(0));
  }

  const rotatePage = (index: number) => {
    const degrees = clockwise ? 90 : -90;
    setRotations((prev) => {
      const next = [...prev];
      next[index] = normalizeRotation(next[index] + degrees);
      return next;
    });
  };

  const rotateAll = () => {
    const degrees = clockwise ? 90 : -90;
    setRotations((prev) => prev.map((r) => normalizeRotation(r + degrees)));
  };

  const resetAll = () => {
    setRotations(Array(pageCount).fill(0));
  };

  const handleApply = () => {
    onOpenChange(false);
    toast.success("Pages rotated");
  };

  if (!doc) return null;

  // Simple preview (non-rotation mode)
  if (!rotationMode) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base truncate pr-6">
              Preview — {doc.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-lg border bg-muted/50 p-6 flex flex-col items-center min-h-[280px] justify-center">
              <div className="mt-6 w-[200px] space-y-2.5">
                <div className="h-[5px] bg-muted-foreground/15 rounded w-full" />
                <div className="h-[5px] bg-muted-foreground/10 rounded w-4/5" />
                <div className="h-[5px] bg-muted-foreground/15 rounded w-full" />
                <div className="h-[5px] bg-muted-foreground/10 rounded w-3/5" />
                <div className="h-[5px] bg-muted-foreground/15 rounded w-full" />
                <div className="h-[5px] bg-muted-foreground/10 rounded w-2/3" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Type</p>
                <p className="font-medium mt-0.5">
                  {doc.isTemplate
                    ? "Template"
                    : doc.isAI
                      ? "AI Generated"
                      : doc.type.split("/").pop()?.toUpperCase() || "File"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pages</p>
                <p className="font-medium mt-0.5">{doc.pageCount ?? "—"}</p>
              </div>
              {doc.size && (
                <div>
                  <p className="text-xs text-muted-foreground">Size</p>
                  <p className="font-medium mt-0.5">
                    {doc.size < 1024 * 1024 ? `${(doc.size / 1024).toFixed(1)} KB` : `${(doc.size / (1024 * 1024)).toFixed(1)} MB`}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">Classification</p>
                <p className="font-medium mt-0.5 capitalize">{doc.documentType}</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Rotation preview mode
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-base truncate pr-6">
            Preview — {doc.name}
          </DialogTitle>
        </DialogHeader>

        {/* Toolbar */}
        <div className="flex items-center gap-2 pb-2 border-b">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={rotateAll}>
            <RotateCw size={14} />
            Rotate all
          </Button>
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" onClick={resetAll}>
            Reset
          </Button>
          <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
            <button
              className={`px-2 py-1 rounded transition-colors ${clockwise ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"}`}
              onClick={() => setClockwise(true)}
            >
              Clockwise
            </button>
            <button
              className={`px-2 py-1 rounded transition-colors ${!clockwise ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"}`}
              onClick={() => setClockwise(false)}
            >
              Counter-clockwise
            </button>
          </div>
        </div>

        {/* Page grid */}
        <div className="flex-1 overflow-y-auto py-4 scrollbar-thin">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {rotations.map((rotation, index) => (
              <div key={index} className="flex flex-col items-center gap-2">
                <div className="relative group/page w-full">
                  <div
                    className="w-full aspect-[210/297] rounded-lg border bg-card shadow-sm flex items-center justify-center transition-transform duration-300 overflow-hidden"
                    style={{ transform: `rotate(${rotation}deg)` }}
                  >
                    <div className="flex flex-col items-center gap-1.5 px-4 w-full">
                      <span className="text-2xl font-semibold text-muted-foreground/30">{index + 1}</span>
                      <div className="space-y-1.5 w-full max-w-[120px]">
                        <div className="h-[2px] bg-muted-foreground/10 rounded w-full" />
                        <div className="h-[2px] bg-muted-foreground/8 rounded w-4/5" />
                        <div className="h-[2px] bg-muted-foreground/10 rounded w-full" />
                        <div className="h-[2px] bg-muted-foreground/8 rounded w-3/5" />
                        <div className="h-[2px] bg-muted-foreground/10 rounded w-full" />
                      </div>
                    </div>
                  </div>
                  {/* Per-page rotate button */}
                  <button
                    onClick={() => rotatePage(index)}
                    className="absolute top-2 right-2 h-8 w-8 rounded-full bg-muted flex items-center justify-center opacity-0 group-hover/page:opacity-100 transition-all hover:bg-primary/10"
                  >
                    <RotateCw size={16} className="text-muted-foreground" />
                  </button>
                </div>
                <span className="text-xs text-muted-foreground">
                  Page {index + 1}
                  {rotation !== 0 && (
                    <span className="text-primary ml-1">({rotation}°)</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="pt-2 border-t">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleApply}>
            Apply rotation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentPreviewDialog;
