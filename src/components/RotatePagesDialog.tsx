import { useState } from "react";
import { UploadedDocument } from "@/types/document";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { RotateCw, RotateCcw, FlipVertical } from "lucide-react";

interface PageRotation {
  page: number;
  rotation: number; // 0, 90, 180, 270
}

interface RotatePagesDialogProps {
  doc: UploadedDocument | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function normalizeRotation(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

const RotatePagesDialog = ({ doc, open, onOpenChange }: RotatePagesDialogProps) => {
  const pageCount = doc?.pageCount ?? 0;
  const [rotations, setRotations] = useState<number[]>(() =>
    Array(pageCount).fill(0)
  );

  // Reset state when doc changes
  const [prevDocId, setPrevDocId] = useState<string | null>(null);
  if (doc && doc.id !== prevDocId) {
    setPrevDocId(doc.id);
    setRotations(Array(doc.pageCount ?? 0).fill(0));
  }

  const rotatePage = (index: number, degrees: number) => {
    setRotations((prev) => {
      const next = [...prev];
      next[index] = normalizeRotation(next[index] + degrees);
      return next;
    });
  };

  const rotateAll = (degrees: number) => {
    setRotations((prev) => prev.map((r) => normalizeRotation(r + degrees)));
  };

  const handleApply = () => {
    // Prototype: just close. In production this would persist rotation data.
    onOpenChange(false);
  };

  if (!doc) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-base truncate pr-6">
            Rotate Pages — {doc.name}
          </DialogTitle>
        </DialogHeader>

        {/* Rotate All controls */}
        <div className="flex items-center gap-2 pb-2 border-b">
          <span className="text-xs font-medium text-muted-foreground mr-auto">Rotate all pages:</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => rotateAll(-90)}>
                <RotateCcw size={14} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>90° counter-clockwise</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => rotateAll(180)}>
                <FlipVertical size={14} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>180°</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => rotateAll(90)}>
                <RotateCw size={14} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>90° clockwise</TooltipContent>
          </Tooltip>
        </div>

        {/* Page grid */}
        <div className="flex-1 overflow-y-auto py-3 scrollbar-thin">
          <div className="grid grid-cols-3 gap-3">
            {rotations.map((rotation, index) => (
              <div key={index} className="flex flex-col items-center gap-1.5">
                {/* Page thumbnail */}
                <div className="relative group/page">
                  <div
                    className="w-full aspect-[3/4] rounded border bg-muted/50 flex items-center justify-center transition-transform duration-300"
                    style={{ transform: `rotate(${rotation}deg)` }}
                  >
                    <div className="flex flex-col items-center gap-1 px-2">
                      <span className="text-lg font-semibold text-muted-foreground/40">{index + 1}</span>
                      <div className="space-y-1 w-full">
                        <div className="h-[2px] bg-muted-foreground/10 rounded w-full" />
                        <div className="h-[2px] bg-muted-foreground/8 rounded w-4/5" />
                        <div className="h-[2px] bg-muted-foreground/10 rounded w-full" />
                      </div>
                    </div>
                  </div>
                  {/* Per-page rotate button */}
                  <button
                    onClick={() => rotatePage(index, 90)}
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-background border shadow-sm flex items-center justify-center opacity-0 group-hover/page:opacity-100 transition-opacity hover:bg-accent"
                  >
                    <RotateCw size={10} className="text-muted-foreground" />
                  </button>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  Page {index + 1}
                  {rotation !== 0 && (
                    <span className="text-primary ml-0.5">({rotation}°)</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="pt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleApply}>
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RotatePagesDialog;
