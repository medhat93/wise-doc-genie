import { useState } from "react";
import { useEditorContext } from "./EditorContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Plus,
  Minus,
  Mail,
  Phone,
  MessageSquare,
  Pencil,
  Trash2,
  User,
  Users,
  Shield,
  GripVertical,
} from "lucide-react";
import { toast } from "sonner";
import type { Participant, ParticipantRole, SendingMethod } from "./EditorParticipantsPanel";
import AddParticipantDialog from "./AddParticipantDialog";

const ROLE_STYLES: Record<ParticipantRole, { label: string; className: string }> = {
  signer: { label: "Signer", className: "bg-[hsl(var(--brand-indigo))]/15 text-[hsl(var(--brand-indigo))] border-[hsl(var(--brand-indigo))]/30" },
  approver: { label: "Approver", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" },
  viewer: { label: "Viewer", className: "bg-muted text-muted-foreground border-border" },
  cc: { label: "CC", className: "bg-muted text-muted-foreground border-border" },
};

const VERIFICATION_METHOD_LABELS: Record<string, string> = {
  sms: "SMS",
  whatsapp: "WhatsApp",
  absher: "Absher",
  nafath_only: "Nafath only",
  nafath_digital: "Nafath & Digital certificate",
};

const VERIFICATION_SPECS_LABELS: Record<string, string> = {
  without_id: "Without national ID",
  with_id: "With national ID",
  with_id_biometrics: "With national ID & Biometrics",
};

const hasSpecs = (method?: string) => method === "nafath_only" || method === "nafath_digital";

const getSendingIcon = (method: SendingMethod) => {
  if (method === "sms") return <Phone size={10} className="flex-shrink-0" />;
  if (method === "whatsapp") return <MessageSquare size={10} className="flex-shrink-0" />;
  return <Mail size={10} className="flex-shrink-0" />;
};

const getVerificationSummary = (p: Participant) => {
  if (!p.needsVerification || !p.verificationMethod) return null;
  const method = VERIFICATION_METHOD_LABELS[p.verificationMethod] || p.verificationMethod;
  if (hasSpecs(p.verificationMethod) && p.verificationSpecs) {
    return `${method} · ${VERIFICATION_SPECS_LABELS[p.verificationSpecs] || p.verificationSpecs}`;
  }
  return method;
};

const EditorParticipantsViewPanel = () => {
  const { participants, setParticipants } = useEditorContext();
  const [sequential, setSequential] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  const signers = participants.filter(p => p.role === "signer").sort((a, b) => a.order - b.order);
  const approvers = participants.filter(p => p.role === "approver");
  const viewers = participants.filter(p => p.role === "viewer" || p.role === "cc");

  const removeParticipant = (id: string) => {
    setParticipants(prev => prev.filter(p => p.id !== id));
    setConfirmRemoveId(null);
    toast.success("Participant removed");
  };

  const renderCard = (p: Participant) => {
    const roleStyle = ROLE_STYLES[p.role];
    const verifySummary = getVerificationSummary(p);

    if (confirmRemoveId === p.id) {
      return (
        <div key={p.id} className="border border-destructive/50 rounded-lg p-3 space-y-2 animate-in fade-in duration-150">
          <p className="text-xs">Remove <span className="font-medium">{p.name}</span>?</p>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="destructive" className="h-6 text-[10px]" onClick={() => removeParticipant(p.id)}>Remove</Button>
            <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => setConfirmRemoveId(null)}>Cancel</Button>
          </div>
        </div>
      );
    }

    return (
      <div key={p.id} className="border rounded-lg p-2.5 space-y-1.5 hover:bg-muted/30 transition-colors">
        {/* Row 1: Name + actions */}
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
            <span className="text-sm font-medium truncate">{p.name}</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0">
                <MoreHorizontal size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="gap-2 text-xs" onClick={() => setEditingParticipant(p)}>
                <Pencil size={12} /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 text-xs text-destructive" onClick={() => setConfirmRemoveId(p.id)}>
                <Trash2 size={12} /> Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Row 2: Contact + badges */}
        <div className="flex items-center gap-1.5 flex-wrap pl-4">
          <span className="text-[11px] text-muted-foreground truncate">
            {p.sendingMethod === "email" ? p.email : p.sendingPhone || ""}
          </span>
        </div>
        <div className="flex items-center gap-1 flex-wrap pl-4">
          <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 h-4 font-medium border", roleStyle.className)}>
            {roleStyle.label}
          </Badge>
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 font-medium border gap-1 flex items-center">
            {getSendingIcon(p.sendingMethod)}
            {p.sendingMethod === "email" ? "Email" : p.sendingMethod === "sms" ? "SMS" : "WhatsApp"}
          </Badge>
          {verifySummary && (
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 font-medium border gap-1 flex items-center">
              <Shield size={9} /> {verifySummary}
            </Badge>
          )}
        </div>
      </div>
    );
  };

  const renderSequentialList = () => {
    const signersByOrder = new Map<number, Participant[]>();
    signers.forEach(s => {
      if (!signersByOrder.has(s.order)) signersByOrder.set(s.order, []);
      signersByOrder.get(s.order)!.push(s);
    });
    const steps = Array.from(signersByOrder.entries()).sort(([a], [b]) => a - b);

    return (
      <div className="space-y-3">
        {approvers.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Step 0 — Approval</p>
              <div className="flex-1 h-px bg-border" />
            </div>
            {approvers.map(a => renderCard(a))}
          </div>
        )}
        {steps.map(([stepNum, stepParticipants]) => (
          <div key={stepNum} className="space-y-1.5">
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Step {stepNum}</p>
              {stepParticipants.length > 1 && (
                <span className="text-[10px] text-muted-foreground italic whitespace-nowrap">Parallel</span>
              )}
              <div className="flex-1 h-px bg-border" />
            </div>
            {stepParticipants.map(s => renderCard(s))}
          </div>
        ))}
        {viewers.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">No signing required</p>
              <div className="flex-1 h-px bg-border" />
            </div>
            {viewers.map(v => renderCard(v))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4 pb-6">
      {/* Sequential signing toggle */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Sequential signing</p>
          <Switch checked={sequential} onCheckedChange={setSequential} />
        </div>
        <p className="text-xs text-muted-foreground">
          {sequential ? "Signers receive documents in order" : "All signers receive at the same time"}
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
      ) : sequential ? (
        renderSequentialList()
      ) : (
        <div className="space-y-2">
          {participants.map(p => renderCard(p))}
        </div>
      )}

      {/* Add participant button */}
      <Button
        variant="outline"
        size="sm"
        className="h-8 text-xs gap-1.5 w-full"
        onClick={() => setAddDialogOpen(true)}
      >
        <Plus size={14} />
        Add new participant
      </Button>

      {/* Dialogs */}
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
