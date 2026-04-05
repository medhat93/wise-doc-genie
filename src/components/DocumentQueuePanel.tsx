import { useState, useRef, useEffect } from "react";
import { UploadedDocument, DocumentType } from "@/types/document";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  CloudUploadIcon,
  ViewIcon,
  Delete02Icon,
  DragDropVerticalIcon,
  File01Icon,
  Image01Icon,
  CheckmarkCircle02Icon,
  CloudIcon,
  Edit02Icon,
  SentIcon,
} from "@hugeicons/core-free-icons";
import { FileText, FilePlus, Paperclip, RotateCw, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AiIcon from "@/components/AiIcon";
import RotatePagesDialog from "@/components/RotatePagesDialog";

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
  onAddFiles: () => void;
  mode?: CreateDocumentMode;
  isMobile?: boolean;
  onEditDocuments?: () => void;
  lockedDocuments?: UploadedDocument[];
}

// ─── Document type config ──────────────────────────────────────────────────

const DOC_TYPE_CONFIG: Record<DocumentType, {
  label: string;
  icon: typeof FileText;
  borderClass: string;
  badgeBg: string;
  badgeText: string;
}> = {
  primary: {
    label: "Primary",
    icon: FileText,
    borderClass: "border-l-primary",
    badgeBg: "bg-primary/10",
    badgeText: "text-primary",
  },
  supplement: {
    label: "Supplement",
    icon: FilePlus,
    borderClass: "border-l-amber-500",
    badgeBg: "bg-amber-500/10",
    badgeText: "text-amber-600",
  },
  attachment: {
    label: "Attachment",
    icon: Paperclip,
    borderClass: "border-l-muted-foreground",
    badgeBg: "bg-muted",
    badgeText: "text-muted-foreground",
  },
  amendment: {
    label: "Amendment",
    icon: FileText,
    borderClass: "border-l-violet-500",
    badgeBg: "bg-violet-500/10",
    badgeText: "text-violet-600",
  },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function getFileIcon(type: string) {
  if (type.includes("pdf")) return { icon: File01Icon, bg: "bg-red-100", color: "text-red-600" };
  if (type.includes("word") || type.includes("doc"))
    return { icon: File01Icon, bg: "bg-brand-indigo-light", color: "text-brand-indigo" };
  if (type.startsWith("image/")) return { icon: Image01Icon, bg: "bg-green-100", color: "text-green-600" };
  return { icon: File01Icon, bg: "bg-muted", color: "text-muted-foreground" };
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Vertical thumbnail ────────────────────────────────────────────────────

function VerticalThumbnail({ doc }: { doc: UploadedDocument }) {
  if (doc.isTemplate) {
    if (doc.isUserTemplate || !doc.gradient) {
      return (
        <div className="w-full aspect-[4/3] rounded-tr-lg bg-muted flex items-center justify-center">
          <div className="w-[80px] space-y-1.5 p-2 bg-background rounded shadow-sm">
            <div className="h-[3px] bg-muted-foreground/20 rounded w-full" />
            <div className="h-[3px] bg-muted-foreground/15 rounded w-4/5" />
            <div className="h-[3px] bg-muted-foreground/20 rounded w-full" />
            <div className="h-[3px] bg-muted-foreground/15 rounded w-3/5" />
          </div>
        </div>
      );
    }
    return (
      <div
        className={`w-full aspect-[4/3] rounded-tr-lg bg-gradient-to-br ${doc.gradient} flex items-center justify-center`}
      >
        <div className="w-[80px] space-y-1.5 p-2 bg-white/90 rounded shadow-sm">
          <div className="h-[3px] bg-gray-200 rounded w-full" />
          <div className="h-[3px] bg-gray-200 rounded w-4/5" />
          <div className="h-[3px] bg-gray-200 rounded w-full" />
          <div className="h-[3px] bg-gray-200 rounded w-3/5" />
        </div>
      </div>
    );
  }

  if (doc.isAI) {
    const isGenerating = doc.status === "uploading";
    return (
      <div
        className={`w-full aspect-[4/3] rounded-tr-lg bg-muted/50 border-b flex items-center justify-center ${isGenerating ? "animate-pulse" : ""}`}
      >
        <AiIcon size={32} className={isGenerating ? "animate-spin" : ""} />
      </div>
    );
  }

  if (doc.status === "uploading") {
    return (
      <div className="w-full aspect-[4/3] rounded-tr-lg relative">
        <Skeleton className="w-full h-full rounded-tr-lg rounded-b-none rounded-tl-none" />
        {doc.isDriveImport && (
          <div className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-background border flex items-center justify-center">
            <HugeiconsIcon icon={CloudIcon} size={10} className="text-muted-foreground" />
          </div>
        )}
      </div>
    );
  }

  const fileStyle = getFileIcon(doc.type);
  return (
    <div className="relative w-full">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`w-full aspect-[4/3] rounded-tr-lg flex items-center justify-center ${fileStyle.bg}`}
      >
        <HugeiconsIcon icon={fileStyle.icon} size={36} className={fileStyle.color} />
      </motion.div>
      {doc.isDriveImport && (
        <div className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-background border flex items-center justify-center">
          <HugeiconsIcon icon={CloudIcon} size={10} className="text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

// ─── Document type badge with dropdown ──────────────────────────────────────

function DocTypeBadge({
  doc,
  onChangeType,
}: {
  doc: UploadedDocument;
  onChangeType: (id: string, type: DocumentType) => void;
}) {
  const config = DOC_TYPE_CONFIG[doc.documentType];
  const Icon = config.icon;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium transition-colors hover:opacity-80 ${config.badgeBg} ${config.badgeText}`}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Icon size={10} />
          {config.label}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[140px] p-1" sideOffset={4}>
        {(Object.keys(DOC_TYPE_CONFIG) as DocumentType[]).map((dtype) => {
          const c = DOC_TYPE_CONFIG[dtype];
          const TypeIcon = c.icon;
          return (
            <button
              key={dtype}
              onClick={(e) => {
                e.stopPropagation();
                onChangeType(doc.id, dtype);
              }}
              className={`flex items-center gap-2 w-full px-2 py-1.5 rounded text-xs hover:bg-accent transition-colors ${doc.documentType === dtype ? "font-semibold" : ""}`}
            >
              <TypeIcon size={14} className={c.badgeText} />
              {c.label}
              {doc.documentType === dtype && (
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={12} className="ml-auto text-primary" />
              )}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

// ─── Sortable card ──────────────────────────────────────────────────────────

function SortableDocCard({
  doc,
  onRemove,
  onPreview,
  onChangeType,
  onRotate,
}: {
  doc: UploadedDocument;
  onRemove: (id: string) => void;
  onPreview: (doc: UploadedDocument) => void;
  onChangeType: (id: string, type: DocumentType) => void;
  onRotate: (doc: UploadedDocument) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: doc.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const isUploading = doc.status === "uploading" && !doc.isTemplate && !doc.isAI;
  const typeConfig = DOC_TYPE_CONFIG[doc.documentType];

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group relative overflow-hidden cursor-grab active:cursor-grabbing border-l-[3px] transition-all duration-300 ${typeConfig.borderClass}`}
    >
      {/* Drag handle indicator */}
      <div className="absolute top-1.5 left-1.5 z-10 bg-background/80 backdrop-blur-sm rounded p-0.5 pointer-events-none">
        <HugeiconsIcon icon={DragDropVerticalIcon} size={14} className="text-muted-foreground/60" />
      </div>

      {/* Status badge */}
      {doc.status === "complete" && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400 }}
          className="absolute top-1.5 right-1.5 z-10"
        >
          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} className="text-emerald-500" />
        </motion.div>
      )}

      {/* Thumbnail with preview overlay */}
      <div className="relative">
        <VerticalThumbnail doc={doc} />
        <button
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 rounded-tr-lg"
          onClick={(e) => { e.stopPropagation(); onPreview(doc); }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="bg-background/90 backdrop-blur-sm rounded-full p-2">
            <HugeiconsIcon icon={ViewIcon} size={16} className="text-foreground" />
          </div>
        </button>
      </div>

      {/* Info + type badge + remove */}
      <div className="p-2.5 flex flex-col gap-1.5">
        <div className="flex items-start gap-1">
          <div className="flex-1 min-w-0">
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <p className="text-xs font-medium truncate leading-tight">{doc.name}</p>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[200px] break-words text-xs">
                {doc.name}
              </TooltipContent>
            </Tooltip>
            {doc.isAI && doc.status === "uploading" ? (
              <AnimatePresence mode="wait">
                <motion.p
                  key={doc.aiThinkingStep || "generating"}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="text-[11px] ai-thinking-text truncate mt-0.5"
                >
                  {doc.aiThinkingStep || "AI is generating..."}
                </motion.p>
              </AnimatePresence>
            ) : (
              <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                {doc.isTemplate
                  ? `${doc.pageCount ?? 0} ${(doc.pageCount ?? 0) === 1 ? "page" : "pages"}`
                  : doc.status === "uploading"
                    ? doc.isDriveImport
                      ? "Importing..."
                      : "Uploading..."
                    : `${doc.pageCount ?? 0} pages`}
              </p>
            )}
          </div>

          {/* Rotate button (PDF only) */}
          {doc.type.includes("pdf") && doc.status === "complete" && (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-accent flex-shrink-0"
                  onClick={(e) => { e.stopPropagation(); onRotate(doc); }}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <RotateCw size={14} className="text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Rotate pages</TooltipContent>
            </Tooltip>
          )}

          {/* Remove button */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10 flex-shrink-0"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <HugeiconsIcon icon={Delete02Icon} size={14} className="text-destructive" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove from queue?</AlertDialogTitle>
                <AlertDialogDescription>"{doc.name}" will be removed from the queue.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onRemove(doc.id)}>Remove</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Type badge */}
        <DocTypeBadge doc={doc} onChangeType={onChangeType} />
      </div>

      {/* Upload progress */}
      <AnimatePresence>
        {isUploading && (
          <motion.div className="px-2 pb-2" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Progress value={doc.progress} className="h-1" />
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

// ─── Preview dialog thumbnail ───────────────────────────────────────────────

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
      <div
        className={`h-10 w-10 rounded flex-shrink-0 bg-gradient-to-br ${doc.gradient} flex items-center justify-center`}
      >
        <HugeiconsIcon icon={File01Icon} size={16} className="text-white/90" />
      </div>
    );
  }

  if (doc.isAI) {
    return (
      <div className="h-10 w-10 rounded flex-shrink-0 bg-white flex items-center justify-center border">
        <AiIcon size={16} />
      </div>
    );
  }

  const fileStyle = getFileIcon(doc.type);
  return (
    <div className={`h-10 w-10 rounded flex items-center justify-center flex-shrink-0 ${fileStyle.bg}`}>
      <HugeiconsIcon icon={fileStyle.icon} size={20} className={fileStyle.color} />
    </div>
  );
}

