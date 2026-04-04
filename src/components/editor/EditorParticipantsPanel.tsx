import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  MoreHorizontal,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Plus,
  Shield,
  Phone,
  Mail,
  CreditCard,
  Eye,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MOCK_DOCUMENTS } from "./EditorCanvas";

/* ── Types ── */
export type ParticipantRole = "signer" | "reviewer" | "approver" | "cc";
export type VerificationMethod = "email" | "sms" | "national_id";

export interface Participant {
  id: string;
  name: string;
  email: string;
  role: ParticipantRole;
  color: string;
  order: number;
  verification: VerificationMethod;
  phone?: string;
  nationalId?: string;
}

export type DocumentVisibility = Record<string, string[]>; // docId -> participantIds[]

const COLORS = [
  "#4F46E5", "#DC2626", "#059669", "#D97706",
  "#7C3AED", "#0891B2", "#BE185D", "#65A30D",
];

const ROLE_STYLES: Record<ParticipantRole, { label: string; className: string }> = {
  signer: { label: "Signer", className: "bg-[hsl(var(--brand-indigo))]/15 text-[hsl(var(--brand-indigo))] border-[hsl(var(--brand-indigo))]/30" },
  reviewer: { label: "Reviewer", className: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30" },
  approver: { label: "Approver", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" },
  cc: { label: "CC", className: "bg-muted text-muted-foreground border-border" },
};

const VERIFICATION_LABELS: Record<VerificationMethod, { label: string; icon: typeof Mail }> = {
  email: { label: "Email", icon: Mail },
  sms: { label: "SMS", icon: Phone },
  national_id: { label: "National ID", icon: CreditCard },
};

/* ── Mock data ── */
const INITIAL_PARTICIPANTS: Participant[] = [
  { id: "p1", name: "Ahmed Al-Rashid", email: "ahmed@signit.sa", role: "signer", color: COLORS[0], order: 1, verification: "email" },
  { id: "p2", name: "Sarah Johnson", email: "sarah@acme.com", role: "signer", color: COLORS[1], order: 2, verification: "sms", phone: "+1 555-0123" },
  { id: "p3", name: "Mohammed Al-Faisal", email: "mohammed@legal.sa", role: "approver", color: COLORS[2], order: 0, verification: "national_id", nationalId: "SA-1234567890" },
];

/* ── Sortable signer item ── */
const SortableSignerItem = ({ participant, index }: { participant: Participant; index: number }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: participant.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 px-2 py-1.5 rounded-md border bg-card text-sm",
        isDragging && "opacity-50 shadow-md"
      )}
    >
      <button {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground">
        <GripVertical size={14} />
      </button>
      <Badge variant="secondary" className="h-5 w-5 p-0 justify-center text-[10px] font-bold flex-shrink-0">
        {index + 1}
      </Badge>
      <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: participant.color }} />
      <span className="truncate flex-1 text-xs">{participant.name}</span>
    </div>
  );
};

