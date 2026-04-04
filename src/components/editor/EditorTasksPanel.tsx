import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ClipboardList,
  Check,
  Circle,
  ChevronDown,
  Plus,
  X,
  Clock,
  User,
} from "lucide-react";
import { toast } from "sonner";

/* ── Mock data ── */
const CURRENT_TASK = {
  type: "Approve" as const,
  step: "Step 2 — Legal Review",
  assignedBy: "Mohammed Al-Faisal",
  assignedDate: "April 4, 2026",
  instructions: "Please review all clauses in Section 3 and confirm compliance with the new regulatory requirements.",
};

const TIMELINE = [
  { step: 0, name: "Drafting", assignee: "You", status: "completed" as const },
  { step: 1, name: "Legal Review", assignee: "Mohammed Al-Faisal", status: "current" as const },
  { step: 2, name: "Manager Approval", assignee: "Unassigned", status: "upcoming" as const },
];

const PENDING_TASKS = [
  { id: "1", type: "Review", assignee: "Sarah Johnson", status: "In progress" as const },
  { id: "2", type: "Approve", assignee: "Adel Al-Dossary", status: "In progress" as const },
];

const HISTORY = [
  { id: "1", text: "Ahmed Al-Rashid approved the document", time: "April 3, 2026, 2:30 PM", message: null },
  { id: "2", text: "Sarah Johnson submitted review", time: "April 2, 2026, 11:00 AM", message: "Looks good, minor formatting changes needed" },
];

type TaskType = "Approve" | "Review" | "Fill smart fields";

const typeBadgeColor: Record<TaskType, string> = {
  Approve: "bg-primary/10 text-primary border-primary/20",
  Review: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  "Fill smart fields": "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
};

