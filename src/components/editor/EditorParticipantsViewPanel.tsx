import { useState, useCallback } from "react";
import ParticipantsDialog from "@/components/ParticipantsDialog";
import { useEditorContext } from "./EditorContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  Mail,
  MessageCircle,
  MessageSquare,
  Pencil,
  Trash2,
  Users,
  Shield,
  GripVertical,
} from "lucide-react";
import { toast } from "sonner";
import type { Participant, ParticipantRole, SendingMethod } from "./EditorParticipantsPanel";
import AddParticipantDialog from "./AddParticipantDialog";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const ROLE_STYLES: Record<ParticipantRole, { label: string; className: string }> = {
  signer: { label: "Signer", className: "bg-[hsl(var(--brand-indigo))]/15 text-[hsl(var(--brand-indigo))] border-[hsl(var(--brand-indigo))]/30" },
  approver: { label: "Approver", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" },
  viewer: { label: "Viewer", className: "bg-muted text-muted-foreground border-border" },
  cc: { label: "CC", className: "bg-muted text-muted-foreground border-border" },
};

const SENDING_TOOLTIPS: Record<SendingMethod, string> = {
  email: "Will receive via Email",
  sms: "Will receive via SMS",
  whatsapp: "Will receive via WhatsApp",
};

const VERIFICATION_METHOD_LABELS: Record<string, string> = {
  sms: "SMS",
  whatsapp: "WhatsApp",
  absher: "Absher",
  nafath_only: "Nafath",
  nafath_digital: "Nafath & Digital cert.",
};

const getSendingIcon = (method: SendingMethod) => {
  if (method === "sms") return MessageCircle;
  if (method === "whatsapp") return MessageSquare;
  return Mail;
};

/* ── Sortable participant card ── */
const SortableParticipantCard = ({
  participant,
  workflowEnabled,
  index,
  onEdit,
  onRemove,
  confirmRemoveId,
  setConfirmRemoveId,
}: {
  participant: Participant;
  workflowEnabled: boolean;
  index: number;
  onEdit: (p: Participant) => void;
  onRemove: (id: string) => void;
  confirmRemoveId: string | null;
  setConfirmRemoveId: (id: string | null) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: participant.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const roleStyle = ROLE_STYLES[participant.role];
  const SendIcon = getSendingIcon(participant.sendingMethod);
  const hasVerification = participant.needsVerification && participant.verificationMethod;

  if (confirmRemoveId === participant.id) {
    return (
      <div className="border border-destructive/50 rounded-lg p-3 space-y-2 animate-in fade-in duration-150">
        <p className="text-xs">Remove <span className="font-medium">{participant.name}</span>?</p>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="destructive" className="h-6 text-[10px]" onClick={() => onRemove(participant.id)}>Remove</Button>
          <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => setConfirmRemoveId(null)}>Cancel</Button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2.5 rounded-lg border p-2.5 transition-colors group/card",
        isDragging && "opacity-50 shadow-lg z-50",
        "hover:bg-muted/30"
      )}
    >
      {/* Drag handle + order number */}
      {workflowEnabled && (
        <div className="flex items-center gap-1 flex-shrink-0">
          <button {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground -ml-0.5">
            <GripVertical size={14} />
          </button>
          <span className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
            {index + 1}
          </span>
        </div>
      )}

      {/* Color dot (no workflow) */}
      {!workflowEnabled && (
        <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: participant.color }} />
      )}

      {/* Name + role badge + contact */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <p className="text-xs font-medium truncate">{participant.name}</p>
          <Badge variant="outline" className={cn("text-[8px] px-1 py-0 h-3.5 font-medium border flex-shrink-0", roleStyle.className)}>
            {roleStyle.label}
          </Badge>
        </div>
        <p className="text-[10px] text-muted-foreground truncate">
          {participant.sendingMethod === "email" ? participant.email : participant.sendingPhone || ""}
        </p>
        {hasVerification && (
          <p className="text-[10px] text-muted-foreground truncate">
            Verify with: {VERIFICATION_METHOD_LABELS[participant.verificationMethod!] || participant.verificationMethod}
          </p>
        )}
      </div>

      {/* Icons with tooltips */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <span className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground">
              <SendIcon size={12} />
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">{SENDING_TOOLTIPS[participant.sendingMethod]}</TooltipContent>
        </Tooltip>

        {hasVerification && (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <span className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground">
                <Shield size={12} />
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">Identity verification enabled</TooltipContent>
          </Tooltip>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0 opacity-0 group-hover/card:opacity-100 transition-opacity">
              <MoreVertical size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="gap-2 text-xs" onClick={() => onEdit(participant)}>
              <Pencil size={12} /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 text-xs text-destructive" onClick={() => setConfirmRemoveId(participant.id)}>
              <Trash2 size={12} /> Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

/* ── Main panel ── */
const EditorParticipantsViewPanel = () => {
  const { participants, setParticipants } = useEditorContext();
  const [workflowEnabled, setWorkflowEnabled] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [participantsDialogOpen, setParticipantsDialogOpen] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const removeParticipant = useCallback((id: string) => {
    setParticipants(prev => prev.filter(p => p.id !== id));
    setConfirmRemoveId(null);
    toast.success("Participant removed");
  }, [setParticipants]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setParticipants(prev => {
      const oldIndex = prev.findIndex(p => p.id === active.id);
      const newIndex = prev.findIndex(p => p.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      const reordered = arrayMove(prev, oldIndex, newIndex);
      // Update order numbers to match new positions
      return reordered.map((p, i) => ({ ...p, order: i + 1 }));
    });
  }, [setParticipants]);

  const sortedParticipants = workflowEnabled
    ? [...participants].sort((a, b) => a.order - b.order)
    : participants;

  return (
    <div className="flex flex-col gap-4 pb-6">
      {/* Manage participants button */}
      <Button
        variant="outline"
        size="sm"
        className="h-8 text-xs w-full"
        onClick={() => setParticipantsDialogOpen(true)}
      >
        Manage participants
      </Button>

      {/* Workflow toggle */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Workflow</p>
          <Switch checked={workflowEnabled} onCheckedChange={setWorkflowEnabled} />
        </div>
        <p className="text-xs text-muted-foreground">
          {workflowEnabled ? "Drag to reorder signing sequence" : "All receive documents simultaneously"}
        </p>
      </div>

      <Separator />

      {/* Participant list */}
      {participants.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <Users size={40} className="text-muted-foreground opacity-40" />
          <p className="text-sm font-medium">No participants yet</p>
          <p className="text-xs text-muted-foreground text-center">Add signers, approvers, or viewers</p>
        </div>
      ) : workflowEnabled ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sortedParticipants.map(p => p.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {sortedParticipants.map((p, i) => (
                <SortableParticipantCard
                  key={p.id}
                  participant={p}
                  workflowEnabled={workflowEnabled}
                  index={i}
                  onEdit={setEditingParticipant}
                  onRemove={removeParticipant}
                  confirmRemoveId={confirmRemoveId}
                  setConfirmRemoveId={setConfirmRemoveId}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="space-y-2">
          {participants.map((p, i) => (
            <SortableParticipantCard
              key={p.id}
              participant={p}
              workflowEnabled={false}
              index={i}
              onEdit={setEditingParticipant}
              onRemove={removeParticipant}
              confirmRemoveId={confirmRemoveId}
              setConfirmRemoveId={setConfirmRemoveId}
            />
          ))}
        </div>
      )}

      {/* Participants Dialog */}
      <ParticipantsDialog
        open={participantsDialogOpen}
        onOpenChange={setParticipantsDialogOpen}
        fromEditor
      />

      {/* Edit dialog */}
      <AddParticipantDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
      />
      <AddParticipantDialog
        open={!!editingParticipant}
        onOpenChange={(open) => { if (!open) setEditingParticipant(null); }}
        editParticipant={editingParticipant}
      />
    </div>
  );
};

export default EditorParticipantsViewPanel;