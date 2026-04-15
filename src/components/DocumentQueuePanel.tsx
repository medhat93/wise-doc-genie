import { useState, useRef, useEffect, useMemo } from "react";
import { Link as LinkIcon, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { UploadedDocument, DocumentType } from "@/types/document";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { FileText, FilePlus, RotateCw, Lock, MoreVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AiIcon from "@/components/AiIcon";
import DocumentPreviewDialog from "@/components/DocumentPreviewDialog";
import { toast } from "sonner";

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
  followUpParentName?: string;
  followUpChildType?: string;
}

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

// ─── Sortable card ──────────────────────────────────────────────────────────

function SortableDocCard({
  doc,
  onRemove,
  onPreview,
  onToggleSupplement,
  onRotate,
  followUpParentName,
}: {
  doc: UploadedDocument;
  onRemove: (id: string) => void;
  onPreview: (doc: UploadedDocument) => void;
  onToggleSupplement: (id: string) => void;
  onRotate: (doc: UploadedDocument) => void;
  followUpParentName?: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: doc.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const isUploading = doc.status === "uploading" && !doc.isTemplate && !doc.isAI;
  const isSupplement = doc.documentType === "supplement";
  const isPdf = doc.type.includes("pdf");

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="group relative overflow-hidden cursor-grab active:cursor-grabbing transition-all duration-300"
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

      {/* Info + 3-dot menu */}
      <div className="p-2.5 flex flex-col gap-1">
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
            {/* Supplement badge */}
            {isSupplement && (
              <span className="inline-flex items-center gap-0.5 mt-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-600">
                <FilePlus size={9} />
                Supplement
              </span>
            )}
            {/* Follow-up note */}
            {followUpParentName && (
              <p className="text-[10px] text-muted-foreground italic mt-1 truncate">
                🔗 {isSupplement ? "Supplement" : "Follow-up"} to {followUpParentName}
              </p>
            )}
          </div>

          {/* 3-dot menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-accent flex-shrink-0"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <MoreVertical size={14} className="text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px]">
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); onToggleSupplement(doc.id); }}
              >
                {isSupplement ? (
                  <>
                    <FileText size={14} className="mr-2 text-primary" />
                    Set as primary
                  </>
                ) : (
                  <>
                    <FilePlus size={14} className="mr-2 text-amber-600" />
                    Set as supplement
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={(e) => { e.stopPropagation(); onRemove(doc.id); }}
              >
                <HugeiconsIcon icon={Delete02Icon} size={14} className="mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
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
  followUpParentName,
  followUpChildType,
}: DocumentQueuePanelProps) => {
  const [previewDoc, setPreviewDoc] = useState<UploadedDocument | null>(null);
  
  const [linkSearch, setLinkSearch] = useState("");
  const [linkedDoc, setLinkedDoc] = useState<{ name: string; status: string } | null>(null);
  const [linkDismissed, setLinkDismissed] = useState(false);
  const [showPrimaryConflict, setShowPrimaryConflict] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(documents.length);

  const MOCK_PRIMARY_DOCS = [
    { name: 'Master Services Agreement — Acme Corp', status: 'Completed', date: 'Mar 15, 2026' },
    { name: 'Enterprise License Agreement — CloudVault', status: 'In Signing', date: 'Mar 28, 2026' },
    { name: 'Annual Review — Acme Corp', status: 'Completed', date: 'Feb 10, 2026' },
    { name: 'Consulting Agreement — Strategy Partners', status: 'Draft', date: 'Apr 1, 2026' },
    { name: 'NDA — Stark Industries', status: 'In Signing', date: 'Mar 30, 2026' },
  ];

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
  const allSupplementsOnly = documents.length > 0 && primaryCount === 0 && !followUpParentName;

  const searchResults = useMemo(() => {
    if (!linkSearch.trim()) return [];
    const q = linkSearch.toLowerCase();
    return MOCK_PRIMARY_DOCS.filter(d =>
      d.name.toLowerCase().includes(q) && d.status !== 'Draft'
    ).slice(0, 5);
  }, [linkSearch]);

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

  function handleToggleSupplement(id: string) {
    setDocuments((prev) => {
      const updated = prev.map((d) => {
        if (d.id !== id) return d;
        const newType: DocumentType = d.documentType === "supplement" ? "primary" : "supplement";
        return { ...d, documentType: newType };
      });
      const newPrimaryCount = updated.filter(d => d.documentType === 'primary').length;
      if (newPrimaryCount > 0 && linkedDoc) {
        setShowPrimaryConflict(true);
      }
      return updated;
    });
  }

  // Build footer summary
  const footerText = supplementCount > 0
    ? `${primaryCount} primary · ${supplementCount} supplement`
    : `${count} document${count !== 1 ? "s" : ""}`;

  return (
    <div className={isMobile ? "flex flex-col" : "w-[260px] h-[calc(100vh-4rem)] flex flex-col border-l bg-sidebar"}>
      <div ref={scrollRef} className={`flex-1 overflow-y-auto p-3 scrollbar-thin ${isMobile ? "max-h-[50vh]" : ""}`}>
        {/* Follow-up info banner */}
        {followUpParentName && (
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-start gap-2 mb-3">
            <LinkIcon size={16} className="text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                Follow-up to:{" "}
                <button
                  className="text-primary hover:underline"
                  onClick={() => toast.info(`Opening ${followUpParentName}...`)}
                >
                  {followUpParentName}
                </button>
              </p>
            </div>
          </div>
        )}

        {/* Supplement-only linking prompt */}
        {allSupplementsOnly && !linkDismissed && !linkedDoc && (
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-3 relative">
            <button
              className="absolute top-2 right-2 text-blue-400 hover:text-blue-600 transition-colors"
              onClick={() => setLinkDismissed(true)}
            >
              <X size={14} />
            </button>
            <div className="flex items-start gap-2 mb-2">
              <LinkIcon size={16} className="text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Link to a primary document</p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">These supplements need a primary document. Search your existing documents to link them.</p>
              </div>
            </div>
            <div className="relative">
              <HugeiconsIcon icon={Search01Icon} size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={linkSearch}
                onChange={e => setLinkSearch(e.target.value)}
                placeholder="Search existing documents..."
                className="pl-8 h-9 text-sm bg-background"
              />
            </div>
            {linkSearch.trim() && (
              <div className="mt-1.5 border border-border rounded-md bg-background overflow-hidden max-h-[200px] overflow-y-auto">
                {searchResults.length > 0 ? searchResults.map((doc, i) => (
                  <button
                    key={i}
                    className="flex items-center gap-2 w-full px-2.5 py-2 text-left hover:bg-muted transition-colors border-b border-border last:border-b-0"
                    onClick={() => {
                      setLinkedDoc({ name: doc.name, status: doc.status });
                      setLinkSearch("");
                    }}
                  >
                    <FileText size={14} className="text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{doc.name}</p>
                      <p className="text-[10px] text-muted-foreground">{doc.date}</p>
                    </div>
                    <Badge className={cn('text-[9px] shrink-0',
                      doc.status === 'Completed' ? 'bg-green-100 text-green-700' :
                      doc.status === 'In Signing' ? 'bg-blue-100 text-blue-700' :
                      'bg-muted text-muted-foreground'
                    )}>{doc.status}</Badge>
                  </button>
                )) : (
                  <div className="px-3 py-3 text-center text-xs text-muted-foreground">
                    No matching documents found
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Linked document display */}
        {linkedDoc && !linkDismissed && allSupplementsOnly && (
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-2.5 mb-3 flex items-center gap-2">
            <LinkIcon size={14} className="text-blue-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{linkedDoc.name}</p>
            </div>
            <Badge className={cn('text-[9px] shrink-0',
              linkedDoc.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
            )}>{linkedDoc.status}</Badge>
            <button className="text-[10px] text-primary hover:underline shrink-0" onClick={() => { setLinkedDoc(null); setLinkSearch(""); }}>Change</button>
            <button className="text-muted-foreground hover:text-foreground shrink-0" onClick={() => setLinkedDoc(null)}>
              <X size={12} />
            </button>
          </div>
        )}

        {/* Dismissed warning */}
        {allSupplementsOnly && linkDismissed && !linkedDoc && (
          <div className="mb-2 px-1">
            <p className="text-[11px] text-amber-600 flex items-center gap-1">
              ⚠ No primary document linked
            </p>
          </div>
        )}

        {/* Primary conflict dialog */}
        <AlertDialog open={showPrimaryConflict} onOpenChange={setShowPrimaryConflict}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Primary document added</AlertDialogTitle>
              <AlertDialogDescription>
                You added a primary document. Remove the link to "{linkedDoc?.name}"?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowPrimaryConflict(false)}>Keep both</AlertDialogCancel>
              <AlertDialogAction onClick={() => { setLinkedDoc(null); setLinkDismissed(false); setShowPrimaryConflict(false); }}>Remove link</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

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
          <div className="grid grid-cols-1 gap-2">
            {/* Locked documents (not sortable) */}
            {hasLocked && (
              <>
                {lockedDocuments.map((doc) => {
                  const isSupplement = doc.documentType === "supplement";
                  return (
                    <div key={doc.id} className="relative">
                      <Card className="overflow-hidden opacity-70">
                        <div className="absolute top-1.5 right-1.5 z-10">
                          <Lock size={12} className="text-muted-foreground" />
                        </div>
                        <VerticalThumbnail doc={doc} />
                        <div className="p-2.5 flex flex-col gap-1">
                          <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                              <p className="text-xs font-medium truncate leading-tight">{doc.name}</p>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[200px] break-words text-xs">{doc.name}</TooltipContent>
                          </Tooltip>
                          <p className="text-[11px] text-muted-foreground">{doc.pageCount ?? 0} pages</p>
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground">
                              <Lock size={8} />
                              {isSupplement ? "Supplement" : "Primary"} · Locked
                            </span>
                          </div>
                        </div>
                      </Card>
                    </div>
                  );
                })}
                {/* Separator */}
                <div className="flex items-center gap-2 py-1">
                  <div className="flex-1 border-t border-dashed border-muted-foreground/30" />
                  <span className="text-[10px] text-muted-foreground/60 font-medium">New documents</span>
                  <div className="flex-1 border-t border-dashed border-muted-foreground/30" />
                </div>
              </>
            )}

            {/* Sortable new documents */}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={documents.map((d) => d.id)} strategy={verticalListSortingStrategy}>
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
                        onToggleSupplement={handleToggleSupplement}
                        onRotate={() => setPreviewDoc(doc)}
                        followUpParentName={followUpParentName || (linkedDoc && doc.documentType === 'supplement' ? linkedDoc.name : undefined)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </SortableContext>
            </DndContext>
          </div>
        )}
      </div>

      <div className="border-t px-3 py-3 flex-shrink-0 space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <HugeiconsIcon icon={File01Icon} size={13} className="text-muted-foreground" />
            <span className="text-[11px] font-medium text-muted-foreground">
              {isEmpty ? "Queue empty" : footerText}
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

      {/* Preview dialog (simple) */}
      <DocumentPreviewDialog
        doc={previewDoc}
        open={!!previewDoc}
        onOpenChange={(open) => !open && setPreviewDoc(null)}
      />

    </div>
  );
};

export default DocumentQueuePanel;