/* ══════════ MAIN PANEL ══════════ */
const EditorParticipantsPanel = () => {
  const [participants, setParticipants] = useState<Participant[]>(INITIAL_PARTICIPANTS);
  const [nameInput, setNameInput] = useState("");
  const [roleInput, setRoleInput] = useState<ParticipantRole>("signer");
  const [sequential, setSequential] = useState(false);
  const [verificationOpen, setVerificationOpen] = useState(false);
  const [visibility, setVisibility] = useState<DocumentVisibility>(() => {
    const v: DocumentVisibility = {};
    MOCK_DOCUMENTS.forEach((d) => {
      v[d.id] = INITIAL_PARTICIPANTS.map((p) => p.id);
    });
    return v;
  });

  const visibilityRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  /* ── Helpers ── */
  const signers = participants.filter((p) => p.role === "signer").sort((a, b) => a.order - b.order);
  const approvers = participants.filter((p) => p.role === "approver");
  const nextColor = COLORS[participants.length % COLORS.length];

  const addParticipant = useCallback(() => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    const isEmail = trimmed.includes("@");
    const email = isEmail ? trimmed : "";
    const name = isEmail ? trimmed.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : trimmed;

    const newP: Participant = {
      id: `p${Date.now()}`,
      name,
      email: email || `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
      role: roleInput,
      color: nextColor,
      order: roleInput === "signer" ? signers.length + 1 : 0,
      verification: "email",
    };
    setParticipants((prev) => [...prev, newP]);
    setVisibility((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((docId) => {
        next[docId] = [...next[docId], newP.id];
      });
      return next;
    });
    setNameInput("");
  }, [nameInput, roleInput, nextColor, signers.length]);

  const removeParticipant = (id: string) => {
    setParticipants((prev) => prev.filter((p) => p.id !== id));
    setVisibility((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((docId) => {
        next[docId] = next[docId].filter((pid) => pid !== id);
      });
      return next;
    });
  };

  const updateVerification = (id: string, method: VerificationMethod) => {
    setParticipants((prev) => prev.map((p) => (p.id === id ? { ...p, verification: method } : p)));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = signers.findIndex((s) => s.id === active.id);
    const newIdx = signers.findIndex((s) => s.id === over.id);
    const reordered = arrayMove(signers, oldIdx, newIdx);
    setParticipants((prev) =>
      prev.map((p) => {
        const idx = reordered.findIndex((s) => s.id === p.id);
        return idx >= 0 ? { ...p, order: idx + 1 } : p;
      })
    );
  };

  const toggleDocVisibility = (docId: string, participantId: string) => {
    setVisibility((prev) => {
      const current = prev[docId] || [];
      const next = current.includes(participantId)
        ? current.filter((id) => id !== participantId)
        : [...current, participantId];
      return { ...prev, [docId]: next };
    });
  };

  return (
    <div className="flex flex-col gap-4 pb-6">
      {/* Header text */}
      <p className="text-xs text-muted-foreground">
        Add people who need to sign, review, or receive this document
      </p>

      {/* ── Section 1: Add participant ── */}
      <div className="flex items-center gap-1.5">
        <Input
          placeholder="Name or email"
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addParticipant()}
          className="h-8 text-xs flex-1"
        />
        <Select value={roleInput} onValueChange={(v) => setRoleInput(v as ParticipantRole)}>
          <SelectTrigger className="h-8 w-[90px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="signer" className="text-xs">Signer</SelectItem>
            <SelectItem value="reviewer" className="text-xs">Reviewer</SelectItem>
            <SelectItem value="approver" className="text-xs">Approver</SelectItem>
            <SelectItem value="cc" className="text-xs">CC</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" className="h-8 px-2.5" onClick={addParticipant} disabled={!nameInput.trim()}>
          <Plus size={14} />
        </Button>
      </div>

      <Separator />

      {/* ── Section 2: Participant list ── */}
      <div className="space-y-2">
        {participants.map((p) => {
          const roleStyle = ROLE_STYLES[p.role];
          const verifInfo = VERIFICATION_LABELS[p.verification];
          const VerifIcon = verifInfo.icon;
          return (
            <div key={p.id} className="border rounded-lg p-3 space-y-2">
              {/* Row 1 */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{p.email}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0">
                      <MoreHorizontal size={14} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Edit</DropdownMenuItem>
                    <DropdownMenuItem>Change role</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => removeParticipant(p.id)}>
                      Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Row 2 */}
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-4 font-medium border", roleStyle.className)}>
                  {roleStyle.label}
                </Badge>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-medium gap-1">
                  <VerifIcon size={10} />
                  {verifInfo.label}
                </Badge>
              </div>

              {/* Row 3: signing order for signers */}
              {p.role === "signer" && sequential && (
                <div className="flex items-center gap-1.5">
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                    Order: {p.order}
                  </Badge>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Separator />

      {/* ── Section 3: Signing order ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Sequential signing</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {sequential ? "Signers receive documents in order" : "All signers receive at the same time"}
            </p>
          </div>
          <Switch checked={sequential} onCheckedChange={setSequential} />
        </div>

        {sequential && (
          <div className="space-y-1.5">
            {/* Approvers locked at step 0 */}
            {approvers.map((a) => (
              <div key={a.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md border border-dashed bg-muted/30 text-sm opacity-70">
                <Shield size={14} className="text-muted-foreground" />
                <Badge variant="secondary" className="h-5 w-5 p-0 justify-center text-[10px] font-bold flex-shrink-0">0</Badge>
                <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: a.color }} />
                <span className="truncate flex-1 text-xs">{a.name}</span>
                <span className="text-[10px] text-muted-foreground">Approver</span>
              </div>
            ))}

            {/* Draggable signers */}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={signers.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                {signers.map((s, i) => (
                  <SortableSignerItem key={s.id} participant={s} index={i} />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        )}
      </div>

      <Separator />

      {/* ── Section 4: Verification settings ── */}
      <Collapsible open={verificationOpen} onOpenChange={setVerificationOpen}>
        <CollapsibleTrigger className="flex items-center gap-1.5 w-full text-sm font-medium hover:text-foreground transition-colors">
          {verificationOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          Verification settings
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3 space-y-3">
          {participants
            .filter((p) => p.role === "signer" || p.role === "approver")
            .map((p) => (
              <div key={p.id} className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="text-xs font-medium">{p.name}</span>
                </div>
                <div className="flex gap-1">
                  {(["email", "sms", "national_id"] as VerificationMethod[]).map((method) => {
                    const info = VERIFICATION_LABELS[method];
                    const Icon = info.icon;
                    const isActive = p.verification === method;
                    return (
                      <button
                        key={method}
                        onClick={() => updateVerification(p.id, method)}
                        className={cn(
                          "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium border transition-colors",
                          isActive
                            ? "bg-primary/10 text-primary border-primary/30"
                            : "text-muted-foreground border-border hover:bg-accent"
                        )}
                      >
                        <Icon size={10} />
                        {info.label}
                      </button>
                    );
                  })}
                </div>
                {p.verification === "sms" && (
                  <Input
                    placeholder="Phone number"
                    defaultValue={p.phone}
                    className="h-7 text-xs mt-1"
                  />
                )}
                {p.verification === "national_id" && (
                  <Input
                    placeholder="National ID number"
                    defaultValue={p.nationalId}
                    className="h-7 text-xs mt-1"
                  />
                )}
              </div>
            ))}
        </CollapsibleContent>
      </Collapsible>

      <Separator />

      {/* ── Section 5: Document visibility ── */}
      <div ref={visibilityRef} className="space-y-3">
        <div className="flex items-center gap-1.5">
          <Eye size={14} className="text-muted-foreground" />
          <p className="text-sm font-medium">Document visibility</p>
        </div>
        <div className="space-y-2">
          {MOCK_DOCUMENTS.map((doc) => {
            const visibleIds = visibility[doc.id] || [];
            const allVisible = visibleIds.length === participants.length;
            return (
              <div key={doc.id} className="flex items-center justify-between gap-2 p-2 rounded-md border">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">{doc.name}</p>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[9px] px-1 py-0 h-3.5 font-medium mt-0.5",
                      doc.docType === "primary" && "text-[hsl(var(--brand-indigo))]",
                      doc.docType === "supplement" && "text-amber-600",
                      doc.docType === "attachment" && "text-muted-foreground"
                    )}
                  >
                    {doc.docType.charAt(0).toUpperCase() + doc.docType.slice(1)}
                  </Badge>
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-6 px-2 text-[10px] gap-1">
                      <Eye size={10} />
                      {allVisible ? "All" : `${visibleIds.length}/${participants.length}`}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-2" align="end">
                    <p className="text-xs font-medium mb-2">Who can see this document?</p>
                    {participants.map((p) => (
                      <label
                        key={p.id}
                        className="flex items-center gap-2 px-1 py-1 rounded hover:bg-accent cursor-pointer"
                      >
                        <Checkbox
                          checked={visibleIds.includes(p.id)}
                          onCheckedChange={() => toggleDocVisibility(doc.id, p.id)}
                        />
                        <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                        <span className="text-xs truncate">{p.name}</span>
                      </label>
                    ))}
                  </PopoverContent>
                </Popover>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EditorParticipantsPanel;
