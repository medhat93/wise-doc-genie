import { Template } from "@/data/templates";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { categoryBadgeMap } from "@/data/templates";

interface TemplatePreviewDialogProps {
  template: Template | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUse: (template: Template) => void;
}

const TemplatePreviewDialog = ({ template, open, onOpenChange, onUse }: TemplatePreviewDialogProps) => {
  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>{template.name}</DialogTitle>
            <Badge variant="secondary">{categoryBadgeMap[template.name] || template.category}</Badge>
          </div>
        </DialogHeader>
        <div className={`h-[400px] bg-gradient-to-br ${template.gradient} rounded-lg flex items-start justify-center pt-8`}>
          <div className="w-[320px] bg-white/95 rounded-lg shadow-lg p-8 space-y-4">
            <div className="h-[6px] bg-gray-300 rounded w-3/5" />
            <div className="h-[4px] bg-gray-200 rounded w-full" />
            <div className="h-[4px] bg-gray-200 rounded w-4/5" />
            <div className="h-[4px] bg-gray-200 rounded w-full" />
            <div className="h-[4px] bg-gray-200 rounded w-2/3" />
            <div className="mt-6 h-[6px] bg-gray-300 rounded w-2/5" />
            <div className="h-[4px] bg-gray-200 rounded w-full" />
            <div className="h-[4px] bg-gray-200 rounded w-full" />
            <div className="h-[4px] bg-gray-200 rounded w-3/4" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => { onUse(template); onOpenChange(false); }}>Create from Template</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TemplatePreviewDialog;
