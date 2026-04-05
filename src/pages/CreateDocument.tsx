import { useState, useRef, useCallback, useEffect, DragEvent, useMemo } from "react";
import { X, AlertTriangle, Link as LinkIcon } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast as sonnerToast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CloudUploadIcon,
  CloudIcon,
  Files01Icon,
  ArrowRight01Icon,
  Search01Icon,
  ArrowRight02Icon,
  File01Icon,
  SparklesIcon,
  Loading03Icon,
  Edit02Icon,
  FileValidationIcon,
  SentIcon,
  Cancel01Icon,
  FileAddIcon,
  ArrowDown01Icon,
  Add01Icon,
  Note01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { toast } from "@/hooks/use-toast";
import {
  libraryTemplates,
  userTemplates,
  sharedTemplates,
  libraryCategories,
  myTemplateCategories,
  quickFilterCategories,
  Template,
} from "@/data/templates";
import { UploadedDocument, DriveFile, DRIVE_PROVIDERS } from "@/types/document";
import TemplateCard from "@/components/TemplateCard";
import TemplatePreviewDialog from "@/components/TemplatePreviewDialog";
import DocumentQueuePanel from "@/components/DocumentQueuePanel";
import type { CreateDocumentMode } from "@/components/DocumentQueuePanel";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import DragDropOverlay from "@/components/DragDropOverlay";
import CategoryFilter from "@/components/CategoryFilter";
import DriveConnectDialog from "@/components/DriveConnectDialog";
import DriveBrowserView from "@/components/DriveBrowserView";
import AiIcon from "@/components/AiIcon";
import signitLogo from "@/assets/signit-logo.png";
import { GoogleDriveLogo, DropboxLogo, OneDriveLogo } from "@/components/DriveLogos";

// ─── AI Suggestion Templates ──────────────────────────────────────────────────

const AI_SUGGESTIONS = [
  {
    label: "Sales Proposal",
    options: [
      { name: "Product sales proposal", template: "Draft a professional product sales proposal for [Company Name] offering [Product] to [Client Name]." },
      { name: "Service sales proposal", template: "Draft a service sales proposal for [Company Name] offering [Service] to [Client Name], including scope and pricing." },
      { name: "SaaS partnership proposal", template: "Draft a SaaS partnership proposal between [Company A] and [Company B] for co-selling [Product/Platform]." },
      { name: "Enterprise deal proposal", template: "Draft an enterprise sales proposal for [Company Name] targeting [Enterprise Client] with a multi-year deal structure." },
    ],
  },
  {
    label: "Non-Disclosure Agreement",
    options: [
      { name: "Mutual NDA", template: "Draft a mutual non-disclosure agreement between [Party A] and [Party B] for [Business Purpose]." },
      { name: "One-way NDA", template: "Draft a one-way non-disclosure agreement where [Disclosing Party] shares confidential information with [Receiving Party]." },
      { name: "Employee NDA", template: "Draft an employee non-disclosure agreement for [Company Name] to be signed by new hires upon onboarding." },
      { name: "Investor NDA", template: "Draft a non-disclosure agreement for [Company Name] to share confidential business information with potential investors." },
      { name: "Vendor NDA", template: "Draft a vendor non-disclosure agreement between [Company Name] and [Vendor Name] for [Project/Service]." },
    ],
  },
  {
    label: "Service Contract",
    options: [
      { name: "Freelance service agreement", template: "Draft a freelance service agreement between [Freelancer] and [Client] for [Type of Work], including payment terms and deliverables." },
      { name: "Managed services contract", template: "Draft a managed services contract between [Provider] and [Client] for ongoing [IT/Marketing/HR] services." },
      { name: "Maintenance agreement", template: "Draft a maintenance and support agreement between [Provider] and [Client] for [Software/Equipment]." },
      { name: "Professional services contract", template: "Draft a professional services contract for [Company] providing [Consulting/Advisory] services to [Client]." },
    ],
  },
  {
    label: "Employment Offer",
    options: [
      { name: "Full-time offer letter", template: "Draft a full-time employment offer letter for [Job Title] at [Company Name] with [Salary] compensation." },
      { name: "Part-time offer letter", template: "Draft a part-time employment offer letter for [Job Title] at [Company Name] with [Hourly Rate]." },
      { name: "Contract position offer", template: "Draft a contract position offer letter for [Job Title] at [Company Name] for [Duration]." },
      { name: "Executive offer letter", template: "Draft an executive offer letter for [C-Level/VP Title] at [Company Name] including equity and benefits package." },
    ],
  },
  {
    label: "Consulting Agreement",
    options: [
      { name: "Independent consultant agreement", template: "Draft an independent consulting agreement between [Consultant] and [Client] for [Area of Expertise]." },
      { name: "Retainer agreement", template: "Draft a retainer-based consulting agreement between [Consultant/Firm] and [Client] for ongoing advisory services." },
      { name: "Project-based consulting", template: "Draft a project-based consulting agreement for [Consultant] to deliver [Specific Project] to [Client]." },
      { name: "Advisory board agreement", template: "Draft an advisory board agreement for [Advisor Name] joining [Company Name]'s advisory board." },
    ],
  },
];

