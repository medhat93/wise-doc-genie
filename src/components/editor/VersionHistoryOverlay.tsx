import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { X, MoreVertical, ChevronDown, ChevronRight, Check } from "lucide-react";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";

/* ── Types ── */
interface Version {
  id: string;
  date: string;
  time: string;
  author: string;
  authorColor: string;
  summary: string;
  additions: number;
  deletions: number;
  name?: string;
  isAutoName?: boolean;
  isCurrent?: boolean;
}

interface DayGroup {
  label: string;
  versions: Version[];
}

/* ── Mock data ── */
const MOCK_VERSIONS: Version[] = [
  { id: "v8", date: "April 5, 2026", time: "3:45 PM", author: "Ahmad Medhat", authorColor: "bg-indigo-500", summary: "Updated payment terms section", additions: 2, deletions: 1, isCurrent: true },
  { id: "v7", date: "April 5, 2026", time: "2:30 PM", author: "Ahmad Medhat", authorColor: "bg-indigo-500", summary: "Added confidentiality clause from library", additions: 1, deletions: 0 },
  { id: "v6", date: "April 4, 2026", time: "5:15 PM", author: "Sarah Johnson", authorColor: "bg-rose-500", summary: "Suggested changes to scope of services", additions: 3, deletions: 2, name: "v2.0 — After Sarah's review" },
  { id: "v5", date: "April 4, 2026", time: "11:00 AM", author: "Ahmad Medhat", authorColor: "bg-indigo-500", summary: "Filled in all placeholders", additions: 5, deletions: 0 },
  { id: "v4", date: "April 3, 2026", time: "4:00 PM", author: "Ahmad Medhat", authorColor: "bg-indigo-500", summary: "Added Schedule A supplement", additions: 1, deletions: 0 },
  { id: "v3", date: "April 3, 2026", time: "2:00 PM", author: "Ahmad Medhat", authorColor: "bg-indigo-500", summary: "Initial contract structure", additions: 8, deletions: 0, name: "v1.0 — First draft" },
  { id: "v2", date: "April 3, 2026", time: "1:30 PM", author: "Ahmad Medhat", authorColor: "bg-indigo-500", summary: "Created from template", additions: 12, deletions: 0, name: "Original", isAutoName: true },
];

const groupByDay = (versions: Version[]): DayGroup[] => {
  const today = "April 5, 2026";
  const yesterday = "April 4, 2026";
  const groups: Record<string, Version[]> = {};
  versions.forEach((v) => {
    const key = v.date;
    if (!groups[key]) groups[key] = [];
    groups[key].push(v);
  });
  return Object.entries(groups).map(([date, vers]) => ({
    label: date === today ? "Today" : date === yesterday ? "Yesterday" : date,
    versions: vers,
  }));
};