const EditorTasksPanel = () => {
  const [assignOpen, setAssignOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [cancelId, setCancelId] = useState<string | null>(null);

  const [assignForm, setAssignForm] = useState({ assignee: "", type: "" as string, instructions: "" });

  const handleApprove = () => setConfirmOpen(true);
  const handleConfirmApprove = () => {
    setConfirmOpen(false);
    toast.success("Document approved");
  };
  const handleReject = () => setRejectOpen(true);
  const handleConfirmReject = () => {
    setRejectOpen(false);
    setRejectReason("");
    toast("Document returned with feedback");
  };
  const handleAssign = () => {
    setAssignOpen(false);
    setAssignForm({ assignee: "", type: "", instructions: "" });
    toast.success(`Task assigned to ${assignForm.assignee || "participant"}`);
  };
  const handleCancelTask = (id: string) => {
    setCancelId(null);
    toast("Task cancelled");
  };

  return (
    <div className="flex flex-col gap-4">
      {/* SECTION 1: Current Task */}
      <div className="rounded-lg border bg-primary/5 p-4 space-y-3">
        <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Current task</span>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn("text-xs", typeBadgeColor[CURRENT_TASK.type])}>
            {CURRENT_TASK.type}
          </Badge>
          <span className="text-xs text-muted-foreground">{CURRENT_TASK.step}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
            <User size={12} className="text-muted-foreground" />
          </div>
          <span className="text-sm">{CURRENT_TASK.assignedBy}</span>
          <span className="text-xs text-muted-foreground ml-auto">{CURRENT_TASK.assignedDate}</span>
        </div>
        {CURRENT_TASK.instructions && (
          <div className="rounded-md bg-muted/50 p-2.5 text-xs text-muted-foreground italic border border-border/50">
            "{CURRENT_TASK.instructions}"
          </div>
        )}
        <div className="flex gap-2 pt-1">
          <Button size="sm" className="flex-1" onClick={handleApprove}>Approve</Button>
          <Button size="sm" variant="outline" className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={handleReject}>Reject</Button>
        </div>
      </div>

      {/* SECTION 2: Timeline */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Timeline</span>
        <div className="relative pl-5 space-y-0">
          {TIMELINE.map((step, i) => (
            <div key={step.step} className="relative pb-4 last:pb-0">
              {/* Connector line */}
              {i < TIMELINE.length - 1 && (
                <div className="absolute left-[7px] top-[18px] bottom-0 w-px bg-border" />
              )}
              <div className="flex items-start gap-3">
                {/* Step circle */}
                <div className={cn(
                  "h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5",
                  step.status === "completed" && "bg-emerald-500 border-emerald-500",
                  step.status === "current" && "bg-primary border-primary",
                  step.status === "upcoming" && "bg-background border-muted-foreground/30",
                )}>
                  {step.status === "completed" && <Check size={10} className="text-white" />}
                  {step.status === "current" && <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm", step.status === "current" && "font-semibold")}>
                    {step.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{step.assignee}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* SECTION 3: Pending Tasks */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tasks you've sent</span>
          <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{PENDING_TASKS.length}</Badge>
        </div>
        <div className="space-y-1.5">
          {PENDING_TASKS.map((task) => (
            <div key={task.id} className="flex items-center gap-2 rounded-md border p-2 text-sm">
              <Badge variant="outline" className={cn("text-[10px]", typeBadgeColor[task.type as TaskType])}>
                {task.type}
              </Badge>
              <span className="flex-1 truncate text-sm">{task.assignee}</span>
              {cancelId === task.id ? (
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-muted-foreground">Cancel?</span>
                  <Button variant="ghost" size="sm" className="h-5 px-1.5 text-xs text-destructive" onClick={() => handleCancelTask(task.id)}>Yes</Button>
                  <Button variant="ghost" size="sm" className="h-5 px-1.5 text-xs" onClick={() => setCancelId(null)}>No</Button>
                </div>
              ) : (
                <>
                  <Badge variant="secondary" className="text-[10px]">
                    <Clock size={8} className="mr-1" />{task.status}
                  </Badge>
                  <button className="text-xs text-muted-foreground hover:text-destructive transition-colors" onClick={() => setCancelId(task.id)}>Cancel</button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* SECTION 4: History */}
      <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
        <CollapsibleTrigger className="flex items-center gap-2 w-full text-left">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">History</span>
          <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{HISTORY.length}</Badge>
          <ChevronDown size={12} className={cn("ml-auto text-muted-foreground transition-transform", historyOpen && "rotate-180")} />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 pt-2">
          {HISTORY.map((entry) => (
            <div key={entry.id} className="flex gap-2 text-sm">
              <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                <User size={10} className="text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">{entry.text}</p>
                <p className="text-[10px] text-muted-foreground">{entry.time}</p>
                {entry.message && (
                  <p className="text-xs text-muted-foreground italic mt-0.5">"{entry.message}"</p>
                )}
              </div>
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>

      {/* SECTION 5: Assign New Task */}
      <Separator />
      <Button variant="outline" className="w-full" onClick={() => setAssignOpen(true)}>
        <Plus size={14} className="mr-1.5" /> Assign a task
      </Button>

      {/* Approve confirmation */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Confirm Approval</DialogTitle></DialogHeader>
          <Textarea placeholder="Add an optional message..." className="min-h-[80px]" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirmApprove}>Approve</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Reject Document</DialogTitle></DialogHeader>
          <Textarea
            placeholder="Reason for rejection (required)..."
            className="min-h-[80px]"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <Select>
            <SelectTrigger><SelectValue placeholder="Return to..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="owner">Document owner</SelectItem>
              <SelectItem value="previous">Previous step</SelectItem>
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button variant="destructive" disabled={!rejectReason.trim()} onClick={handleConfirmReject}>Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign task dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Assign Task</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium mb-1 block">Assignee</label>
              <Select value={assignForm.assignee} onValueChange={(v) => setAssignForm(p => ({ ...p, assignee: v }))}>
                <SelectTrigger><SelectValue placeholder="Select participant..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sarah Johnson">Sarah Johnson</SelectItem>
                  <SelectItem value="Mohammed Al-Faisal">Mohammed Al-Faisal</SelectItem>
                  <SelectItem value="Adel Al-Dossary">Adel Al-Dossary</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Task type</label>
              <Select value={assignForm.type} onValueChange={(v) => setAssignForm(p => ({ ...p, type: v }))}>
                <SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Approve">Approve</SelectItem>
                  <SelectItem value="Review">Review</SelectItem>
                  <SelectItem value="Fill smart fields">Fill smart fields</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Instructions (optional)</label>
              <Textarea
                placeholder="Add instructions..."
                className="min-h-[60px]"
                value={assignForm.instructions}
                onChange={(e) => setAssignForm(p => ({ ...p, instructions: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button onClick={handleAssign} disabled={!assignForm.assignee || !assignForm.type}>Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EditorTasksPanel;
