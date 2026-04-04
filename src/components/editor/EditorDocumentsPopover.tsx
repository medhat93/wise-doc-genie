import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Files01Icon, ViewIcon } from "@hugeicons/core-free-icons";
import { FileText, FileImage } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface EditorDocument {
  id: string;
  name: string;
  docType: "primary" | "supplement" | "attachment";
  fileType: "pdf" | "docx" | "image";
}

const DOC_TYPE_STYLES: Record<string, { label: string; className: string }> = {
  primary: { label: "Primary", className: "bg-[hsl(var(--brand-indigo))]/15 text-[hsl(var(--brand-indigo))] border-[hsl(var(--brand-indigo))]/30" },
  supplement: { label: "Supplement", className: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30" },
  attachment: { label: "Attachment", className: "bg-muted text-muted-foreground border-border" },
};

const FILE_ICONS: Record<string, { icon: typeof FileText; className: string }> = {
  pdf: { icon: FileText, className: "text-destructive" },
  docx: { icon: FileText, className: "text-primary" },
  image: { icon: FileImage, className: "text-emerald-600" },
};

interface EditorDocumentsPopoverProps {
  documents: EditorDocument[];
  activeDocId: string | null;
  onScrollToDoc: (id: string) => void;
}

const EditorDocumentsPopover = ({ documents, activeDocId, onScrollToDoc }: EditorDocumentsPopoverProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 px-2 text-xs gap-1.5">
          <HugeiconsIcon icon={Files01Icon} size={14} />
          <span className="hidden sm:inline">Documents</span>
          <Badge variant="secondary" className="h-4 px-1 text-[10px] font-medium min-w-[16px] justify-center">
            {documents.length}
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2.5 border-b">
          <span className="text-sm font-semibold">Documents</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs gap-1"
            onClick={() => {
              toast("Navigate to Step 1 to add documents");
              setOpen(false);
            }}
          >
            <HugeiconsIcon icon={Add01Icon} size={12} />
            Add document
          </Button>
        </div>
        <div className="max-h-64 overflow-y-auto py-1">
          {documents.map((doc) => {
            const isActive = doc.id === activeDocId;
            const fileIcon = FILE_ICONS[doc.fileType];
            const typeStyle = DOC_TYPE_STYLES[doc.docType];
            const Icon = fileIcon.icon;
            return (
              <button
                key={doc.id}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-accent",
                  isActive && "bg-primary/5 border-l-2 border-primary"
                )}
                onClick={() => {
                  onScrollToDoc(doc.id);
                  setOpen(false);
                }}
              >
                <Icon size={16} className={cn("flex-shrink-0", fileIcon.className)} />
                <span className="text-sm truncate flex-1">{doc.name}</span>
                <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-4 font-medium border", typeStyle.className)}>
                  {typeStyle.label}
                </Badge>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <span className="p-0.5 rounded opacity-40 cursor-not-allowed">
                      <HugeiconsIcon icon={ViewIcon} size={12} className="text-muted-foreground" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="right">Add participants first</TooltipContent>
                </Tooltip>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default EditorDocumentsPopover;