/* ── Diff mock content per version ── */
const getDiffContent = (versionId: string) => {
  switch (versionId) {
    case "v8":
      return (
        <>
          <h1 className="text-2xl font-bold mb-4">Master Services Agreement</h1>
          <p className="mb-3 text-sm leading-relaxed">
            Effective Date: <span className="bg-amber-100 px-1 rounded text-amber-800">[Effective.Date]</span>
          </p>
          <p className="mb-4 text-sm leading-relaxed">
            This Master Services Agreement ("Agreement") is entered into by and between{" "}
            <span className="bg-amber-100 px-1 rounded text-amber-800">[Client.Name]</span> and{" "}
            <span className="bg-amber-100 px-1 rounded text-amber-800">[Sender.Company]</span>.
            This Agreement sets forth the terms and conditions under which the Service Provider shall provide services to the Client.
          </p>
          <h2 className="text-lg font-semibold mb-2">1. Definitions</h2>
          <p className="mb-4 text-sm leading-relaxed">
            "Services" means the professional services described in each Statement of Work executed under this Agreement.
            "Deliverables" means all work product, reports, and materials produced by the Service Provider in connection with the Services.
          </p>
          <h2 className="text-lg font-semibold mb-2">4. Payment Terms</h2>
          <p className="mb-2 text-sm leading-relaxed bg-red-100/60 line-through text-red-700/70">
            The Client shall pay the Service Provider within thirty (30) days of receipt of each invoice.
            Late payments shall accrue interest at a rate of 1.5% per month.
          </p>
          <p className="mb-4 text-sm leading-relaxed bg-emerald-100/60">
            The Client shall pay the Service Provider within fifteen (15) business days of receipt of each invoice.
            Late payments shall accrue interest at a rate of 2% per month, compounded monthly. All payments shall be made in the currency specified in the applicable Statement of Work.
          </p>
          <h2 className="text-lg font-semibold mb-2">5. Confidentiality</h2>
          <p className="mb-4 text-sm leading-relaxed">
            Each party agrees to maintain the confidentiality of all proprietary information received from the other party during the term of this Agreement.
          </p>
        </>
      );
    case "v7":
      return (
        <>
          <h1 className="text-2xl font-bold mb-4">Master Services Agreement</h1>
          <p className="mb-3 text-sm leading-relaxed">
            Effective Date: <span className="bg-amber-100 px-1 rounded text-amber-800">[Effective.Date]</span>
          </p>
          <h2 className="text-lg font-semibold mb-2">5. Confidentiality</h2>
          <p className="mb-4 text-sm leading-relaxed bg-emerald-100/60">
            The receiving party agrees to maintain strict confidentiality of all proprietary information disclosed by the disclosing party.
            This obligation shall survive termination of this Agreement for a period of three (3) years.
          </p>
          <p className="mb-4 text-sm leading-relaxed">
            Each party agrees to maintain the confidentiality of all proprietary information received from the other party.
          </p>
        </>
      );
    case "v6":
      return (
        <>
          <h1 className="text-2xl font-bold mb-4">Master Services Agreement</h1>
          <h2 className="text-lg font-semibold mb-2">2. Scope of Services</h2>
          <p className="mb-2 text-sm leading-relaxed bg-red-100/60 line-through text-red-700/70">
            The Service Provider agrees to perform the Services as described in one or more Statements of Work.
          </p>
          <p className="mb-2 text-sm leading-relaxed bg-red-100/60 line-through text-red-700/70">
            Each Statement of Work shall specify the scope, timeline, and fees.
          </p>
          <p className="mb-2 text-sm leading-relaxed bg-emerald-100/60">
            The Service Provider agrees to perform the Services as described in one or more Statements of Work to be mutually agreed upon and executed by both parties.
          </p>
          <p className="mb-2 text-sm leading-relaxed bg-emerald-100/60">
            Each Statement of Work shall specify the scope, timeline, deliverables, and fees for the applicable Services.
          </p>
          <p className="mb-4 text-sm leading-relaxed bg-emerald-100/60">
            Any changes to the scope shall require a written amendment signed by both parties.
          </p>
        </>
      );
    default:
      return (
        <>
          <h1 className="text-2xl font-bold mb-4">Master Services Agreement</h1>
          <p className="mb-3 text-sm leading-relaxed">
            Effective Date: <span className="bg-amber-100 px-1 rounded text-amber-800">[Effective.Date]</span>
          </p>
          <p className="mb-4 text-sm leading-relaxed">
            This Master Services Agreement ("Agreement") is entered into by and between{" "}
            <span className="bg-amber-100 px-1 rounded text-amber-800">[Client.Name]</span> and{" "}
            <span className="bg-amber-100 px-1 rounded text-amber-800">[Sender.Company]</span>.
          </p>
          <h2 className="text-lg font-semibold mb-2">1. Definitions</h2>
          <p className="mb-4 text-sm leading-relaxed">
            "Services" means the professional services described in each Statement of Work executed under this Agreement.
          </p>
          <h2 className="text-lg font-semibold mb-2">2. Scope of Services</h2>
          <p className="mb-4 text-sm leading-relaxed">
            The Service Provider agrees to perform the Services as described in one or more Statements of Work.
          </p>
        </>
      );
  }
};

/* ══════════ MAIN COMPONENT ══════════ */
interface VersionHistoryOverlayProps {
  open: boolean;
  onClose: () => void;
  documentName?: string;
}

