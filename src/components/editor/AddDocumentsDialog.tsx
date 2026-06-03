import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
import { X } from "lucide-react";
import CreateDocument from "@/pages/CreateDocument";
import type { EditorDocument } from "./EditorDocumentsPopover";

interface AddDocumentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (docs: EditorDocument[]) => void;
}

const AddDocumentsDialog = ({ open, onOpenChange, onAdd }: AddDocumentsDialogProps) => {
  const handleSubmit = (docs: EditorDocument[]) => {
    if (docs.length > 0) {
      onAdd(docs);
      toast.success(`Added ${docs.length} document${docs.length !== 1 ? "s" : ""}`);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[95vw] w-[1280px] h-[90vh] p-0 overflow-hidden gap-0 [&>button.absolute]:hidden"
      >
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 z-50 rounded-md p-1.5 bg-background/80 backdrop-blur hover:bg-muted transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="h-full overflow-hidden">
          <CreateDocument embedded disableAI onSubmitDocuments={handleSubmit} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddDocumentsDialog;