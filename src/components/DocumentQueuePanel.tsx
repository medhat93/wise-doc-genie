import { useState } from "react";
import { UploadedDocument } from "@/types/document";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  Add01Icon,
  CloudUploadIcon,
  ViewIcon,
  Delete02Icon,
  DragDropVerticalIcon,
  File01Icon,
  Image01Icon,
  CheckmarkCircle02Icon,
  
  CloudIcon,
} from "@hugeicons/core-free-icons";
import { motion, AnimatePresence } from "framer-motion";
import AiIcon from "@/components/AiIcon";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export type CreateDocumentMode = "full" | "esign";

interface DocumentQueuePanelProps {
  documents: UploadedDocument[];
  setDocuments: React.Dispatch<React.SetStateAction<UploadedDocument[]>>;
  onClose: () => void;
  onAddFiles: () => void;
  mode?: CreateDocumentMode;
}

function getFileIcon(type: string) {
  if (type.includes("pdf")) return { icon: File01Icon, bg: "bg-red-100", color: "text-red-600" };
  if (type.includes("word") || type.includes("doc")) return { icon: File01Icon, bg: "bg-brand-indigo-light", color: "text-brand-indigo" };
  if (type.startsWith("image/")) return { icon: Image01Icon, bg: "bg-green-100", color: "text-green-600" };
  return { icon: File01Icon, bg: "bg-muted", color: "text-muted-foreground" };
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function QueueItemThumbnail({ doc }: { doc: UploadedDocument }) {
  if (doc.isTemplate) {
    if (doc.isUserTemplate || !doc.gradient) {
      return (
        <div className="h-10 w-10 rounded flex-shrink-0 bg-muted flex items-center justify-center">
          <HugeiconsIcon icon={File01Icon} size={20} className="text-muted-foreground" />
        </div>
      );
    }
    return (
      <div className={`h-10 w-10 rounded flex-shrink-0 bg-gradient-to-br ${doc.gradient} flex items-center justify-center`}>
        <HugeiconsIcon icon={File01Icon} size={16} className="text-white/90" />
      </div>
    );
  }

  if (doc.isAI) {
    return (
      <div className="h-10 w-10 rounded flex-shrink-0 bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
        <AiIcon size={16} />
      </div>
    );
  }

  if (doc.status === "uploading") {
    return (
      <div className="relative">
        <Skeleton className="h-10 w-10 rounded flex-shrink-0" />
        {doc.isDriveImport && (
          <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-background border flex items-center justify-center">
            <HugeiconsIcon icon={CloudIcon} size={10} className="text-muted-foreground" />
          </div>
        )}
      </div>
    );
  }

  const fileStyle = getFileIcon(doc.type);
  return (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`h-10 w-10 rounded flex items-center justify-center flex-shrink-0 ${fileStyle.bg}`}
      >
        <HugeiconsIcon icon={fileStyle.icon} size={20} className={fileStyle.color} />
      </motion.div>
      {doc.isDriveImport && (
        <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-background border flex items-center justify-center">
          <HugeiconsIcon icon={CloudIcon} size={10} className="text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

function SortableDocItem({
  doc,
  onRemove,
  onPreview,
}: {
  doc: UploadedDocument;
  onRemove: (id: string) => void;
  onPreview: (doc: UploadedDocument) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: doc.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const sublabel = doc.isTemplate
    ? `Template · ${doc.pageCount ?? 0} ${(doc.pageCount ?? 0) === 1 ? "page" : "pages"}`
    : doc.isAI
    ? "AI Generated"
    : doc.status === "uploading"
    ? (doc.isDriveImport ? `Importing from ${doc.driveProvider || "Drive"}...` : "Uploading...")
    : `${doc.size ? formatSize(doc.size) : ""} · ${doc.pageCount} pages`;

  return (
    <Card ref={setNodeRef} style={style} className="p-3 group">
      <div className="flex items-center gap-3">
        <div {...attributes} {...listeners} className="cursor-grab text-muted-foreground/50">
          <HugeiconsIcon icon={DragDropVerticalIcon} size={16} />
        </div>

        <QueueItemThumbnail doc={doc} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold truncate">{doc.name}</p>
            {doc.status === "complete" && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} className="text-emerald-500 flex-shrink-0" />
              </motion.div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{sublabel}</p>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onPreview(doc)}>
            <HugeiconsIcon icon={ViewIcon} size={14} />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                <HugeiconsIcon icon={Delete02Icon} size={14} />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove from queue?</AlertDialogTitle>
                <AlertDialogDescription>
                  "{doc.name}" will be removed from the queue.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onRemove(doc.id)}>Remove</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <AnimatePresence>
        {doc.status === "uploading" && !doc.isTemplate && !doc.isAI && (
          <motion.div
            className="mt-2 ml-7"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Progress value={doc.progress} className="h-1" />
            <p className="text-xs text-muted-foreground text-right mt-0.5">
              {Math.min(doc.progress, 100)}%
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

const DocumentQueuePanel = ({
  documents,
  setDocuments,
  onClose,
  onAddFiles,
  mode = "full",
}: DocumentQueuePanelProps) => {
  const [previewDoc, setPreviewDoc] = useState<UploadedDocument | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const isEmpty = documents.length === 0;
  const totalPages = documents.reduce((sum, d) => sum + (d.pageCount ?? 0), 0);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setDocuments((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  function handleRemove(id: string) {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  }

  return (
    <div className="w-[400px] h-[calc(100vh-4rem)] flex flex-col border-l bg-sidebar">
      <div className="h-14 px-4 flex items-center justify-between border-b flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">Document Queue</span>
          {documents.length > 0 && (
            <Badge className="rounded-full h-5 min-w-[20px] flex items-center justify-center text-xs">
              {documents.length}
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <HugeiconsIcon icon={Cancel01Icon} size={16} />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl p-8 flex flex-col items-center w-full">
              <HugeiconsIcon icon={CloudUploadIcon} size={40} className="text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground mt-3">
                Add documents to get started
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Upload files, use templates, or start with AI
              </p>
            </div>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={documents.map((d) => d.id)}
              strategy={verticalListSortingStrategy}
            >
              {documents.map((doc) => (
                <SortableDocItem key={doc.id} doc={doc} onRemove={handleRemove} onPreview={setPreviewDoc} />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>

      <div className="border-t p-4 space-y-2 flex-shrink-0">
        {!isEmpty && (
          <p className="text-xs text-muted-foreground text-center">
            {documents.length} document{documents.length !== 1 ? "s" : ""} · {totalPages} pages total
          </p>
        )}
        <Button variant="ghost" className="w-full" onClick={onAddFiles}>
          <HugeiconsIcon icon={Add01Icon} size={16} className="mr-1.5" />
          {isEmpty ? "Add Documents" : "Add More Documents"}
        </Button>
      </div>

      <Dialog open={!!previewDoc} onOpenChange={(open) => !open && setPreviewDoc(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <HugeiconsIcon icon={ViewIcon} size={18} />
              {previewDoc?.name}
            </DialogTitle>
          </DialogHeader>
          {previewDoc && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg border bg-muted/50 p-6 flex flex-col items-center min-h-[280px] justify-center">
                <QueueItemThumbnail doc={previewDoc} />
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
                    {previewDoc.isTemplate ? "Template" : previewDoc.isAI ? "AI Generated" : previewDoc.type.split("/").pop()?.toUpperCase() || "File"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pages</p>
                  <p className="font-medium mt-0.5">{previewDoc.pageCount ?? "—"}</p>
                </div>
                {previewDoc.size && (
                  <div>
                    <p className="text-xs text-muted-foreground">Size</p>
                    <p className="font-medium mt-0.5">{formatSize(previewDoc.size)}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="font-medium mt-0.5 capitalize">{previewDoc.status}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocumentQueuePanel;
