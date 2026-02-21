import { useState, useRef, useCallback, useEffect, DragEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CloudUploadIcon,
  CloudIcon,
  DashboardSquare01Icon,
  Files01Icon,
  ArrowRight01Icon,
  Search01Icon,
  ArrowRight02Icon,
  Folder01Icon,
  File01Icon,
  FileAddIcon,
  SparklesIcon,

  Loading03Icon,
  Edit02Icon,
  FileValidationIcon,
  SentIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { UploadedDocument, DriveFile } from "@/types/document";
import TemplateCard from "@/components/TemplateCard";
import TemplatePreviewDialog from "@/components/TemplatePreviewDialog";
import DocumentQueuePanel from "@/components/DocumentQueuePanel";
import type { CreateDocumentMode } from "@/components/DocumentQueuePanel";
import DragDropOverlay from "@/components/DragDropOverlay";
import CategoryFilter from "@/components/CategoryFilter";
import DriveImportDialog from "@/components/DriveImportDialog";
import AiIcon from "@/components/AiIcon";
import signitLogo from "@/assets/signit-logo.png";

const AI_SUGGESTIONS = [
  "Sales proposal for SaaS product",
  "Mutual NDA for partnership",
  "Freelance service contract",
];

function deriveAIDocName(prompt: string): string {
  const lower = prompt.toLowerCase();
  if (lower.includes("nda") || lower.includes("non-disclosure")) return "AI: Non-Disclosure Agreement";
  if (lower.includes("proposal")) return "AI: Sales Proposal";
  if (lower.includes("contract") || lower.includes("service")) return "AI: Service Contract";
  if (lower.includes("invoice")) return "AI: Invoice";
  if (lower.includes("partnership")) return "AI: Partnership Agreement";
  return "AI: Generated Document";
}

const fullQuickActions = [
  {
    id: "upload",
    title: "Upload Document",
    description: "PDF, DOCX, PNG, JPG up to 50MB",
    icon: CloudUploadIcon,
    accent: "bg-primary/10 text-primary",
    highlight: true,
    sub: "or drag & drop anywhere",
  },
  {
    id: "blank",
    title: "Start from Blank",
    description: "Open empty document editor",
    icon: FileAddIcon,
    accent: "bg-slate-500/10 text-slate-600",
  },
  {
    id: "ai",
    title: "Start with AI",
    description: "Describe your document and AI will draft it",
    icon: null as any,
    accent: "bg-gradient-to-br from-violet-500/10 to-blue-500/10 text-violet-600",
    customIcon: true,
  },
  {
    id: "drive",
    title: "Import from Drive",
    description: "Google Drive, OneDrive, Dropbox",
    icon: CloudIcon,
    accent: "bg-orange-500/10 text-orange-600",
  },
  {
    id: "library",
    title: "Signit Library",
    description: "Professional templates by Signit",
    icon: DashboardSquare01Icon,
    accent: "bg-brand-indigo/10 text-brand-indigo",
  },
];

const esignQuickActions = [
  fullQuickActions[0],
  fullQuickActions[3],
];

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

const CreateDocument = () => {
  const [mode, setMode] = useState<CreateDocumentMode>("full");
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("my-templates");

  const [mySearchQuery, setMySearchQuery] = useState("");
  const [myCategory, setMyCategory] = useState("All");
  const [mySubFilter, setMySubFilter] = useState("all");

  const [libSearchQuery, setLibSearchQuery] = useState("");
  const [libCategory, setLibCategory] = useState("All");

  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiDocType, setAiDocType] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);

  const [esignDropHover, setEsignDropHover] = useState(false);

  // Drive import state
  const [driveDialogOpen, setDriveDialogOpen] = useState(false);
  const [connectedProviders, setConnectedProviders] = useState<Record<string, boolean>>({
    google_drive: false,
    dropbox: true,
    onedrive: false,
  });
  const hasAnyConnected = Object.values(connectedProviders).some(Boolean);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const templateSectionRef = useRef<HTMLDivElement>(null);
  const dragCounter = useRef(0);

  const isEsign = mode === "esign";
  const isEmpty = documents.length === 0;
  const allComplete = documents.length > 0 && documents.every((d) => d.status === "complete");
  const count = documents.length;
  const editLabel = count === 0 ? "Edit" : count === 1 ? "Edit Document" : `Edit ${count} Documents`;

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
    }));
    setDocuments((prev) => [...prev, ...newDocs]);
    setIsPanelOpen(true);
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
            })
          );
        }, 200);
        intervals.push(interval);
      }, idx * 300);
      intervals.push(timer);
    });

    return () => intervals.forEach(clearInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documents.filter((d) => d.status === "uploading" && !d.isTemplate && !d.isAI).length]);

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

  const handleQuickAction = (actionId: string) => {
    if (actionId === "upload") fileInputRef.current?.click();
    if (actionId === "blank") {
      toast({ title: "Opening blank editor...", description: "Redirecting to the document editor." });
    }
    if (actionId === "ai") setAiDialogOpen(true);
    if (actionId === "drive") setDriveDialogOpen(true);
    if (actionId === "library") {
      templateSectionRef.current?.scrollIntoView({ behavior: "smooth" });
      setActiveTab("library");
    }
  };

  // Drive import handler
  const handleDriveImport = useCallback((files: DriveFile[], providerName: string) => {
    const getMimeType = (mimeType?: string) => {
      if (!mimeType) return "application/octet-stream";
      return mimeType;
    };

    const newDocs: UploadedDocument[] = files.map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      type: getMimeType(file.mimeType),
      progress: 0,
      status: "uploading" as const,
      pageCount: Math.floor(Math.random() * 15) + 1,
      isDriveImport: true,
      driveProvider: providerName,
    }));

    setDocuments((prev) => [...prev, ...newDocs]);
    setIsPanelOpen(true);

    toast({
      title: `Importing from ${providerName}`,
      description: `${files.length} file${files.length !== 1 ? "s" : ""} are being imported.`,
    });
  }, []);

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setAiGenerating(true);
    await new Promise((r) => setTimeout(r, 2000));

    const docName = deriveAIDocName(aiPrompt);
    const aiDoc: UploadedDocument = {
      id: crypto.randomUUID(),
      name: docName,
      type: "application/ai",
      progress: 100,
      status: "complete",
      isAI: true,
    };
    setDocuments((prev) => [...prev, aiDoc]);
    setIsPanelOpen(true);

    toast({
      title: "AI document created",
      description: `"${docName}" has been added to your queue.`,
    });

    setAiGenerating(false);
    setAiDialogOpen(false);
    setAiPrompt("");
  };

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
    };
    setDocuments((prev) => [...prev, queued]);
    setIsPanelOpen(true);
    toast({
      title: "Template added to queue",
      description: `"${template.name}" is ready in your document queue.`,
    });
  }, []);

  const myTemplateSource =
    mySubFilter === "created" ? userTemplates
    : mySubFilter === "shared" ? sharedTemplates
    : allMyTemplates;

  const filteredMyTemplates = myTemplateSource.filter((t) => {
    const matchCat = myCategory === "All" || t.category === myCategory;
    const matchSearch =
      mySearchQuery === "" ||
      t.name.toLowerCase().includes(mySearchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(mySearchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const filteredLibTemplates = libraryTemplates.filter((t) => {
    const matchCat = libCategory === "All" || t.category === libCategory;
    const matchSearch =
      libSearchQuery === "" ||
      t.name.toLowerCase().includes(libSearchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(libSearchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const openPreview = (t: Template) => {
    setPreviewTemplate(t);
    setPreviewOpen(true);
  };

  const actions = isEsign ? esignQuickActions : fullQuickActions;

  return (
    <div
      className="h-screen flex flex-col"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <header className="h-16 border-b bg-background flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-4">
          <nav className="flex items-center gap-1.5 text-sm">
            <span className="text-muted-foreground">Documents</span>
            <HugeiconsIcon icon={ArrowRight02Icon} size={14} className="text-muted-foreground" />
            <span className="font-medium">{isEsign ? "Send for Signature" : "Create New"}</span>
          </nav>

          <div className="flex items-center gap-2 ml-4 border rounded-full px-3 py-1 bg-muted/50">
            <Label htmlFor="mode-toggle" className="text-[10px] text-muted-foreground font-mono cursor-pointer">eSign Mode</Label>
            <Switch
              id="mode-toggle"
              checked={isEsign}
              onCheckedChange={(checked) => setMode(checked ? "esign" : "full")}
              className="scale-75"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isEsign ? (
            <Button
              variant="default"
              size="sm"
              disabled={isEmpty || !allComplete}
              className={isEmpty || !allComplete ? "opacity-50" : ""}
            >
              <HugeiconsIcon icon={SentIcon} size={16} className="mr-1.5" />
              Send for Signature
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                disabled={isEmpty || !allComplete}
                className={isEmpty || !allComplete ? "opacity-50" : ""}
              >
                <HugeiconsIcon icon={FileValidationIcon} size={16} className="mr-1.5" />
                Get Signature
              </Button>
              <Button
                variant="default"
                size="sm"
                disabled={isEmpty || !allComplete}
                className={isEmpty || !allComplete ? "opacity-50" : ""}
              >
                <HugeiconsIcon icon={Edit02Icon} size={16} className="mr-1.5" />
                {editLabel}
              </Button>
            </>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsPanelOpen(!isPanelOpen)}
            className="relative"
          >
            <HugeiconsIcon icon={Files01Icon} size={16} className="mr-1.5" />
            Document Queue
            {count > 0 && (
              <Badge className="rounded-full h-5 min-w-[20px] flex items-center justify-center text-xs ml-2">
                {count}
              </Badge>
            )}
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-8 scrollbar-thin">
          <div className={`mx-auto transition-all ${isPanelOpen ? "max-w-4xl" : "max-w-5xl"}`}>

            <section>
              <div className={`grid gap-4 ${
                isEsign
                  ? "grid-cols-2 max-w-lg mx-auto"
                  : "grid-cols-2 md:grid-cols-3 lg:grid-cols-5"
              }`}>
                {actions.map((action) => (
                  <Card
                    key={action.id}
                    className={`p-5 cursor-pointer transition-all relative ${
                      action.highlight ? "ring-1 ring-primary/20 hover:shadow-md" :
                      action.id === "library" ? "ring-1 ring-brand-indigo/20 hover:ring-brand-indigo/40 hover:shadow-[0_0_20px_-4px_hsl(var(--brand-indigo)/0.3)]" :
                      "hover:shadow-md"
                    }`}
                    onClick={() => handleQuickAction(action.id)}
                  >
                    {action.id === "drive" && hasAnyConnected && (
                      <div className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-emerald-500" />
                    )}
                    {action.id === "library" ? (
                      <div className="rounded-full p-2.5 w-fit bg-brand-indigo/10">
                        <img src={signitLogo} alt="Signit" className="h-5 w-auto" />
                      </div>
                    ) : (
                      <div className={`rounded-full p-3 w-fit ${action.accent}`}>
                        {(action as any).customIcon ? (
                          <AiIcon size={20} />
                        ) : (
                          <HugeiconsIcon icon={action.icon} size={20} />
                        )}
                      </div>
                    )}
                    <h3 className="font-semibold text-sm mt-3">{action.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{action.description}</p>
                    {action.sub && (
                      <p className="text-xs text-muted-foreground/70 mt-1">{action.sub}</p>
                    )}
                  </Card>
                ))}
              </div>
            </section>

            <section className="mt-10">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Recent Templates</h3>
                <Button
                  variant="link"
                  className="text-sm"
                  onClick={() =>
                    templateSectionRef.current?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  View All <HugeiconsIcon icon={ArrowRight01Icon} size={14} className="ml-1" />
                </Button>
              </div>
              <ScrollArea className="mt-4 w-full">
                <div className="flex gap-4 pb-4">
                  {(isEsign
                    ? esignRecentTemplates
                    : recentTemplates
                  ).map((template) => (
                    <div key={template.id} className="w-[220px] flex-shrink-0">
                      <TemplateCard
                        template={template}
                        showSourceBadge={!isEsign}
                        onPreview={openPreview}
                        onUse={handleUseTemplate}
                      />
                    </div>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </section>

            <section className="mt-10" ref={templateSectionRef}>
              {isEsign ? (
                <>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <HugeiconsIcon icon={Folder01Icon} size={20} />
                    My Templates
                    <span className="text-muted-foreground font-normal text-sm">({allMyTemplates.length})</span>
                  </h3>

                  <div className="mt-4 mb-4">
                    <ToggleGroup
                      type="single"
                      value={mySubFilter}
                      onValueChange={(v) => v && setMySubFilter(v)}
                      className="justify-start gap-0"
                    >
                      <ToggleGroupItem value="all" className="text-xs px-3 py-1 h-7 rounded-none border-b-2 border-transparent data-[state=on]:border-primary data-[state=on]:bg-transparent">
                        All
                      </ToggleGroupItem>
                      <ToggleGroupItem value="created" className="text-xs px-3 py-1 h-7 rounded-none border-b-2 border-transparent data-[state=on]:border-primary data-[state=on]:bg-transparent">
                        Created by Me
                      </ToggleGroupItem>
                      <ToggleGroupItem value="shared" className="text-xs px-3 py-1 h-7 rounded-none border-b-2 border-transparent data-[state=on]:border-primary data-[state=on]:bg-transparent">
                        Shared with Me ({sharedTemplates.length})
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>

                  <div className="relative max-w-md">
                    <HugeiconsIcon icon={Search01Icon} size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search my templates..."
                      className="pl-10"
                      value={mySearchQuery}
                      onChange={(e) => setMySearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="mt-3">
                    <CategoryFilter
                      categories={myTemplateCategories}
                      quickCategories={myTemplateCategories.slice(0, 4)}
                      value={myCategory}
                      onChange={setMyCategory}
                    />
                  </div>

                  {filteredMyTemplates.length > 0 ? (
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredMyTemplates.map((template) => (
                        <TemplateCard
                          key={template.id}
                          template={template}
                          tall
                          onPreview={openPreview}
                          onUse={handleUseTemplate}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="mt-16 flex flex-col items-center text-center">
                      <HugeiconsIcon icon={File01Icon} size={48} className="text-muted-foreground/30" />
                      <p className="text-sm font-medium text-muted-foreground mt-4">
                        No templates found
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Save a document as a template to reuse it later
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="bg-transparent border-b w-full justify-start rounded-none h-auto p-0 gap-0">
                    <TabsTrigger
                      value="my-templates"
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-sm"
                    >
                      <HugeiconsIcon icon={Folder01Icon} size={16} />
                      My Templates
                      <span className="text-muted-foreground">({allMyTemplates.length})</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="library"
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-sm"
                    >
                      <HugeiconsIcon icon={DashboardSquare01Icon} size={16} />
                      Template Library
                      <HugeiconsIcon icon={SparklesIcon} size={12} className="text-amber-500" />
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="my-templates" className="mt-4">
                    <div className="mb-4">
                      <ToggleGroup
                        type="single"
                        value={mySubFilter}
                        onValueChange={(v) => v && setMySubFilter(v)}
                        className="justify-start gap-0"
                      >
                        <ToggleGroupItem value="all" className="text-xs px-3 py-1 h-7 rounded-none border-b-2 border-transparent data-[state=on]:border-primary data-[state=on]:bg-transparent">
                          All
                        </ToggleGroupItem>
                        <ToggleGroupItem value="created" className="text-xs px-3 py-1 h-7 rounded-none border-b-2 border-transparent data-[state=on]:border-primary data-[state=on]:bg-transparent">
                          Created by Me
                        </ToggleGroupItem>
                        <ToggleGroupItem value="shared" className="text-xs px-3 py-1 h-7 rounded-none border-b-2 border-transparent data-[state=on]:border-primary data-[state=on]:bg-transparent">
                          Shared with Me ({sharedTemplates.length})
                        </ToggleGroupItem>
                      </ToggleGroup>
                    </div>

                    <div className="relative max-w-md">
                      <HugeiconsIcon icon={Search01Icon} size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search my templates..."
                        className="pl-10"
                        value={mySearchQuery}
                        onChange={(e) => setMySearchQuery(e.target.value)}
                      />
                    </div>
                    <div className="mt-3">
                      <CategoryFilter
                        categories={myTemplateCategories}
                        quickCategories={myTemplateCategories.slice(0, 4)}
                        value={myCategory}
                        onChange={setMyCategory}
                      />
                    </div>

                    {filteredMyTemplates.length > 0 ? (
                      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredMyTemplates.map((template) => (
                          <TemplateCard
                            key={template.id}
                            template={template}
                            tall
                            onPreview={openPreview}
                            onUse={handleUseTemplate}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="mt-16 flex flex-col items-center text-center">
                        <HugeiconsIcon icon={File01Icon} size={48} className="text-muted-foreground/30" />
                        <p className="text-sm font-medium text-muted-foreground mt-4">
                          No templates yet
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Save a document as a template to reuse it later
                        </p>
                        <Button
                          variant="link"
                          size="sm"
                          className="mt-3"
                          onClick={() => setActiveTab("library")}
                        >
                          Browse Template Library <HugeiconsIcon icon={ArrowRight01Icon} size={14} className="ml-1" />
                        </Button>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="library" className="mt-4">
                    <div className="relative max-w-md">
                      <HugeiconsIcon icon={Search01Icon} size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search template library..."
                        className="pl-10"
                        value={libSearchQuery}
                        onChange={(e) => setLibSearchQuery(e.target.value)}
                      />
                    </div>
                    <div className="mt-3">
                      <CategoryFilter
                        categories={libraryCategories}
                        quickCategories={quickFilterCategories}
                        value={libCategory}
                        onChange={setLibCategory}
                      />
                    </div>

                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredLibTemplates.map((template) => (
                        <TemplateCard
                          key={template.id}
                          template={template}
                          tall
                          onPreview={openPreview}
                          onUse={handleUseTemplate}
                        />
                      ))}
                      {filteredLibTemplates.length === 0 && (
                        <div className="col-span-full py-16 text-center">
                          <p className="text-muted-foreground">No templates found</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </section>

            {isEsign && (
              <section className="mt-10">
                <div
                  className={`border-2 border-dashed rounded-2xl min-h-[200px] flex flex-col items-center justify-center transition-colors ${
                    esignDropHover
                      ? "border-primary bg-primary/5"
                      : "border-muted-foreground/20"
                  }`}
                  onDragEnter={(e) => { e.preventDefault(); setEsignDropHover(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setEsignDropHover(false); }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setEsignDropHover(false);
                    if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
                  }}
                >
                  <HugeiconsIcon icon={CloudUploadIcon} size={56} className={`${esignDropHover ? "text-primary" : "text-muted-foreground/40"} transition-colors`} />
                  <p className="text-lg font-medium text-muted-foreground mt-4">
                    Drag and drop your documents here
                  </p>
                  <p className="text-sm text-muted-foreground my-2">or</p>
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                    Browse Files
                  </Button>
                  <p className="text-xs text-muted-foreground mt-3">
                    PDF, DOCX, DOC, PNG, JPG — up to 50MB
                  </p>
                </div>
              </section>
            )}
          </div>
        </main>

        <AnimatePresence>
          {isPanelOpen && (
            <motion.div
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
            >
              <DocumentQueuePanel
                documents={documents}
                setDocuments={setDocuments}
                onClose={() => setIsPanelOpen(false)}
                onAddFiles={() => fileInputRef.current?.click()}
                mode={mode}
              />
            </motion.div>
          )}
        </AnimatePresence>
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

      <Dialog
        open={aiDialogOpen}
        onOpenChange={(o) => {
          if (!aiGenerating) {
            setAiDialogOpen(o);
            if (!o) { setAiPrompt(""); setAiDocType(""); }
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
              <Label className="text-xs text-muted-foreground mb-1.5 block">Document Type</Label>
              <Input
                placeholder="e.g. NDA, Sales Proposal, Service Contract..."
                value={aiDocType}
                onChange={(e) => setAiDocType(e.target.value)}
                disabled={aiGenerating}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Describe your document</Label>
              <Textarea
                placeholder="e.g. Draft a non-disclosure agreement between two companies for a software development partnership..."
                className="min-h-[130px] resize-none"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                disabled={aiGenerating}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {AI_SUGGESTIONS.map((s) => (
                <Button
                  key={s}
                  variant="outline"
                  size="sm"
                  className="rounded-full text-xs h-7"
                  onClick={() => setAiPrompt(s)}
                  disabled={aiGenerating}
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAiDialogOpen(false);
                setAiPrompt("");
                setAiDocType("");
              }}
              disabled={aiGenerating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAIGenerate}
              disabled={!aiPrompt.trim() || aiGenerating}
            >
              {aiGenerating ? (
                <>
                  <HugeiconsIcon icon={Loading03Icon} size={16} className="mr-1.5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <AiIcon size={16} className="mr-1.5" />
                  Generate Document
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Drive Import Dialog */}
      <DriveImportDialog
        open={driveDialogOpen}
        onOpenChange={setDriveDialogOpen}
        connectedProviders={connectedProviders}
        setConnectedProviders={setConnectedProviders}
        onImportFiles={handleDriveImport}
      />
    </div>
  );
};

export default CreateDocument;