// ─── Main panel ─────────────────────────────────────────────────────────────

const DocumentQueuePanel = ({
  documents,
  setDocuments,
  onAddFiles,
  mode = "full",
  isMobile = false,
  onEditDocuments,
  lockedDocuments = [],
}: DocumentQueuePanelProps) => {
  const [previewDoc, setPreviewDoc] = useState<UploadedDocument | null>(null);
  const [rotateDoc, setRotateDoc] = useState<UploadedDocument | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(documents.length);

  useEffect(() => {
    if (documents.length > prevCountRef.current && scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
    prevCountRef.current = documents.length;
  }, [documents.length]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const hasLocked = lockedDocuments.length > 0;
  const allDocs = [...lockedDocuments, ...documents];
  const isEmpty = allDocs.length === 0;
  const count = allDocs.length;
  const primaryCount = allDocs.filter((d) => d.documentType === "primary").length;
  const supplementCount = allDocs.filter((d) => d.documentType === "supplement").length;
  const attachmentCount = allDocs.filter((d) => d.documentType === "attachment").length;
  const amendmentCount = allDocs.filter((d) => d.documentType === "amendment").length;
  const hasPrimary = primaryCount > 0;

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

  function handleChangeType(id: string, newType: DocumentType) {
    setDocuments((prev) =>
      prev.map((d) => (d.id === id ? { ...d, documentType: newType } : d))
    );
  }

  // Build footer summary
  const footerParts: string[] = [];
  if (primaryCount > 0) footerParts.push(`${primaryCount} primary`);
  if (supplementCount > 0) footerParts.push(`${supplementCount} supplement`);
  if (attachmentCount > 0) footerParts.push(`${attachmentCount} attachment`);

  return (
    <div className={isMobile ? "flex flex-col" : "w-[260px] h-[calc(100vh-4rem)] flex flex-col border-l bg-sidebar"}>
      <div ref={scrollRef} className={`flex-1 overflow-y-auto p-3 scrollbar-thin ${isMobile ? "max-h-[50vh]" : ""}`}>
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-2">
            <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl p-6 flex flex-col items-center w-full">
              <div className="rounded-full p-3 bg-muted mb-2">
                <HugeiconsIcon icon={CloudUploadIcon} size={28} className="text-muted-foreground/40" />
              </div>
              <p className="text-xs font-medium text-muted-foreground mt-1">Add your first document to get started</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">
                Upload files, use a template, or create with AI
              </p>
            </div>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={documents.map((d) => d.id)} strategy={verticalListSortingStrategy}>
              <div className="grid grid-cols-1 gap-2">
                <AnimatePresence initial={false}>
                  {documents.map((doc) => (
                    <motion.div
                      key={doc.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <SortableDocCard
                        doc={doc}
                        onRemove={handleRemove}
                        onPreview={setPreviewDoc}
                        onChangeType={handleChangeType}
                        onRotate={setRotateDoc}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      <div className="border-t px-3 py-3 flex-shrink-0 space-y-1.5">
        {/* Warning if no primary */}
        {!isEmpty && !hasPrimary && (
          <p className="text-[10px] text-amber-600 font-medium">
            At least one primary document is required
          </p>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <HugeiconsIcon icon={File01Icon} size={13} className="text-muted-foreground" />
            <span className="text-[11px] font-medium text-muted-foreground">
              {isEmpty ? "Queue empty" : footerParts.join(" · ")}
            </span>
          </div>
          {!isEmpty && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="text-[11px] text-destructive hover:text-destructive/80 transition-colors">
                  Remove all
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove all documents?</AlertDialogTitle>
                  <AlertDialogDescription>
                    All {count} document{count !== 1 ? "s" : ""} will be removed from the queue.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => setDocuments([])}>Remove</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
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
                    {previewDoc.isTemplate
                      ? "Template"
                      : previewDoc.isAI
                        ? "AI Generated"
                        : previewDoc.type.split("/").pop()?.toUpperCase() || "File"}
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
                  <p className="text-xs text-muted-foreground">Classification</p>
                  <p className="font-medium mt-0.5 capitalize">{previewDoc.documentType}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <RotatePagesDialog
        doc={rotateDoc}
        open={!!rotateDoc}
        onOpenChange={(open) => !open && setRotateDoc(null)}
      />
    </div>
  );
};

export default DocumentQueuePanel;