const VersionHistoryOverlay = ({ open, onClose, documentName = "Master Services Agreement" }: VersionHistoryOverlayProps) => {
  const [selectedId, setSelectedId] = useState("v8");
  const [namedOnly, setNamedOnly] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [versions, setVersions] = useState(MOCK_VERSIONS);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  if (!open) return null;

  const selected = versions.find((v) => v.id === selectedId);
  const filtered = namedOnly ? versions.filter((v) => v.name) : versions;
  const groups = groupByDay(filtered);

  const handleRestore = () => {
    setRestoreDialogOpen(false);
    toast.success(`Document restored to ${selected?.name || `${selected?.date}, ${selected?.time}`}`);
    onClose();
  };

  const handleNameVersion = (id: string) => {
    setRenamingId(id);
    setRenameValue(versions.find((v) => v.id === id)?.name || "");
  };

  const saveRename = () => {
    if (!renamingId) return;
    setVersions((prev) =>
      prev.map((v) => (v.id === renamingId ? { ...v, name: renameValue || undefined } : v))
    );
    setRenamingId(null);
    toast.success("Version named");
  };

  const toggleCompareId = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  const toggleGroupExpand = (label: string) => {
    setExpandedGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 bg-background flex flex-col"
    >
      {/* ── Header ── */}
      <div className="h-[52px] bg-card border-b flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold">Version history</h2>
          <span className="text-sm text-muted-foreground">{documentName}</span>
        </div>
        <div className="flex items-center gap-2">
          {compareMode ? (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => { setCompareMode(false); setCompareIds([]); }}
            >
              Exit compare
            </Button>
          ) : (
            <Button
              size="sm"
              className="h-8 text-xs"
              disabled={selected?.isCurrent}
              onClick={() => setRestoreDialogOpen(true)}
            >
              Restore this version
            </Button>
          )}
          <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5" onClick={onClose}>
            <X size={14} />
            Close
          </Button>
        </div>
      </div>

      {/* ── Main area ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Document preview */}
        <div className="flex-1 overflow-y-auto bg-muted/20">
          {/* Version info banner */}
          <div className="bg-muted/30 text-xs text-muted-foreground py-2 px-4 border-b flex items-center gap-2">
            <span className="font-medium text-foreground">{selected?.name || `${selected?.date}, ${selected?.time}`}</span>
            <span>—</span>
            <span className="flex items-center gap-1.5">
              <span className={cn("h-2 w-2 rounded-full inline-block", selected?.authorColor)} />
              by {selected?.author}
            </span>
            <span>—</span>
            <span>{selected?.additions} addition{selected?.additions !== 1 ? "s" : ""}, {selected?.deletions} deletion{selected?.deletions !== 1 ? "s" : ""}</span>
            {selected?.isCurrent && (
              <span className="ml-2 bg-primary/10 text-primary text-[10px] font-medium px-2 py-0.5 rounded-full">Current</span>
            )}
          </div>

          {/* Document content */}
          <div className="max-w-[816px] mx-auto my-8 bg-card shadow-sm border rounded-sm p-16 min-h-[600px]">
            {getDiffContent(selectedId)}
          </div>
        </div>

        {/* ── Timeline sidebar ── */}
        <div className="w-[320px] border-l bg-card flex flex-col flex-shrink-0">
          {/* Toggle */}
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Show only named versions</span>
            <Switch checked={namedOnly} onCheckedChange={setNamedOnly} className="scale-90" />
          </div>

          {/* Version list */}
          <div className="flex-1 overflow-y-auto">
            {groups.map((group) => {
              const isExpanded = expandedGroups[group.label] !== false; // default open
              return (
                <div key={group.label}>
                  {/* Day header */}
                  <button
                    className="w-full text-left text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-4 py-2 bg-muted/30 flex items-center gap-1.5 hover:bg-muted/50 transition-colors"
                    onClick={() => toggleGroupExpand(group.label)}
                  >
                    {isExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                    {group.label}
                    <span className="font-normal ml-1">({group.versions.length})</span>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="overflow-hidden"
                      >
                        {group.versions.map((version) => {
                          const isSelected = !compareMode && selectedId === version.id;
                          const isCompareSelected = compareMode && compareIds.includes(version.id);

                          return (
                            <div
                              key={version.id}
                              className={cn(
                                "px-4 py-3 border-b border-border/50 cursor-pointer transition-colors group relative",
                                isSelected
                                  ? "bg-primary/5 border-l-[3px] border-l-primary"
                                  : isCompareSelected
                                  ? "bg-primary/5"
                                  : "bg-card hover:bg-muted/50"
                              )}
                              onClick={() => {
                                if (compareMode) {
                                  toggleCompareId(version.id);
                                } else {
                                  setSelectedId(version.id);
                                }
                              }}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  {/* Compare checkbox */}
                                  {compareMode && (
                                    <div className="flex items-center gap-2 mb-1">
                                      <div className={cn(
                                        "h-4 w-4 rounded border-2 flex items-center justify-center transition-colors",
                                        isCompareSelected ? "bg-primary border-primary" : "border-muted-foreground/40"
                                      )}>
                                        {isCompareSelected && <Check size={10} className="text-primary-foreground" />}
                                      </div>
                                    </div>
                                  )}

                                  {/* Date/time or rename input */}
                                  {renamingId === version.id ? (
                                    <Input
                                      autoFocus
                                      value={renameValue}
                                      onChange={(e) => setRenameValue(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") saveRename();
                                        if (e.key === "Escape") setRenamingId(null);
                                      }}
                                      onBlur={saveRename}
                                      className="h-6 text-xs mb-1"
                                      placeholder="Version name..."
                                      maxLength={60}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  ) : (
                                    <p className="text-sm font-medium truncate">
                                      {version.date}, {version.time}
                                      {version.isCurrent && (
                                        <span className="ml-1.5 text-[10px] text-primary font-normal">(current)</span>
                                      )}
                                    </p>
                                  )}

                                  {/* Author */}
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className={cn("h-2 w-2 rounded-full flex-shrink-0", version.authorColor)} />
                                    <span className="text-xs text-muted-foreground truncate">{version.author}</span>
                                  </div>

                                  {/* Summary */}
                                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{version.summary}</p>

                                  {/* Changes count */}
                                  <p className="text-[10px] text-muted-foreground mt-0.5">
                                    {version.additions > 0 && <span className="text-emerald-600">{version.additions} addition{version.additions !== 1 ? "s" : ""}</span>}
                                    {version.additions > 0 && version.deletions > 0 && ", "}
                                    {version.deletions > 0 && <span className="text-red-500">{version.deletions} deletion{version.deletions !== 1 ? "s" : ""}</span>}
                                  </p>

                                  {/* Named version pill */}
                                  {version.name && (
                                    <span className={cn(
                                      "inline-block mt-1.5 text-[10px] rounded-full px-2 py-0.5",
                                      version.isAutoName
                                        ? "bg-muted text-muted-foreground"
                                        : "bg-primary/10 text-primary"
                                    )}>
                                      {version.name}
                                    </span>
                                  )}
                                </div>

                                {/* 3-dot menu */}
                                {!compareMode && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <button
                                        className="h-6 w-6 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 hover:bg-muted transition-all"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <MoreVertical size={12} />
                                      </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-44">
                                      <DropdownMenuItem onClick={() => handleNameVersion(version.id)}>
                                        Name this version
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        disabled={version.isCurrent}
                                        onClick={() => {
                                          setSelectedId(version.id);
                                          setRestoreDialogOpen(true);
                                        }}
                                      >
                                        Restore this version
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => toast.success("Copy created")}>
                                        Make a copy
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* Compare link */}
          <div className="px-4 py-3 border-t">
            {compareMode ? (
              <p className="text-xs text-muted-foreground text-center">
                {compareIds.length < 2
                  ? `Select ${2 - compareIds.length} more version${compareIds.length === 0 ? "s" : ""}`
                  : "Comparing selected versions"}
              </p>
            ) : (
              <button
                className="text-xs text-primary hover:underline w-full text-center"
                onClick={() => setCompareMode(true)}
              >
                Compare two versions
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Restore dialog */}
      <AlertDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore this version?</AlertDialogTitle>
            <AlertDialogDescription>
              The document will be reverted to how it was on {selected?.date}, {selected?.time}.
              Your current version will be saved as a new entry in version history so you won't lose anything.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore}>Restore</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};

export default VersionHistoryOverlay;
