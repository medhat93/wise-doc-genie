import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ReviewSendDialog from "./ReviewSendDialog";
import MissingFieldsWarningDialog from "./MissingFieldsWarningDialog";
import { useEditorContext } from "./EditorContext";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  UserAdd01Icon,
  Settings02Icon,
  MoreHorizontalIcon,
  Tick01Icon,
  SentIcon,
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
import { CalendarIcon, Check, Copy, Link, Trash2, Share2, FileDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/* ── Assign Dialog ── */
const MOCK_USERS = [
  { id: "u1", name: "Ahmed Al-Rashid", email: "ahmed@company.com" },
  { id: "u2", name: "Sarah Johnson", email: "sarah@company.com" },
  { id: "u3", name: "Mohammed Al-Faisal", email: "mohammed@company.com" },
  { id: "u4", name: "Fatima Al-Zahra", email: "fatima@company.com" },
  { id: "u5", name: "David Chen", email: "david@company.com" },
];

const AssignDialog = ({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) => {
  const [assignee, setAssignee] = useState("");
  const [taskType, setTaskType] = useState("review");
  const [permission, setPermission] = useState("comment");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Assign Task</DialogTitle>
          <DialogDescription>Assign this document to a team member for review or approval.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-sm">Assignee</Label>
            <Select value={assignee} onValueChange={setAssignee}>
              <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select a person" /></SelectTrigger>
              <SelectContent>
                {MOCK_USERS.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.name} — {u.email}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Task type</Label>
            <Select value={taskType} onValueChange={setTaskType}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="approve">Approve</SelectItem>
                <SelectItem value="fill">Fill smart fields</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Permission level</Label>
            <div className="flex border rounded-lg overflow-hidden">
              {["view", "comment", "suggest", "edit"].map((p) => (
                <button
                  key={p}
                  onClick={() => setPermission(p)}
                  className={cn(
                    "flex-1 py-1.5 text-xs font-medium capitalize transition-colors",
                    permission === p ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Message (optional)</Label>
            <Textarea placeholder="Add a note for the assignee..." className="min-h-[60px] text-sm resize-none" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" disabled={!assignee} onClick={() => { toast.success("Task assigned"); onOpenChange(false); }}>Assign</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/* ── Share Dialog ── */
const ShareDialog = ({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => { setCopied(true); toast.success("Link copied"); setTimeout(() => setCopied(false), 2000); };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Share Document</DialogTitle>
          <DialogDescription>Invite people or copy a link to share this document.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex gap-2">
            <Input placeholder="Email or name" className="h-9 text-sm flex-1" />
            <Select defaultValue="view">
              <SelectTrigger className="h-9 text-sm w-[120px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="view">Can view</SelectItem>
                <SelectItem value="comment">Can comment</SelectItem>
                <SelectItem value="edit">Can edit</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" className="h-9">Invite</Button>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">People with access</p>
            {[
              { name: "Ahmed Al-Rashid", role: "Owner" },
              { name: "Sarah Johnson", role: "Can edit" },
            ].map((p) => (
              <div key={p.name} className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center text-[10px] font-semibold text-primary">
                  {p.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <span className="text-sm flex-1">{p.name}</span>
                <span className="text-xs text-muted-foreground">{p.role}</span>
              </div>
            ))}
          </div>

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
          {/* Expiration */}
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

          {/* Reminders */}
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

          {/* Language */}
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

          {/* Custom message */}
          <div className="space-y-1.5">
            <Label className="text-sm">Custom message</Label>
            <Textarea placeholder="Add a personal message to include in the signing notification email" className="min-h-[60px] text-sm resize-none" />
          </div>

          {/* Signing settings */}
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

/* ── Send Dialog is now in ReviewSendDialog.tsx ── */

/* ══════════ TOP BAR ══════════ */
const EditorTopBar = ({ onOpenFieldsPanel, isEsign, onToggleEsign }: { onOpenFieldsPanel?: (participantId?: string) => void; isEsign?: boolean; onToggleEsign?: () => void }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { participants, placedFields } = useEditorContext();
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const [title, setTitle] = useState("Untitled Document");
  const [assignOpen, setAssignOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [warningOpen, setWarningOpen] = useState(false);

  // Check for signers with no fields
  const signersWithNoFields = participants
    .filter((p) => p.role === "signer")
    .filter((p) => placedFields.filter((f) => f.participantId === p.id).length === 0);

  const handleSendClick = () => {
    if (signersWithNoFields.length > 0) {
      setWarningOpen(true);
    } else {
      setSendOpen(true);
    }
  };


  return (
    <>
      <header className="h-14 border-b flex items-center justify-between px-4 flex-shrink-0 bg-card">
        {/* Left */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => navigate("/participants")}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
          </Button>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="max-w-[200px] text-sm font-semibold border-none shadow-none focus-visible:ring-0 bg-transparent h-8"
          />
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 font-medium text-muted-foreground">
            Draft
          </Badge>

          {/* eSign / CLM mode switcher */}
          {onToggleEsign && (
            <div className="flex items-center h-7 rounded-md border bg-muted/50 p-0.5 ml-1">
              <button
                onClick={!isEsign ? undefined : onToggleEsign}
                className={cn(
                  "h-6 px-2.5 rounded text-[10px] font-medium transition-all",
                  !isEsign
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                CLM
              </button>
              <button
                onClick={isEsign ? undefined : onToggleEsign}
                className={cn(
                  "h-6 px-2.5 rounded text-[10px] font-medium transition-all",
                  isEsign
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                eSign
              </button>
            </div>
          )}
        </div>

        {/* Center — Step indicator */}
        <div className="hidden md:flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
              <HugeiconsIcon icon={Tick01Icon} size={12} className="text-primary-foreground" />
            </div>
            <span className="text-xs text-muted-foreground">Add Documents</span>
          </div>
          <div className="w-6 h-px bg-border" />
          <div className="flex items-center gap-1.5">
            <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
              <HugeiconsIcon icon={Tick01Icon} size={12} className="text-primary-foreground" />
            </div>
            <span className="text-xs text-muted-foreground">Add Participants</span>
          </div>
          <div className="w-6 h-px bg-border" />
          <div className="flex items-center gap-1.5">
            <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
              <span className="text-[10px] font-bold text-primary-foreground">3</span>
            </div>
            <span className="text-xs font-medium text-foreground">Prepare & Send</span>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-1.5 flex-1 justify-end">
          <Button variant="outline" size="sm" className="hidden sm:flex gap-1.5 h-8 text-xs" onClick={() => setAssignOpen(true)}>
            <HugeiconsIcon icon={UserAdd01Icon} size={14} />
            Assign
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSettingsOpen(true)}>
                <HugeiconsIcon icon={Settings02Icon} size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Settings</TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <HugeiconsIcon icon={MoreHorizontalIcon} size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShareOpen(true)}>
                <Share2 size={14} className="mr-2" /> Share
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.success("Document duplicated")}>
                <Copy size={14} className="mr-2" /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.success("PDF exported")}>
                <FileDown size={14} className="mr-2" /> Export PDF
              </DropdownMenuItem>
              {isMobile && (
                <DropdownMenuItem onClick={() => setAssignOpen(true)}>Assign</DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => toast("Document deleted")}>
                <Trash2 size={14} className="mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" className="h-8 text-xs ml-1 gap-1.5" onClick={handleSendClick}>
                <HugeiconsIcon icon={SentIcon} size={14} />
                Send
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
        affectedParticipants={signersWithNoFields}
        allSignersAffected={signersWithNoFields.length === participants.filter(p => p.role === "signer").length}
        onGoBack={() => {
          setWarningOpen(false);
          const first = signersWithNoFields[0];
          if (first && onOpenFieldsPanel) {
            onOpenFieldsPanel(first.id);
          }
        }}
        onSendAnyway={() => {
          setWarningOpen(false);
          setSendOpen(true);
        }}
      />
    </>
  );
};

export default EditorTopBar;
