import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Upload, FilePlus2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { EditorDocument } from "./EditorDocumentsPopover";
import { libraryTemplates, userTemplates } from "@/data/templates";

interface AddDocumentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (docs: EditorDocument[]) => void;
}

const QUICK_TEMPLATES = [...userTemplates.slice(0, 3), ...libraryTemplates.slice(0, 3)];

const inferFileType = (name: string): EditorDocument["fileType"] => {
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf")) return "pdf";
  if (lower.match(/\.(png|jpe?g|gif|webp)$/)) return "image";
  return "docx";
};

const AddDocumentsDialog = ({ open, onOpenChange, onAdd }: AddDocumentsDialogProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = (files: FileList | File[]) => {
    const arr = Array.from(files);
    if (arr.length === 0) return;
    const docs: EditorDocument[] = arr.map((f) => ({
      id: `doc-${crypto.randomUUID().slice(0, 8)}`,
      name: f.name.replace(/\.[^.]+$/, ""),
      docType: "primary",
      fileType: inferFileType(f.name),
    }));
    onAdd(docs);
    toast.success(`Added ${docs.length} document${docs.length !== 1 ? "s" : ""}`);
    onOpenChange(false);
  };

  const handleBlank = () => {
    const doc: EditorDocument = {
      id: `doc-${crypto.randomUUID().slice(0, 8)}`,
      name: "Untitled document",
      docType: "primary",
      fileType: "docx",
    };
    onAdd([doc]);
    toast.success("Blank document added");
    onOpenChange(false);
  };

  const handleTemplate = (tplName: string) => {
    const doc: EditorDocument = {
      id: `doc-${crypto.randomUUID().slice(0, 8)}`,
      name: tplName,
      docType: "primary",
      fileType: "pdf",
    };
    onAdd([doc]);
    toast.success(`"${tplName}" added`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add documents</DialogTitle>
          <DialogDescription>Upload files, pick a template, or start blank.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div
            className={cn(
              "col-span-2 cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-colors",
              dragOver ? "border-primary bg-primary/5" : "border-primary/30 bg-primary/[0.03] hover:border-primary/60"
            )}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
            }}
          >
            <div className="mx-auto h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <Upload size={18} className="text-primary" />
            </div>
            <p className="text-sm font-semibold">Upload a document</p>
            <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, PNG, JPG — drag & drop or click to browse</p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
            />
          </div>

          <Button variant="outline" className="h-auto py-3 justify-start gap-3" onClick={handleBlank}>
            <FilePlus2 size={16} className="text-muted-foreground" />
            <div className="text-left">
              <p className="text-sm font-medium">Blank document</p>
              <p className="text-xs text-muted-foreground">Start from a clean slate</p>
            </div>
          </Button>

          <Button variant="outline" className="h-auto py-3 justify-start gap-3" disabled>
            <Sparkles size={16} className="text-violet-600" />
            <div className="text-left">
              <p className="text-sm font-medium">Draft with AI</p>
              <p className="text-xs text-muted-foreground">Coming soon in this modal</p>
            </div>
          </Button>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Use a template</p>
          <div className="grid grid-cols-2 gap-2 max-h-[260px] overflow-y-auto pr-1">
            {QUICK_TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => handleTemplate(t.name)}
                className="flex items-center gap-3 rounded-md border p-2.5 text-left hover:bg-muted/50 transition-colors"
              >
                <div className={cn("h-9 w-9 rounded bg-gradient-to-br flex items-center justify-center flex-shrink-0", t.gradient)}>
                  <FileText size={16} className="text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{t.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{t.pageCount} pages</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddDocumentsDialog;