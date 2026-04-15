import { useState, useRef } from "react";
import { Clock, ChevronDown } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ReviewSendDialog from "./ReviewSendDialog";
import MissingFieldsWarningDialog, { type ParticipantIssue, type DocumentIssue } from "./MissingFieldsWarningDialog";
import { useEditorContext, type AcknowledgmentLevel } from "./EditorContext";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  UserAdd01Icon,
  Settings02Icon,
  MoreVerticalIcon,
  SentIcon,
  PencilEdit01Icon,
  Share01Icon,
  Copy01Icon,
  Download01Icon,
  Delete02Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, addDays } from "date-fns";
import { CalendarIcon, Check, Copy, Link, Trash2, Share2, FileDown, X, Info, Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

/* ── Tag system ── */
const MOCK_TAGS = [
  { id: "t1", name: "VIP Client", color: "bg-blue-500" },
  { id: "t2", name: "Confidential", color: "bg-slate-500" },
  { id: "t3", name: "Legal Review", color: "bg-amber-500" },
  { id: "t4", name: "Auto-Renewal", color: "bg-green-500" },
  { id: "t5", name: "Urgent", color: "bg-red-500" },
  { id: "t6", name: "NDA", color: "bg-purple-500" },
  { id: "t7", name: "Arbitration", color: "bg-orange-500" },
  { id: "t8", name: "Assignment", color: "bg-teal-500" },
];

/* ── Assign Dialog ── */
const MOCK_USERS = [
  { id: "u1", name: "Ahmed Al-Rashid", email: "ahmed@company.com" },
  { id: "u2", name: "Sarah Johnson", email: "sarah@company.com" },
  { id: "u3", name: "Mohammed Al-Faisal", email: "mohammed@company.com" },
  { id: "u4", name: "Fatima Al-Zahra", email: "fatima@company.com" },
  { id: "u5", name: "David Chen", email: "david@company.com" },
];

const MOCK_TEAMS = [
  { id: "t1", name: "Marketing team", count: 25 },
  { id: "t2", name: "Legal team", count: 8 },
];

const PERMISSION_LEVELS = ["View", "Comment", "Suggest", "Edit"] as const;

const AssignDialog = ({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) => {
  const [assignees, setAssignees] = useState<{ id: string; label: string }[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [role, setRole] = useState("reviewer");
  const [permissionIndex, setPermissionIndex] = useState(2);
  const [message, setMessage] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const removeAssignee = (id: string) => setAssignees((prev) => prev.filter((a) => a.id !== id));

  const addAssignee = (id: string, label: string) => {
    if (!assignees.find((a) => a.id === id)) {
      setAssignees((prev) => [...prev, { id, label }]);
    }
    setInputValue("");
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.includes("@")) {
      e.preventDefault();
      addAssignee(`email-${inputValue}`, inputValue);
    }
    if (e.key === "Backspace" && !inputValue && assignees.length > 0) {
      removeAssignee(assignees[assignees.length - 1].id);
    }
  };

  const filteredUsers = MOCK_USERS.filter(
    (u) =>
      !assignees.find((a) => a.id === u.id) &&
      (u.name.toLowerCase().includes(inputValue.toLowerCase()) ||
        u.email.toLowerCase().includes(inputValue.toLowerCase()))
  );
  const filteredTeams = MOCK_TEAMS.filter(
    (t) => !assignees.find((a) => a.id === t.id) && t.name.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Assign</DialogTitle>
          <DialogDescription className="sr-only">Assign this document to team members</DialogDescription>
        </DialogHeader>
        <div className="space-y-5 py-1">
          <div className="flex gap-3 items-start">
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs font-medium">Assignee/s</Label>
              <div
                className="min-h-[38px] flex flex-wrap items-center gap-1.5 border rounded-md px-2 py-1.5 cursor-text bg-background focus-within:ring-1 focus-within:ring-ring"
                onClick={() => inputRef.current?.focus()}
              >
                {assignees.map((a) => (
                  <span key={a.id} className="inline-flex items-center gap-1 bg-muted rounded-md px-2 py-0.5 text-xs font-medium">
                    {a.label}
                    <button onClick={() => removeAssignee(a.id)} className="text-muted-foreground hover:text-foreground ml-0.5">
                      <X size={10} />
                    </button>
                  </span>
                ))}
                <input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => { setInputValue(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  onKeyDown={handleInputKeyDown}
                  placeholder={assignees.length === 0 ? "Enter team, member name, or external email" : ""}
                  className="flex-1 min-w-[120px] bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
              {showSuggestions && (filteredUsers.length > 0 || filteredTeams.length > 0) && (
                <div className="border rounded-md bg-popover shadow-md max-h-[160px] overflow-y-auto">
                  {filteredTeams.map((t) => (
                    <button key={t.id} onMouseDown={(e) => e.preventDefault()} onClick={() => addAssignee(t.id, `${t.name} (${t.count})`)} className="w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center gap-2">
                      <span className="h-5 w-5 rounded bg-primary/15 flex items-center justify-center text-[8px] font-bold text-primary">T</span>
                      <span>{t.name}</span>
                      <span className="text-muted-foreground text-xs">({t.count})</span>
                    </button>
                  ))}
                  {filteredUsers.map((u) => (
                    <button key={u.id} onMouseDown={(e) => e.preventDefault()} onClick={() => addAssignee(u.id, u.email.split("@")[0] + "@" + u.email.split("@")[1].split(".")[0])} className="w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center gap-2">
                      <span className="h-5 w-5 rounded-full bg-primary/15 flex items-center justify-center text-[8px] font-bold text-primary">
                        {u.name.split(" ").map((n) => n[0]).join("")}
                      </span>
                      <span>{u.name}</span>
                      <span className="text-muted-foreground text-xs">{u.email}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="w-[120px] space-y-1.5 flex-shrink-0">
              <Label className="text-xs font-medium">Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="h-[38px] text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="reviewer">Reviewer</SelectItem>
                  <SelectItem value="approver">Approver</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5">
              <Label className="text-xs font-medium">Permission level</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info size={12} className="text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs max-w-[200px]">Set what assignees can do</TooltipContent>
              </Tooltip>
            </div>
            <div className="relative px-1">
              <div className="h-[2px] bg-border rounded-full relative">
                <div className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all" style={{ width: `${(permissionIndex / (PERMISSION_LEVELS.length - 1)) * 100}%` }} />
              </div>
              <div className="flex justify-between -mt-[5px]">
                {PERMISSION_LEVELS.map((level, i) => (
                  <button key={level} onClick={() => setPermissionIndex(i)} className="flex flex-col items-center gap-1.5 group">
                    <div className={cn("h-[10px] w-[10px] rounded-full border-2 transition-all", i <= permissionIndex ? "border-primary bg-primary" : "border-muted-foreground/40 bg-card")} />
                    <span className={cn("text-[11px] transition-colors", i === permissionIndex ? "text-primary font-semibold" : "text-muted-foreground")}>{level}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Textarea placeholder="Message (optional)" value={message} onChange={(e) => setMessage(e.target.value)} className="min-h-[72px] text-sm resize-none" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" disabled={assignees.length === 0} onClick={() => { toast.success("Task assigned"); onOpenChange(false); setAssignees([]); setMessage(""); }}>Assign</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/* ── Share Dialog ── */
const ShareDialog = ({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => { setCopied(true); toast.success("Link copied"); setTimeout(() => setCopied(false), 2000); };

  const PERMISSION_LEVELS = [
    { value: "manage", label: "Manage", description: "Full control, same as owner" },
    { value: "edit", label: "Edit", description: "Can edit document content" },
    { value: "comment", label: "Comment", description: "Can add comments only" },
    { value: "view", label: "View", description: "Read-only access" },
  ];

  const [people, setPeople] = useState([
    { name: "Ahmed Al-Rashid", initials: "AA", color: "#4F46E5", permission: "manage" },
    { name: "Sarah Johnson", initials: "SJ", color: "#DC2626", permission: "edit" },
    { name: "Mohammed Al-Faisal", initials: "MA", color: "#059669", permission: "comment" },
  ]);

  const handlePermissionChange = (idx: number, value: string) => {
    setPeople(prev => prev.map((p, i) => i === idx ? { ...p, permission: value } : p));
  };

  const handleRemove = (idx: number) => {
    if (people[idx].permission === "manage") return;
    setPeople(prev => prev.filter((_, i) => i !== idx));
    toast("Access removed");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Share Document</DialogTitle>
          <DialogDescription>Invite people or copy a link to share this document.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Invite row */}
          <div className="flex gap-2">
            <Input placeholder="Email or name" className="h-9 text-sm flex-1" />
            <Select defaultValue="view">
              <SelectTrigger className="h-9 text-sm w-[110px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PERMISSION_LEVELS.map(p => (
                  <SelectItem key={p.value} value={p.value}>
                    <div>
                      <span className="text-sm">{p.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" className="h-9">Invite</Button>
          </div>

          {/* People list */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground mb-2">People with access</p>
            {people.map((p, idx) => (
              <div key={p.name} className="flex items-center gap-2 group rounded-md px-1 py-1.5 hover:bg-muted/50 -mx-1">
                <div
                  className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-semibold text-white flex-shrink-0"
                  style={{ backgroundColor: p.color }}
                >
                  {p.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm truncate block">{p.name}</span>
                </div>
                <Select value={p.permission} onValueChange={(v) => handlePermissionChange(idx, v)}>
                  <SelectTrigger className="h-7 text-xs w-[100px] border-0 bg-transparent hover:bg-muted shadow-none">
                    <SelectValue>
                      {PERMISSION_LEVELS.find(l => l.value === p.permission)?.label}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent align="end" className="w-[200px]">
                    {PERMISSION_LEVELS.map(level => (
                      <SelectItem key={level.value} value={level.value} className="py-2">
                        <span className="text-sm font-medium">{level.label}</span>
                        <p className="text-[10px] text-muted-foreground leading-tight">{level.description}</p>
                      </SelectItem>
                    ))}
                    {p.permission !== "manage" && (
                      <>
                        <div className="border-t my-1" />
                        <button
                          onClick={() => handleRemove(idx)}
                          className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10 rounded-sm cursor-pointer"
                        >
                          <Trash2 size={12} /> Remove access
                        </button>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>

          {/* Copy link */}
          <div className="flex items-center gap-2 border rounded-lg p-2">
            <Link size={14} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground flex-1 truncate">https://app.signit.com/doc/msa-2026...</span>
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={handleCopy}>
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? "Copied" : "Copy link"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* ── Settings Dialog ── */
const SettingsDialog = ({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) => {
  const [expEnabled, setExpEnabled] = useState(false);
  const [expDate, setExpDate] = useState<Date>(addDays(new Date(), 30));
  const [reminders, setReminders] = useState(true);
  const [reminderFreq, setReminderFreq] = useState("3");
  const [language, setLanguage] = useState("en");
  const [allowDecline, setAllowDecline] = useState(true);
  const [allowDelegate, setAllowDelegate] = useState(false);
  const [requireAll, setRequireAll] = useState(true);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sending Settings</DialogTitle>
          <DialogDescription>Configure how this document is sent and signed.</DialogDescription>
        </DialogHeader>
        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Set expiration</Label>
              <Switch checked={expEnabled} onCheckedChange={setExpEnabled} />
            </div>
            {expEnabled && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left h-9 text-sm">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(expDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={expDate} onSelect={(d) => d && setExpDate(d)} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Send automatic reminders</Label>
              <Switch checked={reminders} onCheckedChange={setReminders} />
            </div>
            {reminders && (
              <Select value={reminderFreq} onValueChange={setReminderFreq}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Daily</SelectItem>
                  <SelectItem value="3">Every 3 days</SelectItem>
                  <SelectItem value="5">Every 5 days</SelectItem>
                  <SelectItem value="7">Every 7 days</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ar">Arabic</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Custom message</Label>
            <Textarea placeholder="Add a personal message to include in the signing notification email" className="min-h-[60px] text-sm resize-none" />
          </div>
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Signing settings</p>
            <div className="flex items-center justify-between">
              <Label className="text-sm font-normal">Allow signers to decline</Label>
              <Switch checked={allowDecline} onCheckedChange={setAllowDecline} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm font-normal">Allow signers to delegate</Label>
              <Switch checked={allowDelegate} onCheckedChange={setAllowDelegate} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm font-normal">Require all fields to be filled</Label>
              <Switch checked={requireAll} onCheckedChange={setRequireAll} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={() => { toast.success("Settings saved"); onOpenChange(false); }}>Save settings</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/* ── Tag Popover ── */
const TagPopover = ({
  activeTags,
  onToggleTag,
  onCreateTag,
}: {
  activeTags: string[];
  onToggleTag: (id: string) => void;
  onCreateTag: (name: string) => void;
}) => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const filtered = MOCK_TAGS.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()));
  const noMatch = search.trim() && filtered.length === 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground border border-dashed border-muted-foreground/30 rounded-md transition-colors flex items-center gap-1">
          <Plus size={10} />
          Add tag
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-0" align="start" sideOffset={6}>
        <div className="border-b px-3 py-2">
          <div className="flex items-center gap-2">
            <Search size={12} className="text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search or create tag..."
              className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
              autoFocus
            />
          </div>
        </div>
        <div className="max-h-[200px] overflow-y-auto p-1">
          {filtered.map((tag) => {
            const isActive = activeTags.includes(tag.id);
            return (
              <button
                key={tag.id}
                onClick={() => onToggleTag(tag.id)}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent"
              >
                <span className={cn("h-2.5 w-2.5 rounded-full flex-shrink-0", tag.color)} />
                <span className="flex-1 text-left truncate">{tag.name}</span>
                {isActive && <Check size={14} className="text-primary flex-shrink-0" />}
              </button>
            );
          })}
          {noMatch && (
            <button
              onClick={() => {
                onCreateTag(search.trim());
                setSearch("");
                setOpen(false);
              }}
              className="w-full text-left px-2 py-1.5 text-sm text-primary hover:bg-accent rounded-sm"
            >
              Create "{search.trim()}"
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

/* ══════════ TOP BAR ══════════ */
const EditorTopBar = ({ onOpenFieldsPanel, isEsign, onToggleEsign, onOpenVersionHistory }: { onOpenFieldsPanel?: (participantId?: string) => void; isEsign?: boolean; onToggleEsign?: () => void; onOpenVersionHistory?: () => void }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { participants, placedFields, setDocumentAcknowledgments } = useEditorContext();
  const isMobile = useIsMobile();
  const isSmall = typeof window !== "undefined" && window.innerWidth < 1024;
  const [editingMode, setEditingMode] = useState<"editing" | "suggesting" | "viewing">("editing");

  const [title, setTitle] = useState("Untitled Document");
  const [editTitle, setEditTitle] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const [activeTags, setActiveTags] = useState<string[]>(["t1", "t5"]);
  const [allTags, setAllTags] = useState(MOCK_TAGS);

  const [assignOpen, setAssignOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [warningOpen, setWarningOpen] = useState(false);
  const [participantIssues, setParticipantIssues] = useState<ParticipantIssue[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const toggleTag = (id: string) => {
    setActiveTags((prev) => prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]);
  };

  const createTag = (name: string) => {
    const newId = `custom-${Date.now()}`;
    const colors = ["bg-pink-500", "bg-cyan-500", "bg-indigo-500", "bg-lime-500"];
    const newTag = { id: newId, name, color: colors[Math.floor(Math.random() * colors.length)] };
    setAllTags((prev) => [...prev, newTag]);
    setActiveTags((prev) => [...prev, newId]);
    toast.success("Tag added");
  };

  const removeTag = (id: string) => {
    setActiveTags((prev) => prev.filter((t) => t !== id));
  };

  const startEditTitle = () => {
    setEditTitle(title);
    setIsEditingTitle(true);
    setTimeout(() => titleInputRef.current?.select(), 0);
  };

  const saveTitle = () => {
    setTitle(editTitle.trim() || title);
    setIsEditingTitle(false);
  };

  const cancelTitle = () => {
    setIsEditingTitle(false);
  };

  const MOCK_DOCS = [
    { id: "d1", name: "Master Services Agreement 2026.pdf", documentType: "primary" as const },
  ];

  const handleSendClick = () => {
    const signers = participants.filter((p) => p.role === "signer");
    const issues: ParticipantIssue[] = [];
    for (const signer of signers) {
      const signerIssues: DocumentIssue[] = [];
      const signerFields = placedFields.filter((f) => f.participantId === signer.id);
      const primaryDocs = MOCK_DOCS.filter((d) => d.documentType === "primary");
      for (const doc of primaryDocs) {
        if (signerFields.length === 0) {
          signerIssues.push({ documentId: doc.id, documentName: doc.name, documentType: doc.documentType, issueType: "no_fields_primary" });
        }
      }
      if (signerIssues.length > 0) {
        issues.push({ participant: signer, issues: signerIssues });
      }
    }
    if (issues.length > 0) {
      setParticipantIssues(issues);
      setWarningOpen(true);
    } else {
      setSendOpen(true);
    }
  };

  const activeTagObjects = activeTags
    .map((id) => [...MOCK_TAGS, ...allTags.filter((t) => !MOCK_TAGS.find((m) => m.id === t.id))].find((t) => t.id === id))
    .filter(Boolean) as typeof MOCK_TAGS;

  const visibleTags = isSmall ? [] : activeTagObjects.slice(0, 2);
  const overflowCount = isSmall ? activeTagObjects.length : Math.max(0, activeTagObjects.length - 2);

  return (
    <>
      <header className="h-[52px] border-b flex items-center px-4 flex-shrink-0 bg-card">
        {/* ── LEFT ── */}
        <div className="flex items-center gap-2 min-w-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => { toast("Saved as draft"); navigate("/workspace"); }}>
                <X size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Save as draft and close</TooltipContent>
          </Tooltip>

          <div className="h-5 w-px bg-border mx-1 flex-shrink-0" />

          {isEditingTitle ? (
            <input
              ref={titleInputRef}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveTitle();
                if (e.key === "Escape") cancelTitle();
              }}
              className={cn(
                "text-sm font-semibold bg-transparent outline-none border-none rounded-md px-2 py-1",
                "ring-1 ring-ring",
                "max-w-[240px] lg:max-w-[240px]"
              )}
              style={{ width: `${Math.max(60, editTitle.length * 7.5 + 20)}px` }}
              autoFocus
            />
          ) : (
            <button
              onClick={startEditTitle}
              className="text-sm font-semibold truncate max-w-[160px] lg:max-w-[240px] hover:bg-muted/50 rounded-md px-2 py-1 cursor-text transition-colors"
            >
              {title}
            </button>
          )}

          <span className="bg-muted text-muted-foreground text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0">
            Draft
          </span>

          {/* Editing mode dropdown (Google Docs style) */}
          {!isEsign && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="hidden md:inline-flex items-center gap-1 h-7 px-2.5 rounded-md border bg-muted/50 text-xs font-medium text-foreground hover:bg-muted transition-colors ml-2 flex-shrink-0">
                  <HugeiconsIcon
                    icon={PencilEdit01Icon}
                    size={13}
                    className={cn(
                      editingMode === "editing" && "text-foreground",
                      editingMode === "suggesting" && "text-primary",
                      editingMode === "viewing" && "text-muted-foreground"
                    )}
                  />
                  <span>{editingMode === "editing" ? "Editing" : editingMode === "suggesting" ? "Suggesting" : "Viewing"}</span>
                  <ChevronDown size={12} className="text-muted-foreground ml-0.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem
                  onClick={() => setEditingMode("editing")}
                  className={cn("gap-3", editingMode === "editing" && "bg-accent")}
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">Editing</p>
                    <p className="text-[11px] text-muted-foreground">Edit document directly</p>
                  </div>
                  {editingMode === "editing" && <Check size={14} className="text-primary flex-shrink-0" />}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setEditingMode("suggesting");
                    toast("Suggesting mode — your changes will appear as suggestions");
                  }}
                  className={cn("gap-3", editingMode === "suggesting" && "bg-accent")}
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">Suggesting</p>
                    <p className="text-[11px] text-muted-foreground">Suggest changes for review</p>
                  </div>
                  {editingMode === "suggesting" && <Check size={14} className="text-primary flex-shrink-0" />}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setEditingMode("viewing");
                    toast("View only mode");
                  }}
                  className={cn("gap-3", editingMode === "viewing" && "bg-accent")}
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">Viewing</p>
                    <p className="text-[11px] text-muted-foreground">Read-only, no edits allowed</p>
                  </div>
                  {editingMode === "viewing" && <Check size={14} className="text-primary flex-shrink-0" />}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Tags */}
          <div className="hidden sm:flex items-center gap-1 ml-2">
            {visibleTags.map((tag) => (
              <span key={tag.id} className="group inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium bg-muted text-muted-foreground">
                <span className={cn("h-1.5 w-1.5 rounded-full", tag.color)} />
                {tag.name}
                <button onClick={() => removeTag(tag.id)} className="opacity-0 group-hover:opacity-100 transition-opacity ml-0.5">
                  <X size={8} />
                </button>
              </span>
            ))}
            {overflowCount > 0 && (
              <span className="text-[10px] text-muted-foreground px-1">+{overflowCount}</span>
            )}
            <TagPopover activeTags={activeTags} onToggleTag={toggleTag} onCreateTag={createTag} />
          </div>
        </div>

        {/* ── CENTER ── */}
        <div className="flex-1 hidden lg:flex items-center justify-center">
          {onToggleEsign && (
            <div className="flex flex-col items-center gap-0.5">
              <div className="flex items-center h-6 rounded-md border bg-muted/50 p-0.5">
                <button
                  onClick={!isEsign ? undefined : onToggleEsign}
                  className={cn(
                    "h-5 px-2.5 rounded text-[10px] font-medium transition-all",
                    !isEsign ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  CLM
                </button>
                <button
                  onClick={isEsign ? undefined : onToggleEsign}
                  className={cn(
                    "h-5 px-2.5 rounded text-[10px] font-medium transition-all",
                    isEsign ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  eSign
                </button>
              </div>
              <span className="text-[9px] text-muted-foreground italic">(Demo mode switch)</span>
            </div>
          )}
        </div>

        {/* ── RIGHT ── */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <HugeiconsIcon icon={MoreVerticalIcon} size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {!isEsign && (
                <>
                  <DropdownMenuItem onClick={() => setShareOpen(true)}>
                    <HugeiconsIcon icon={Share01Icon} size={14} className="mr-2" />
                    Share
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuItem onClick={() => toast.success("Document duplicated")}>
                <HugeiconsIcon icon={Copy01Icon} size={14} className="mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.success("Exporting PDF...")}>
                <HugeiconsIcon icon={Download01Icon} size={14} className="mr-2" />
                Export PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onOpenVersionHistory?.()}>
                <Clock size={14} className="mr-2" />
                Version history
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                <HugeiconsIcon icon={Settings02Icon} size={14} className="mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setShowDeleteDialog(true)}>
                <HugeiconsIcon icon={Delete02Icon} size={14} className="mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {!isEsign && (
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => setAssignOpen(true)}>
              <HugeiconsIcon icon={UserAdd01Icon} size={14} />
              {!isMobile && "Assign"}
            </Button>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" className="h-9 px-5 rounded-lg font-medium text-sm gap-1.5 ml-1" onClick={handleSendClick}>
                <HugeiconsIcon icon={SentIcon} size={14} />
                {!isMobile && <span>Send</span>}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Send for signature</TooltipContent>
          </Tooltip>
        </div>
      </header>

      <AssignDialog open={assignOpen} onOpenChange={setAssignOpen} />
      <ShareDialog open={shareOpen} onOpenChange={setShareOpen} />
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <ReviewSendDialog open={sendOpen} onOpenChange={setSendOpen} />
      <MissingFieldsWarningDialog
        open={warningOpen}
        onOpenChange={setWarningOpen}
        participantIssues={participantIssues}
        onGoBack={() => setWarningOpen(false)}
        onContinue={() => { setWarningOpen(false); setSendOpen(true); }}
      />

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete document?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. This document will be permanently deleted.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => { toast.success("Document deleted"); navigate("/"); }}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EditorTopBar;