// ─── Quick Actions ────────────────────────────────────────────────────────────

const fullQuickActions = [
  {
    id: "upload",
    title: "Upload a document",
    description: "PDF, DOCX, PNG, JPG up to 50MB",
    icon: CloudUploadIcon,
    accent: "bg-primary/10 text-primary",
    highlight: true,
    sub: "or drag & drop anywhere",
  },
  {
    id: "ai",
    title: "Start with AI",
    description: "Describe your document and AI will draft it",
    icon: null as any,
    accent: "bg-white border text-violet-600",
    customIcon: true,
  },
  {
    id: "blank",
    title: "Blank document",
    description: "Start from a clean slate",
    icon: Note01Icon,
    accent: "bg-muted text-muted-foreground",
  },
];

const esignQuickActions = [fullQuickActions[0]];

// ─── Recent Templates ─────────────────────────────────────────────────────────

const recentTemplates: Template[] = [
  libraryTemplates[0],
  userTemplates[0],
  libraryTemplates[1],
  userTemplates[4],
  libraryTemplates[2],
  libraryTemplates[3],
];

const esignRecentTemplates: Template[] = [
  userTemplates[0],
  userTemplates[1],
  userTemplates[2],
  userTemplates[3],
  userTemplates[4],
  userTemplates[5],
  sharedTemplates[0],
];

const allMyTemplates = [...userTemplates, ...sharedTemplates];

// ─── Template filter types ────────────────────────────────────────────────────

type TemplateFilter = "recent" | "created" | "shared" | "library" | string; // string for drive IDs

const TEMPLATE_PAGE_SIZE = 12;
const TEMPLATE_LOAD_DELAY_MS = 2000;

function TemplateCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-0 overflow-hidden">
      <Skeleton className="w-full h-32" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

const CreateDocument = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const [mode, setMode] = useState<CreateDocumentMode>("full");

  // Flow mode from URL params
  const flowMode = searchParams.get("mode") as "correction" | "followup" | null;
  const correctionDocId = searchParams.get("id");
  const followUpParentId = searchParams.get("parentId");
  const followUpChildType = searchParams.get("childType") || "amendment";
  const relatedTo = searchParams.get("relatedTo");
  const isCorrection = flowMode === "correction";
  const isFollowUp = flowMode === "followup";
  const isRelated = !!relatedTo && !flowMode;

  // Mock data for correction/followup locked documents
  const lockedDocs: UploadedDocument[] = useMemo(() => {
    if (isCorrection) {
      return [
        { id: "locked-merged", name: "Original Documents (Merged)", type: "application/pdf", progress: 100, status: "complete", pageCount: 8, documentType: "primary", isLocked: true },
        { id: "locked-schedule", name: "Schedule A — Pricing", type: "application/pdf", progress: 100, status: "complete", pageCount: 2, documentType: "supplement", isLocked: true },
        { id: "locked-insurance", name: "Insurance Certificate", type: "application/pdf", progress: 100, status: "complete", pageCount: 1, documentType: "attachment", isLocked: true },
      ];
    }
    if (isFollowUp) {
      return [
        { id: "locked-parent", name: "Annual Review — Acme Corp", type: "application/pdf", progress: 100, status: "complete", pageCount: 5, documentType: "primary", isLocked: true },
      ];
    }
    return [];
  }, [isCorrection, isFollowUp]);

  const [mobileQueueOpen, setMobileQueueOpen] = useState(false);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [queueManuallyOpened, setQueueManuallyOpened] = useState(false);
  const hasDocuments = documents.length > 0 || lockedDocs.length > 0;
  const showQueue = hasDocuments || queueManuallyOpened;
  const [isDragActive, setIsDragActive] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Template filter state (unified)
  const [activeFilter, setActiveFilter] = useState<TemplateFilter>("recent");
  const [mySearchQuery, setMySearchQuery] = useState("");
  const [myCategory, setMyCategory] = useState("All");
  const [sharedSearchQuery, setSharedSearchQuery] = useState("");
  const [sharedCategory, setSharedCategory] = useState("All");
  const [libSearchQuery, setLibSearchQuery] = useState("");
  const [libCategory, setLibCategory] = useState("All");

  // AI dialog
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiSelectedSuggestion, setAiSelectedSuggestion] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);

  const [esignDropHover, setEsignDropHover] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [wordEditDialog, setWordEditDialog] = useState<{ file: File; doc: UploadedDocument } | null>(null);

  // Drive state
  const [driveConnectOpen, setDriveConnectOpen] = useState(false);
  const [driveConnectMode, setDriveConnectMode] = useState<"connect" | "select">("connect");
  const [connectedProviders, setConnectedProviders] = useState<Record<string, boolean>>({
    google_drive: false,
    dropbox: true,
    onedrive: false,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const templateSectionRef = useRef<HTMLDivElement>(null);
  const templateSentinelRef = useRef<HTMLDivElement>(null);
  const dragCounter = useRef(0);

  // Template infinite scroll state
  const [templateDisplayCount, setTemplateDisplayCount] = useState(TEMPLATE_PAGE_SIZE);
  const [templateLoadingMore, setTemplateLoadingMore] = useState(false);
  const [templateInitialLoading, setTemplateInitialLoading] = useState(false);

  const scrollToTemplateSection = useCallback(() => {
    if (templateSectionRef.current) {
      templateSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const isEsign = mode === "esign";
  const allDocs = [...lockedDocs, ...documents];
  const isEmpty = allDocs.length === 0;
  const allComplete = allDocs.length > 0 && allDocs.every((d) => d.status === "complete");
  const count = allDocs.length;
  const hasPrimary = allDocs.some((d) => d.documentType === "primary");

  const connectedDriveIds = Object.entries(connectedProviders)
    .filter(([, v]) => v)
    .map(([k]) => k);
  const connectedCount = connectedDriveIds.length;

  // ─── File handling ────────────────────────────────────────────────────────

  const addFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const newDocs: UploadedDocument[] = fileArray.map((file) => ({
      id: crypto.randomUUID(),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      progress: 0,
      status: "uploading" as const,
      pageCount: Math.floor(Math.random() * 20) + 1,
      documentType: "primary" as const,
    }));
    setDocuments((prev) => [...prev, ...newDocs]);
    setQueueManuallyOpened(true);

    toast({
      title: `${fileArray.length} file${fileArray.length !== 1 ? "s" : ""} added to queue`,
      variant: "success" as const,
    });

    // Check if any Word files were uploaded
    const wordFile = fileArray.find((f) =>
      f.name.match(/\.(docx?|dot|dotx)$/i) ||
      f.type.includes("word") ||
      f.type.includes("msword")
    );
    if (wordFile) {
      const matchingDoc = newDocs.find((d) => d.name === wordFile.name);
      if (matchingDoc) {
        setWordEditDialog({ file: wordFile, doc: matchingDoc });
      }
    }
  }, []);

  useEffect(() => {
    const uploading = documents.filter((d) => d.status === "uploading" && !d.isTemplate && !d.isAI);
    if (uploading.length === 0) return;

    const intervals: ReturnType<typeof setTimeout>[] = [];
    uploading.forEach((doc, idx) => {
      const timer = setTimeout(() => {
        const interval = setInterval(() => {
          setDocuments((prev) =>
            prev.map((d) => {
              if (d.id !== doc.id) return d;
              const newProgress = d.progress + Math.floor(Math.random() * 11) + 5;
              if (newProgress >= 100) {
                clearInterval(interval);
                return { ...d, progress: 100, status: "complete" as const };
              }
              return { ...d, progress: newProgress };
            }),
          );
        }, 200);
        intervals.push(interval);
      }, idx * 300);
      intervals.push(timer);
    });

    return () => intervals.forEach(clearInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documents.filter((d) => d.status === "uploading" && !d.isTemplate && !d.isAI).length]);

  // ─── Drag & Drop ─────────────────────────────────────────────────────────

  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
    if (e.dataTransfer.types.includes("Files")) setIsDragActive(true);
  };
  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragActive(false);
      setEsignDropHover(false);
    }
  };
  const handleDragOver = (e: DragEvent) => e.preventDefault();
  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragActive(false);
    setEsignDropHover(false);
    if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
  };

  // ─── Quick Actions ────────────────────────────────────────────────────────

  const handleQuickAction = (actionId: string) => {
    if (actionId === "upload") fileInputRef.current?.click();
    if (actionId === "ai") setAiDialogOpen(true);
    if (actionId === "blank") {
      handleStartBlank();
    }
  };

  // ─── Drive ────────────────────────────────────────────────────────────────

  const handleDriveConnect = useCallback((providerId: string) => {
    setConnectedProviders((prev) => ({ ...prev, [providerId]: true }));
    // Switch to the newly connected drive tab
    setActiveFilter(providerId);
    setTimeout(() => {
      templateSectionRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, []);

  const handleDriveImport = useCallback((files: DriveFile[], providerName: string) => {
    const newDocs: UploadedDocument[] = files.map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      type: file.mimeType || "application/octet-stream",
      progress: 0,
      status: "uploading" as const,
      pageCount: Math.floor(Math.random() * 15) + 1,
      documentType: "primary" as const,
      isDriveImport: true,
      driveProvider: providerName,
    }));
    setDocuments((prev) => [...prev, ...newDocs]);
    setQueueManuallyOpened(true);
    toast({
      title: `Importing ${files.length} file${files.length !== 1 ? "s" : ""} from ${providerName}`,
      variant: "success" as const,
    });
  }, []);

  const handleDriveSelect = useCallback((providerId: string) => {
    setActiveFilter(providerId);
    setTimeout(() => {
      templateSectionRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, []);

  // ─── AI ───────────────────────────────────────────────────────────────────

  const [aiExpandedCategory, setAiExpandedCategory] = useState<string | null>(null);

  const handleAISuggestionClick = (suggestion: (typeof AI_SUGGESTIONS)[0]) => {
    setAiExpandedCategory((prev) => (prev === suggestion.label ? null : suggestion.label));
  };

  const handleAIOptionClick = (option: { name: string; template: string }, categoryLabel: string) => {
    setAiSelectedSuggestion(categoryLabel);
    setAiPrompt(option.template);
    setAiExpandedCategory(null);
  };

  const clearAISuggestion = () => {
    setAiSelectedSuggestion(null);
    setAiPrompt("");
  };

  const handleAIGenerate = () => {
    if (!aiPrompt.trim()) return;
    const docType = aiSelectedSuggestion || "Document";
    setAiDialogOpen(false);
    setAiPrompt("");
    setAiSelectedSuggestion(null);
    toast({
      title: "Opening editor with AI draft...",
      variant: "success" as const,
    });
    navigate(`/editor?ai=true&type=${encodeURIComponent(docType)}`);
  };

  const handleStartBlank = () => {
    toast({
      title: "Opening blank editor...",
      variant: "success" as const,
    });
    navigate("/editor");
  };

  // ─── Templates ────────────────────────────────────────────────────────────

  const handleUseTemplate = useCallback((template: Template) => {
    const queued: UploadedDocument = {
      id: crypto.randomUUID(),
      name: template.name,
      type: "template",
      progress: 100,
      status: "complete",
      isTemplate: true,
      isUserTemplate: template.source === "user",
      gradient: template.gradient,
      pageCount: template.pageCount,
      documentType: "primary",
    };
    setDocuments((prev) => [...prev, queued]);
    setQueueManuallyOpened(true);
    toast({
      title: `"${template.name}" added to queue`,
      variant: "success" as const,
    });
  }, []);

  // Filtering logic
  const getFilteredTemplates = () => {
    const matchCategory = (tCat: string | undefined, filterCat: string) => {
      if (filterCat === "All") return true;
      if (filterCat === "Others") return !tCat;
      return tCat === filterCat;
    };
    const matchSearch = (t: Template, query: string) =>
      query === "" ||
      t.name.toLowerCase().includes(query.toLowerCase()) ||
      (t.description || "").toLowerCase().includes(query.toLowerCase());

    if (activeFilter === "recent") {
      const recents = isEsign ? esignRecentTemplates : recentTemplates;
      return recents.filter((t) => matchSearch(t, mySearchQuery));
    }
    if (activeFilter === "created") {
      return userTemplates.filter((t) => matchCategory(t.category, myCategory) && matchSearch(t, mySearchQuery));
    }
    if (activeFilter === "shared") {
      return sharedTemplates.filter((t) => matchCategory(t.category, sharedCategory) && matchSearch(t, sharedSearchQuery));
    }
    if (activeFilter === "library") {
      return libraryTemplates.filter((t) => matchCategory(t.category, libCategory) && matchSearch(t, libSearchQuery));
    }
    return [];
  };

  const isDriveFilter = connectedDriveIds.includes(activeFilter);
  const filteredTemplates = isDriveFilter ? [] : getFilteredTemplates();
  const visibleTemplates = filteredTemplates.slice(0, templateDisplayCount);
  const hasMoreTemplates = templateDisplayCount < filteredTemplates.length;

  // Reset pagination & trigger initial loading on filter/search/category change
  useEffect(() => {
    setTemplateDisplayCount(TEMPLATE_PAGE_SIZE);
    setTemplateLoadingMore(false);
    if (!isDriveFilter) {
      setTemplateInitialLoading(true);
      const timer = setTimeout(() => setTemplateInitialLoading(false), TEMPLATE_LOAD_DELAY_MS);
      return () => clearTimeout(timer);
    }
  }, [activeFilter, mySearchQuery, sharedSearchQuery, libSearchQuery, myCategory, sharedCategory, libCategory, isDriveFilter]);

  // Infinite scroll observer for templates
  useEffect(() => {
    if (!templateSentinelRef.current || !hasMoreTemplates || templateLoadingMore || templateInitialLoading || isDriveFilter) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !templateLoadingMore) {
          setTemplateLoadingMore(true);
          setTimeout(() => {
            setTemplateDisplayCount((prev) => prev + TEMPLATE_PAGE_SIZE);
            setTemplateLoadingMore(false);
          }, TEMPLATE_LOAD_DELAY_MS);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(templateSentinelRef.current);
    return () => observer.disconnect();
  }, [hasMoreTemplates, templateLoadingMore, templateInitialLoading, isDriveFilter, templateDisplayCount]);

  const currentSearch =
    activeFilter === "recent" ? mySearchQuery : activeFilter === "created" ? mySearchQuery : activeFilter === "shared" ? sharedSearchQuery : libSearchQuery;
  const setCurrentSearch =
    activeFilter === "recent"
      ? setMySearchQuery
      : activeFilter === "created"
        ? setMySearchQuery
        : activeFilter === "shared"
          ? setSharedSearchQuery
          : setLibSearchQuery;
  const currentCategory =
    activeFilter === "created" ? myCategory : activeFilter === "shared" ? sharedCategory : libCategory;
  const setCurrentCategory =
    activeFilter === "created" ? setMyCategory : activeFilter === "shared" ? setSharedCategory : setLibCategory;
  const currentCategories = activeFilter === "library" ? libraryCategories : myTemplateCategories;
  const currentQuickCategories = activeFilter === "library" ? quickFilterCategories : myTemplateCategories.slice(0, 4);
  const showCategoryFilter = activeFilter !== "recent";

  const openPreview = (t: Template) => {
    setPreviewTemplate(t);
    setPreviewOpen(true);
  };

  const actions = isEsign ? esignQuickActions : fullQuickActions;

  // Build filter tabs
  const driveLogoMap: Record<string, React.ReactNode> = {
    google_drive: <GoogleDriveLogo size={16} />,
    dropbox: <DropboxLogo size={16} />,
    onedrive: <OneDriveLogo size={16} />,
  };

  const baseFilters: { id: TemplateFilter; label: string; icon?: React.ReactNode; isNew?: boolean }[] = isEsign
    ? [
        { id: "recent", label: "Recent Templates" },
        { id: "created", label: "My Templates" },
        { id: "shared", label: "Shared Templates" },
      ]
    : [
        { id: "recent", label: "Recent Templates" },
        { id: "created", label: "My Templates" },
        { id: "shared", label: "Shared Templates" },
        { id: "library", label: "Library", icon: <img src={signitLogo} alt="Signit" className="h-3.5" />, isNew: true },
      ];

  const driveFilters = connectedDriveIds.map((id) => {
    const provider = DRIVE_PROVIDERS.find((p) => p.id === id);
    return { id, label: provider?.name || id, icon: driveLogoMap[id], isNew: false };
  });

  const allFilters = [...baseFilters, ...driveFilters];

  // Unconnected drive providers for the "More" menu
  const unconnectedProviders = DRIVE_PROVIDERS.filter((p) => !connectedProviders[p.id]);
  const hasUnconnected = unconnectedProviders.length > 0;

  const handleConnectFromMore = (providerId: string) => {
    setMoreOpen(false);
    setDriveConnectMode("connect");
    setDriveConnectOpen(true);
    // After connection, the handleDriveConnect callback handles the rest
    // We store which provider to auto-connect
    setTimeout(() => {
      handleDriveConnect(providerId);
    }, 1500);
  };

  return (
    <div
      className="h-screen flex flex-col"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* ─── Correction/Follow-up Banners ────────────────────────────── */}
      {isCorrection && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-300 dark:border-amber-800 px-4 py-2 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-sm font-medium text-amber-800 dark:text-amber-300">
            <AlertTriangle size={16} />
            Correcting: Office Lease Renewal. Signers are paused until you save or discard.
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" className="h-7 text-xs" onClick={() => { sonnerToast.success("Corrections saved — signing resumed"); navigate("/"); }}>Save &amp; resume signing</Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { sonnerToast("Changes discarded"); navigate("/"); }}>Discard changes</Button>
          </div>
        </div>
      )}
      {isFollowUp && (
        <div className="bg-blue-50 dark:bg-blue-950/30 border-b border-blue-300 dark:border-blue-800 px-4 py-2 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-sm font-medium text-blue-800 dark:text-blue-300">
            <LinkIcon size={16} />
            Follow-up to: Annual Review — Acme Corp
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { sonnerToast("Follow-up cancelled"); navigate("/"); }}>Cancel follow-up</Button>
          </div>
        </div>
      )}
      {isRelated && (
        <div className="bg-muted/50 border-b px-4 py-2 flex items-center gap-2 text-xs text-muted-foreground shrink-0">
          <LinkIcon size={12} />
          Related to: Annual Review — Acme Corp
          <button className="ml-auto text-muted-foreground/60 hover:text-muted-foreground" onClick={() => navigate("/create")}>✕</button>
        </div>
      )}

      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <header className="border-b bg-background flex-shrink-0">
        <div className="relative h-auto min-h-[3.5rem] md:h-16 flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 md:px-6 py-2 sm:py-0 gap-2 sm:gap-0">
          <div className="flex items-center gap-2 md:gap-4 w-full sm:w-auto">
            <button
              onClick={() => navigate("/")}
              className="rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <X className="h-4 w-4" />
            </button>
            <nav className="flex items-center gap-1.5 text-sm">
              <span className="font-medium text-sm">{isCorrection ? "Correct document" : isFollowUp ? "Follow-up document" : "New document"}</span>
            </nav>
          </div>

          {/* Step indicator */}
          <div className="hidden sm:flex items-center gap-3 absolute left-1/2 -translate-x-1/2">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">1</div>
              <span className="text-xs font-medium text-foreground">{isCorrection ? "Documents" : "Add Documents"}</span>
            </div>
            <div className="w-6 h-px bg-border" />
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full border-2 border-muted-foreground/30 text-muted-foreground/50 flex items-center justify-center text-xs font-semibold">2</div>
              <span className="text-xs text-muted-foreground/50">{isCorrection ? "Participants" : isFollowUp ? "Participants" : "Add Participants"}</span>
            </div>
            <div className="w-6 h-px bg-border" />
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full border-2 border-muted-foreground/30 text-muted-foreground/50 flex items-center justify-center text-xs font-semibold">3</div>
              <span className="text-xs text-muted-foreground/50">{isCorrection ? "Review & Save" : "Prepare & Send"}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {hasDocuments && isMobile && (
              <Button variant="outline" size="sm" onClick={() => setMobileQueueOpen(true)} className="mr-auto sm:mr-0">
                <HugeiconsIcon icon={Files01Icon} size={16} className="mr-1.5" />
                Queue ({count})
              </Button>
            )}
            {isEsign ? (
              <Button
                variant="default"
                size="sm"
                disabled={isEmpty || !allComplete || !hasPrimary}
                className={isEmpty || !allComplete || !hasPrimary ? "opacity-50" : ""}
                onClick={() => navigate("/participants", { state: { documents, mode } })}
              >
                <span className="hidden sm:inline">Next: Add Participants</span>
                <span className="sm:hidden">Next</span>
                <HugeiconsIcon icon={ArrowRight01Icon} size={16} className="ml-1" />
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                disabled={isEmpty || !allComplete || !hasPrimary}
                className={isEmpty || !allComplete || !hasPrimary ? "opacity-50" : ""}
                onClick={() => navigate("/participants", { state: { documents, mode } })}
              >
                <span className="hidden sm:inline">Next: Add Participants</span>
                <span className="sm:hidden">Next</span>
                <HugeiconsIcon icon={ArrowRight01Icon} size={16} className="ml-1" />
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        <main className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-thin">
          <div className={`mx-auto transition-all ${showQueue && !isMobile ? "max-w-4xl" : "max-w-5xl"}`}>
            {/* ─── Title & Subtitle ──────────────────────────────────── */}
            <section className="mb-6">
              <h1 className="text-2xl font-bold tracking-tight">Start your document</h1>
              <p className="text-sm text-muted-foreground mt-1">Upload, use a template, or create with AI.</p>
            </section>

            {/* ─── Quick Actions ──────────────────────────────────────────── */}
            <section>
              <div
                className={`grid gap-3 md:gap-4 ${
                  isEsign ? "grid-cols-1 max-w-3xl mx-auto" : "grid-cols-2 sm:grid-cols-2 lg:grid-cols-4"
                }`}
              >
                {actions.map((action) =>
                  action.id === "upload" ? (
                    <div
                      key={action.id}
                      className={`cursor-pointer transition-all relative group rounded-xl border-2 border-dashed border-primary/30 hover:border-primary/60 bg-primary/[0.03] hover:bg-primary/[0.06] p-6 flex flex-col ${
                        isEsign ? "items-center justify-center text-center" : "lg:col-span-2 items-start justify-center text-left"
                      }`}
                      onClick={() => handleQuickAction(action.id)}
                    >
                      <div className="rounded-full p-3.5 bg-primary/10 mb-3 group-hover:scale-110 transition-transform">
                        <HugeiconsIcon icon={CloudUploadIcon} size={24} className="text-primary" />
                      </div>
                      <h3 className="font-semibold text-sm">{action.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{action.description}</p>
                      <p className="text-xs text-muted-foreground/60 mt-1.5">or drag & drop anywhere</p>
                    </div>
                  ) : action.id === "blank" ? (
                    <Card
                      key={action.id}
                      className="p-5 cursor-pointer transition-all relative group hover:shadow-[0_0_20px_-4px_hsl(var(--muted-foreground)/0.15)]"
                      onClick={() => handleQuickAction(action.id)}
                    >
                      <div className="rounded-full p-3 w-fit bg-muted border">
                        <HugeiconsIcon icon={Note01Icon} size={20} className="text-muted-foreground" />
                      </div>
                      <h3 className="font-semibold text-sm mt-3">{action.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{action.description}</p>
                    </Card>
                  ) : (
                    <Card
                      key={action.id}
                      className={`p-5 cursor-pointer transition-all relative group ${
                        action.id === "ai"
                          ? "hover:shadow-[0_0_20px_-4px_hsl(var(--brand-indigo)/0.25)]"
                          : "hover:shadow-md"
                      }`}
                      onClick={() => handleQuickAction(action.id)}
                    >
                      <div className={`rounded-full p-3 w-fit ${action.accent}`}>
                        {(action as any).customIcon ? (
                          <AiIcon
                            size={20}
                            className="transition-transform duration-500 ease-in-out group-hover:rotate-[360deg]"
                          />
                        ) : (
                          <HugeiconsIcon icon={action.icon} size={20} />
                        )}
                      </div>
                      <h3 className="font-semibold text-sm mt-3">{action.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{action.description}</p>
                      {action.sub && <p className="text-xs text-muted-foreground/70 mt-1">{action.sub}</p>}
                    </Card>
                  )
                )}
              </div>
            </section>

            {/* ─── Unified Template Section ─────────────────────────────── */}
            <section className="mt-10 min-h-[calc(100vh-4rem)]" ref={templateSectionRef}>
              <h3 className="text-lg font-semibold">Browse for more</h3>

              {/* Filter row */}
              <div className="mt-4 flex items-center gap-6 border-b overflow-x-auto scrollbar-none">
                {allFilters.map((filter) => (
                  <button
                    key={filter.id}
                    className={`relative pb-2 text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                      activeFilter === filter.id
                        ? "text-foreground border-b-2 border-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => {
                      setActiveFilter(filter.id);
                      setTimeout(scrollToTemplateSection, 50);
                    }}
                  >
                    {filter.icon && filter.icon}
                    {filter.label}
                    {filter.isNew && (
                      <span className="absolute -top-1 -right-2.5 text-amber-500">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6z"/>
                        </svg>
                      </span>
                    )}
                  </button>
                ))}

                {/* More dropdown for unconnected drives */}
                {hasUnconnected && (
                  <Popover open={moreOpen} onOpenChange={setMoreOpen}>
                    <PopoverTrigger asChild>
                      <button
                        className={`relative pb-2 text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
                          moreOpen
                            ? "text-foreground border-b-2 border-primary"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        More
                        <HugeiconsIcon icon={ArrowDown01Icon} size={14} className={`transition-transform ${moreOpen ? "rotate-180" : ""}`} />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-56 p-1.5">
                      <div className="space-y-0.5">
                        {unconnectedProviders.map((provider) => (
                          <button
                            key={provider.id}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm hover:bg-muted transition-colors text-left"
                            onClick={() => handleConnectFromMore(provider.id)}
                          >
                            <span className="flex-shrink-0">{driveLogoMap[provider.id]}</span>
                            <span>Connect {provider.name}</span>
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>

              {/* Drive browser content */}
              {isDriveFilter && (
                <div className="mt-4">
                  <DriveBrowserView key={activeFilter} providerId={activeFilter} onImportFiles={handleDriveImport} onNavigate={() => setTimeout(scrollToTemplateSection, 50)} />
                </div>
              )}

              {/* Template content */}
              {!isDriveFilter && (
                <>
                  <div className="relative max-w-md mt-4">
                    <HugeiconsIcon
                      icon={Search01Icon}
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />

                    <Input
                      placeholder={`Search ${activeFilter === "library" ? "template library" : activeFilter === "shared" ? "shared templates" : "my templates"}...`}
                      className="pl-10"
                      value={currentSearch}
                      onChange={(e) => {
                        setCurrentSearch(e.target.value);
                        setTimeout(scrollToTemplateSection, 50);
                      }}
                    />
                  </div>
                  {showCategoryFilter && (
                    <div className="mt-3">
                      <CategoryFilter
                        categories={currentCategories}
                        quickCategories={currentQuickCategories}
                        value={currentCategory}
                        onChange={(val) => {
                          setCurrentCategory(val);
                          setTimeout(scrollToTemplateSection, 50);
                        }}
                      />
                    </div>
                  )}

                  {/* Initial loading state */}
                  {templateInitialLoading && (
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {Array.from({ length: TEMPLATE_PAGE_SIZE }).map((_, i) => (
                        <TemplateCardSkeleton key={i} />
                      ))}
                    </div>
                  )}

                  {/* Loaded templates */}
                  {!templateInitialLoading && filteredTemplates.length > 0 && (
                    <>
                      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {visibleTemplates.map((template) => (
                          <TemplateCard
                            key={template.id}
                            template={template}
                            tall
                            onPreview={openPreview}
                            onUse={handleUseTemplate}
                          />
                        ))}
                        {/* Loading more skeletons */}
                        {templateLoadingMore && Array.from({ length: 3 }).map((_, i) => (
                          <TemplateCardSkeleton key={`skel-${i}`} />
                        ))}
                      </div>

                      {/* Infinite scroll sentinel */}
                      {hasMoreTemplates && !templateLoadingMore && (
                        <div ref={templateSentinelRef} className="h-1" />
                      )}

                      {/* Items count footer */}
                      {filteredTemplates.length > TEMPLATE_PAGE_SIZE && (
                        <div className="mt-4 text-center">
                          <span className="text-xs text-muted-foreground">
                            Showing {visibleTemplates.length} of {filteredTemplates.length} templates
                            {templateLoadingMore && " · Loading more..."}
                          </span>
                        </div>
                      )}
                    </>
                  )}

                  {/* Empty state */}
                  {!templateInitialLoading && filteredTemplates.length === 0 && (
                    <div className="mt-16 flex flex-col items-center text-center">
                      <HugeiconsIcon icon={File01Icon} size={48} className="text-muted-foreground/30" />
                      <p className="text-sm font-medium text-muted-foreground mt-4">No templates found</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {activeFilter === "created"
                          ? "Save a document as a template to reuse it later"
                          : activeFilter === "shared"
                            ? "No templates have been shared with you yet"
                            : "Try a different search or category"}
                      </p>
                    </div>
                  )}
                </>
              )}
            </section>

            {/* ─── eSign Drop Zone ─────────────────────────────────────── */}
          </div>
        </main>

        {/* ─── Desktop Queue Panel ───────────────────────────────────── */}
        {!isMobile && (
          <AnimatePresence>
            {showQueue && (
              <motion.div
                initial={{ x: 190 }}
                animate={{ x: 0 }}
                exit={{ x: 190 }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
              >
                <DocumentQueuePanel
                  documents={documents}
                  setDocuments={setDocuments}
                  onAddFiles={() => fileInputRef.current?.click()}
                  mode={mode}
                  onEditDocuments={count > 0 ? () => navigate("/editor") : undefined}
                />
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Mobile queue drawer */}
        {isMobile && (
          <Drawer open={mobileQueueOpen} onOpenChange={setMobileQueueOpen}>
            <DrawerContent className="max-h-[85vh]">
              <DocumentQueuePanel
                documents={documents}
                setDocuments={setDocuments}
                onAddFiles={() => fileInputRef.current?.click()}
                mode={mode}
                isMobile
                onEditDocuments={count > 0 ? () => navigate("/editor") : undefined}
              />
            </DrawerContent>
          </Drawer>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.docx,.doc,.png,.jpg,.jpeg"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) addFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <AnimatePresence>{isDragActive && <DragDropOverlay />}</AnimatePresence>

      <TemplatePreviewDialog
        template={previewTemplate}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        onUse={handleUseTemplate}
      />

      {/* ─── AI Dialog ───────────────────────────────────────────────── */}
      <Dialog
        open={aiDialogOpen}
        onOpenChange={(o) => {
          if (!aiGenerating) {
            setAiDialogOpen(o);
            if (!o) {
              setAiPrompt("");
              setAiSelectedSuggestion(null);
              setAiExpandedCategory(null);
            }
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AiIcon size={16} />
              Describe your document
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Textarea
                placeholder="e.g. Draft a non-disclosure agreement between two companies for a software development partnership..."
                className="min-h-[120px] resize-none"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                disabled={aiGenerating}
              />
            </div>

            <div className="relative overflow-hidden">
              {/* Prompt chips */}
              <motion.div
                animate={{
                  opacity: aiExpandedCategory ? 0 : 1,
                  x: aiExpandedCategory ? -20 : 0,
                  position: aiExpandedCategory ? "absolute" as const : "relative" as const,
                }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="flex flex-wrap gap-2 w-full"
                style={{ pointerEvents: aiExpandedCategory ? "none" : "auto" }}
              >
                {AI_SUGGESTIONS.map((s) => (
                  <Button
                    key={s.label}
                    variant={aiSelectedSuggestion === s.label ? "default" : "outline"}
                    size="sm"
                    className="rounded-full text-xs h-7"
                    onClick={() => handleAISuggestionClick(s)}
                    disabled={aiGenerating}
                  >
                    {s.label}
                  </Button>
                ))}
              </motion.div>

              {/* Expanded options list */}
              <motion.div
                animate={{
                  opacity: aiExpandedCategory ? 1 : 0,
                  x: aiExpandedCategory ? 0 : 20,
                }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                style={{ pointerEvents: aiExpandedCategory ? "auto" : "none", display: aiExpandedCategory ? "block" : "none" }}
              >
                <button
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
                  onClick={() => setAiExpandedCategory(null)}
                >
                  <HugeiconsIcon icon={ArrowRight01Icon} size={12} className="rotate-180" />
                  <span>{aiExpandedCategory}</span>
                </button>
                <div className="grid grid-cols-1 gap-0.5">
                  {aiExpandedCategory && AI_SUGGESTIONS.find((s) => s.label === aiExpandedCategory)?.options.map((opt) => (
                    <button
                      key={opt.name}
                      className="text-left text-sm px-3 py-2.5 rounded-md hover:bg-accent transition-colors text-foreground"
                      onClick={() => handleAIOptionClick(opt, aiExpandedCategory)}
                    >
                      {opt.name}
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAiDialogOpen(false);
                setAiPrompt("");
                setAiSelectedSuggestion(null);
                setAiExpandedCategory(null);
              }}
              disabled={aiGenerating}
            >
              Cancel
            </Button>
            <Button onClick={handleAIGenerate} disabled={!aiPrompt.trim() || aiGenerating}>
              <AiIcon size={16} className="mr-1.5" />
              Generate document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Drive Connect Dialog ────────────────────────────────────── */}
      <DriveConnectDialog
        open={driveConnectOpen}
        onOpenChange={setDriveConnectOpen}
        connectedProviders={connectedProviders}
        onConnect={handleDriveConnect}
        mode={driveConnectMode}
        onSelectDrive={handleDriveSelect}
      />

      {/* ─── Word File Edit Dialog ───────────────────────────────────── */}
      <Dialog open={!!wordEditDialog} onOpenChange={(open) => !open && setWordEditDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold pr-4 leading-snug">
              Want to edit your {wordEditDialog?.file.name} file?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <p className="text-sm text-muted-foreground">
              Some formatting may change when uploading word files. Please review before sending.
            </p>
            <p className="text-sm font-medium">Are you sure you want to edit text?</p>
          </div>
          <DialogFooter className="flex-row gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setWordEditDialog(null)}
              className="flex-1 sm:flex-none"
            >
              Skip
            </Button>
            <Button
              onClick={() => {
                setWordEditDialog(null);
                toast({ title: "Document is now editable", variant: "success" as const });
              }}
              className="flex-1 sm:flex-none bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 text-primary-foreground"
            >
              Make it editable
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreateDocument;
