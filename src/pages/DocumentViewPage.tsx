import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useWorkspaceMode, WorkspaceModeProvider } from "@/contexts/WorkspaceModeContext";
import { workspaceDocuments } from "@/data/workspaceDocuments";
import { WorkspaceDocument } from "@/types/workspace";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon, UserMultiple02Icon, Comment01Icon, PropertyEditIcon,
} from "@hugeicons/core-free-icons";
import {
  MoreVertical, Download, Copy, Bell, PenTool, Check, X, XCircle,
  Send, Edit, FileSearch, Tag, Share2, CalendarDays, CheckCircle,
  Lock, ArrowRight, Clock, AlertTriangle, Ban, Plus, Search,
  ChevronUp, ChevronDown, Minus, File,
} from "lucide-react";
import AiIcon from "@/components/AiIcon";
import { ZoomBar, SearchBar } from "@/components/editor/EditorZoomSearch";
import DocumentViewParticipantsPanel from "@/components/document-view/ParticipantsPanel";
import DocumentViewActivityPanel from "@/components/document-view/ActivityPanel";
import DocumentViewAIPanel from "@/components/document-view/AIPanel";
import DocumentViewCommentsPanel from "@/components/document-view/CommentsPanel";
import DocumentViewPropertiesPanel from "@/components/document-view/PropertiesPanel";
import DocumentViewWorkflowPanel from "@/components/document-view/WorkflowPanel";
import DocumentViewCanvas from "@/components/document-view/DocumentViewCanvas";

/* ── Types ── */
type ViewPanelId = "participants" | "activity" | "ai" | "comments" | "properties" | "workflow";

/* ── Stage config ── */
const stageConfig: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
  approving: { label: "Approval", className: "bg-blue-50 text-blue-600 border border-blue-200" },
  approved: { label: "Approved", className: "bg-blue-50 text-blue-600 border border-blue-200" },
  sent: { label: "Signing", className: "bg-primary/5 text-primary border border-primary/20" },
  partially_signed: { label: "Signing", className: "bg-primary/5 text-primary border border-primary/20" },
  waiting: { label: "Signing", className: "bg-primary/5 text-primary border border-primary/20" },
  requires_action: { label: "Signing", className: "bg-primary/5 text-primary border border-primary/20" },
  expiring: { label: "Expiring", className: "bg-amber-50 text-amber-600 border border-amber-200" },
  completed: { label: "Completed", className: "bg-green-50 text-green-600 border border-green-200" },
  declined: { label: "Declined", className: "bg-destructive/5 text-destructive" },
  voided: { label: "Voided", className: "bg-muted text-muted-foreground" },
  expired: { label: "Expired", className: "bg-amber-50 text-amber-600" },
};

/* ── Tag system ── */
const MOCK_TAGS = [
  { id: "t1", name: "VIP Client", color: "bg-blue-500" },
  { id: "t2", name: "Confidential", color: "bg-slate-500" },
  { id: "t3", name: "Legal Review", color: "bg-amber-500" },
  { id: "t4", name: "Auto-Renewal", color: "bg-green-500" },
  { id: "t5", name: "Urgent", color: "bg-red-500" },
];

function DocumentViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { isESign } = useWorkspaceMode();

  const doc = workspaceDocuments.find((d) => d.id === id) || null;
  const defaultPanel: ViewPanelId = doc?.stage === "approving" ? "workflow" : "participants";
  const [activePanel, setActivePanel] = useState<ViewPanelId | null>(defaultPanel);
  const [title, setTitle] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagSearch, setTagSearch] = useState("");
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  // Dialogs
  const [voidOpen, setVoidOpen] = useState(false);
  const [voidReason, setVoidReason] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [approveOpen, setApproveOpen] = useState(false);
  const [approveMessage, setApproveMessage] = useState("");
  const [vaultOpen, setVaultOpen] = useState(false);

  // Zoom & search
  const [zoom, setZoom] = useState(100);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    if (doc) {
      setTitle(doc.name);
      setTags([...doc.tags]);
    }
  }, [doc]);

  useEffect(() => {
    if (isEditingTitle && titleRef.current) {
      titleRef.current.focus();
      titleRef.current.select();
    }
  }, [isEditingTitle]);

  // Cmd+F
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const handlePanelToggle = useCallback((id: ViewPanelId) => {
    setActivePanel((prev) => (prev === id ? null : id));
  }, []);

  if (!doc) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Document not found</p>
      </div>
    );
  }

  const stage = stageConfig[doc.stage] ?? stageConfig.draft;
  const isYourAction = doc.stage === "requires_action" || doc.waitingFor?.name === "Ahmad Medhat";
  const isApproval = ["approving", "approved"].includes(doc.stage);
  const isSigning = ["sent", "partially_signed", "waiting", "requires_action", "expiring"].includes(doc.stage);
  const hasWorkflow = !!doc.approvalSteps;

  const pendingCount = doc.participants.filter((p) => p.status === "pending").length;

  /* ── Action buttons ── */
  const renderPrimaryButton = () => {
    if (isSigning && !isYourAction) {
      return (
        <Button className="h-9 px-5 rounded-lg gap-1.5" onClick={() => toast.success(`Reminder sent to ${pendingCount} pending participants`)}>
          <Bell size={14} /> Remind
        </Button>
      );
    }
    if (isSigning && isYourAction) {
      return (
        <Button className="h-9 px-5 rounded-lg gap-1.5" onClick={() => navigate(`/signing/${doc.id}`)}>
          <PenTool size={14} /> Sign
        </Button>
      );
    }
    if (isApproval && isYourAction) {
      return (
        <Button className="h-9 px-5 rounded-lg gap-1.5" onClick={() => setApproveOpen(true)}>
          <Check size={14} /> Approve
        </Button>
      );
    }
    if (isApproval && !isYourAction) {
      return (
        <Button className="h-9 px-5 rounded-lg gap-1.5" onClick={() => toast.success(`Reminder sent to ${pendingCount} pending participants`)}>
          <Bell size={14} /> Remind
        </Button>
      );
    }
    if (doc.stage === "completed") {
      return (
        <Button className="h-9 px-5 rounded-lg gap-1.5" onClick={() => toast.success("Download started")}>
          <Download size={14} /> Download
        </Button>
      );
    }
    if (doc.stage === "declined" || doc.stage === "voided") {
      return (
        <Button className="h-9 px-5 rounded-lg gap-1.5" onClick={() => toast.success("Document duplicated")}>
          <Copy size={14} /> Duplicate
        </Button>
      );
    }
    if (doc.stage === "expired") {
      return (
        <Button className="h-9 px-5 rounded-lg gap-1.5" onClick={() => toast.success("Resent with new expiration")}>
          <Send size={14} /> Resend
        </Button>
      );
    }
    return null;
  };

  const renderSecondaryButton = () => {
    if (isSigning) {
      return (
        <Button variant="outline" className="h-8 gap-1.5" onClick={() => toast.success("Download started")}>
          <Download size={14} /> Download
        </Button>
      );
    }
    if (isApproval && isYourAction) {
      return (
        <Button variant="outline" className="h-8 gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/5" onClick={() => setRejectOpen(true)}>
          <XCircle size={14} /> Reject
        </Button>
      );
    }
    if (isApproval && !isYourAction) {
      return (
        <Button variant="outline" className="h-8 gap-1.5" onClick={() => toast.success("Download started")}>
          <Download size={14} /> Download
        </Button>
      );
    }
    if (doc.stage === "completed") {
      return (
        <Button variant="outline" className="h-8 gap-1.5" onClick={() => setVaultOpen(true)}>
          <Lock size={14} /> Move to vault
        </Button>
      );
    }
    if (doc.stage === "declined" || doc.stage === "voided") {
      return (
        <Button variant="outline" className="h-8 gap-1.5" onClick={() => toast.success("Download started")}>
          <Download size={14} /> Download
        </Button>
      );
    }
    if (doc.stage === "expired") {
      return (
        <Button variant="outline" className="h-8 gap-1.5" onClick={() => toast.success("Document duplicated")}>
          <Copy size={14} /> Duplicate
        </Button>
      );
    }
    return null;
  };

  const renderMenuItems = () => {
    const items: { label: string; icon: React.ElementType; onClick: () => void; destructive?: boolean }[] = [];

    if (isSigning && !isYourAction) {
      items.push(
        { label: "Correct", icon: Edit, onClick: () => navigate(`/create?mode=correction&id=${doc.id}`) },
        { label: "Update expiration", icon: CalendarDays, onClick: () => toast.success("Expiration updated") },
        { label: "Mark as complete", icon: CheckCircle, onClick: () => toast.success("Document marked as complete") },
        { label: "Void document", icon: XCircle, onClick: () => setVoidOpen(true), destructive: true },
      );
    }
    if (isSigning && isYourAction) {
      items.push(
        { label: "Update expiration", icon: CalendarDays, onClick: () => toast.success("Expiration updated") },
      );
    }
    if (isApproval && !isYourAction) {
      items.push(
        { label: "Update expiration", icon: CalendarDays, onClick: () => toast.success("Expiration updated") },
        { label: "Send reminder", icon: Bell, onClick: () => toast.success("Reminder sent") },
        { label: "Mark as complete", icon: CheckCircle, onClick: () => toast.success("Completed") },
      );
    }
    if (isApproval && isYourAction) {
      items.push(
        { label: "Download", icon: Download, onClick: () => toast.success("Download started") },
      );
    }
    if (doc.stage === "completed") {
      items.push(
        { label: "Add follow-up", icon: Plus, onClick: () => navigate(`/create?mode=followup&parentId=${doc.id}&childType=supplement`) },
        { label: "Transfer ownership", icon: ArrowRight, onClick: () => toast.success("Ownership transferred") },
      );
    }
    if (doc.stage === "expired") {
      items.push(
        { label: "Update expiration", icon: CalendarDays, onClick: () => toast.success("Expiration updated") },
        { label: "Download", icon: Download, onClick: () => toast.success("Download started") },
      );
    }

    // Common items
    items.push(
      { label: "Audit trail", icon: FileSearch, onClick: () => setActivePanel("activity") },
      { label: "Rename", icon: Edit, onClick: () => setIsEditingTitle(true) },
      { label: "Share", icon: Share2, onClick: () => toast.success("Share link copied") },
    );
    if (!["declined", "voided"].includes(doc.stage)) {
      items.push({ label: "Manage tags", icon: Tag, onClick: () => setTagPopoverOpen(true) });
    }

    return items;
  };

  /* ── Panel toolbar items ── */
  const panelItems: { id: ViewPanelId; icon?: any; useAi?: boolean; label: string; clmOnly?: boolean }[] = isESign
    ? [
        { id: "participants", icon: UserMultiple02Icon, label: "Participants" },
        { id: "activity", icon: Clock, label: "Activity" },
      ]
    : [
        { id: "participants", icon: UserMultiple02Icon, label: "Participants" },
        { id: "activity", icon: Clock, label: "Activity" },
        { id: "ai", useAi: true, label: "AI Assistant" },
        { id: "comments", icon: Comment01Icon, label: "Comments" },
        { id: "properties", icon: PropertyEditIcon, label: "Properties" },
        ...(hasWorkflow ? [{ id: "workflow" as ViewPanelId, icon: Clock, label: "Workflow" }] : []),
      ];

  /* ── Render panel content ── */
  const renderPanelContent = () => {
    if (!activePanel) return null;
    switch (activePanel) {
      case "participants":
        return <DocumentViewParticipantsPanel doc={doc} />;
      case "activity":
        return <DocumentViewActivityPanel doc={doc} />;
      case "ai":
        return <DocumentViewAIPanel />;
      case "comments":
        return <DocumentViewCommentsPanel />;
      case "properties":
        return <DocumentViewPropertiesPanel doc={doc} />;
      case "workflow":
        return <DocumentViewWorkflowPanel doc={doc} />;
      default:
        return null;
    }
  };

  const panelTitle: Record<ViewPanelId, string> = {
    participants: "Participants",
    activity: "Activity",
    ai: "AI Assistant",
    comments: "Comments",
    properties: "Properties",
    workflow: "Workflow",
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="h-screen flex flex-col bg-background">
      {/* ── TOP BAR ── */}
      <div className="h-[52px] border-b bg-card px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 shrink-0" onClick={() => navigate("/")}>
                <HugeiconsIcon icon={Cancel01Icon} size={18} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Close</TooltipContent>
          </Tooltip>

          <div className="h-5 w-px bg-border mx-1 shrink-0" />

          {/* Title */}
          {isEditingTitle ? (
            <Input
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => { setIsEditingTitle(false); toast.success("Title updated"); }}
              onKeyDown={(e) => { if (e.key === "Enter") { setIsEditingTitle(false); toast.success("Title updated"); } if (e.key === "Escape") setIsEditingTitle(false); }}
              className="h-8 text-sm font-semibold border-0 border-b-2 border-primary rounded-none focus-visible:ring-0 shadow-none max-w-[300px]"
            />
          ) : (
            <button className="text-sm font-semibold truncate max-w-[300px] hover:text-primary transition-colors" onClick={() => setIsEditingTitle(true)}>
              {title}
            </button>
          )}

          <Badge className={cn("rounded-full h-6 px-2 text-[11px] shrink-0", stage.className)}>
            {stage.label}
          </Badge>

          {/* Tags */}
          <div className="hidden md:flex items-center gap-1 ml-1">
            {tags.map((t) => {
              const tagDef = MOCK_TAGS.find((mt) => mt.name === t);
              return (
                <span key={t} className="group flex items-center gap-1 text-[11px] bg-muted border border-border px-2 py-0.5 rounded-full">
                  {tagDef && <span className={cn("h-1.5 w-1.5 rounded-full", tagDef.color)} />}
                  {t}
                  <X size={10} className="opacity-0 group-hover:opacity-100 cursor-pointer text-muted-foreground" onClick={() => setTags((prev) => prev.filter((x) => x !== t))} />
                </span>
              );
            })}
            <button className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-0.5" onClick={() => setTagPopoverOpen(!tagPopoverOpen)}>
              <Plus size={10} /> Add tag
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* 3-dot menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreVertical size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {renderMenuItems().map((item, i) => (
                <DropdownMenuItem
                  key={item.label}
                  className={cn("gap-2 px-3 py-2 text-sm", item.destructive && "text-destructive focus:text-destructive")}
                  onClick={item.onClick}
                >
                  <item.icon size={16} className={item.destructive ? "" : "text-muted-foreground"} />
                  {item.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {renderSecondaryButton()}
          {renderPrimaryButton()}
        </div>
      </div>

      {/* ── STATUS BANNER ── */}
      {doc.stage === "voided" && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 flex items-center gap-2 text-sm">
          <Ban size={14} className="text-red-500 shrink-0" />
          <span className="text-red-700">This document was voided on {new Date(doc.modifiedAt).toLocaleDateString()} by {doc.owner}. Reason: Terms superseded by new agreement.</span>
        </div>
      )}
      {doc.stage === "expired" && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-amber-500 shrink-0" />
            <span className="text-amber-700">This document expired on {doc.expiresAt ? new Date(doc.expiresAt).toLocaleDateString() : new Date(doc.modifiedAt).toLocaleDateString()}.</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => toast.success("Resent with new expiration")}>Resend</Button>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => toast.success("Expiration updated")}>Update expiration</Button>
          </div>
        </div>
      )}
      {doc.stage === "declined" && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <XCircle size={14} className="text-red-500 shrink-0" />
            <span className="text-red-700">
              Declined by {doc.participants.find((p) => p.status === "declined")?.name || "participant"} on {new Date(doc.modifiedAt).toLocaleDateString()}. Reason: Terms not acceptable.
            </span>
          </div>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => toast.success("Document duplicated")}>Duplicate</Button>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel toolbar */}
        {!isMobile && (
          <div className="w-12 border-r bg-card flex flex-col items-center py-3 gap-1 shrink-0">
            {panelItems.map((item) => {
              const isActive = activePanel === item.id;
              if (item.useAi) {
                return (
                  <Tooltip key={item.id} delayDuration={0}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => handlePanelToggle(item.id)}
                        className={cn(
                          "ai-toolbar-btn h-10 w-10 rounded-xl flex items-center justify-center transition-all relative",
                          isActive && "ai-toolbar-btn--active"
                        )}
                      >
                        <div className="ai-toolbar-btn__border" />
                        <div className={cn("relative z-10 flex items-center justify-center h-full w-full rounded-xl", "bg-gradient-to-br from-indigo-500/10 to-violet-500/10")}>
                          <AiIcon size={20} className="ai-toolbar-btn__icon" />
                        </div>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                );
              }

              const isHugeIcon = item.icon === UserMultiple02Icon || item.icon === Comment01Icon || item.icon === PropertyEditIcon;

              return (
                <Tooltip key={item.id} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handlePanelToggle(item.id)}
                      className={cn(
                        "h-9 w-9 rounded-lg flex items-center justify-center transition-colors",
                        isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                    >
                      {isHugeIcon ? <HugeiconsIcon icon={item.icon} size={18} /> : <item.icon size={18} />}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        )}

        {/* Panel content (slides from left) */}
        {!isMobile && (
          <AnimatePresence>
            {activePanel && (
              <motion.div
                key={activePanel}
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 380, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="border-r bg-card flex flex-col overflow-hidden shrink-0"
              >
                <div className="h-12 border-b flex items-center justify-between px-4 shrink-0">
                  <h3 className="text-sm font-semibold">{panelTitle[activePanel]}</h3>
                  <Button variant="ghost" className="h-7 w-7 p-0" onClick={() => setActivePanel(null)}>
                    <X size={14} />
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  {renderPanelContent()}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Document viewer (center) */}
        <div className="flex-1 overflow-y-auto bg-muted/30 relative" data-editor-canvas>
          <AnimatePresence>
            {searchOpen && <SearchBar open={searchOpen} onClose={() => setSearchOpen(false)} />}
          </AnimatePresence>

          <DocumentViewCanvas doc={doc} zoom={zoom} />

          {/* Zoom controls */}
          <ZoomBar zoom={zoom} onZoomChange={setZoom} searchOpen={searchOpen} onSearchToggle={() => setSearchOpen(!searchOpen)} />
        </div>
      </div>

      {/* Mobile panel as sheet */}
      {isMobile && (
        <>
          <div className="h-12 border-t bg-card flex items-center justify-center gap-2 px-2 shrink-0">
            {panelItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handlePanelToggle(item.id)}
                className={cn("h-9 w-9 rounded-lg flex items-center justify-center transition-colors", activePanel === item.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent")}
              >
                {item.useAi ? <AiIcon size={18} /> : item.icon === UserMultiple02Icon || item.icon === Comment01Icon || item.icon === PropertyEditIcon ? <HugeiconsIcon icon={item.icon} size={18} /> : <item.icon size={18} />}
              </button>
            ))}
          </div>
          <Sheet open={!!activePanel} onOpenChange={(open) => !open && setActivePanel(null)}>
            <SheetContent side="bottom" className="h-[80vh] p-0">
              <SheetHeader className="sr-only"><SheetTitle>Panel</SheetTitle></SheetHeader>
              <div className="h-12 border-b flex items-center justify-between px-4">
                <h3 className="text-sm font-semibold">{activePanel ? panelTitle[activePanel] : ""}</h3>
                <Button variant="ghost" className="h-7 w-7 p-0" onClick={() => setActivePanel(null)}><X size={14} /></Button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">{renderPanelContent()}</div>
            </SheetContent>
          </Sheet>
        </>
      )}

      {/* ── DIALOGS ── */}
      <AlertDialog open={voidOpen} onOpenChange={setVoidOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Void document?</AlertDialogTitle>
            <AlertDialogDescription>This will cancel all pending actions. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea placeholder="Reason for voiding (required)" value={voidReason} onChange={(e) => setVoidReason(e.target.value)} className="min-h-[80px]" />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={!voidReason.trim()} className="bg-destructive text-destructive-foreground" onClick={() => { toast.success("Document voided"); setVoidReason(""); }}>
              Void document
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject document?</AlertDialogTitle>
            <AlertDialogDescription>Please provide a reason for rejecting this document.</AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea placeholder="Reason for rejection (required)" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className="min-h-[80px]" />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={!rejectReason.trim()} className="bg-destructive text-destructive-foreground" onClick={() => { toast.error("Document rejected"); setRejectReason(""); }}>
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={approveOpen} onOpenChange={setApproveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve document?</AlertDialogTitle>
            <AlertDialogDescription>Confirm approval of "{doc.name}".</AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea placeholder="Optional message" value={approveMessage} onChange={(e) => setApproveMessage(e.target.value)} className="min-h-[60px]" />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { toast.success("Document approved"); setApproveMessage(""); }}>Approve</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={vaultOpen} onOpenChange={setVaultOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Move to vault?</AlertDialogTitle>
            <AlertDialogDescription>"{doc.name}" will be archived in the vault for safekeeping.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => toast.success("Moved to vault")}>Move to vault</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}

export default function DocumentViewPageWrapper() {
  return (
    <WorkspaceModeProvider>
      <DocumentViewPage />
    </WorkspaceModeProvider>
  );
}
