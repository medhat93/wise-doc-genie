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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MoreHorizontal,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Plus,
  Minus,
  Shield,
  Phone,
  Mail,
  Eye,
  ArrowRight,
  User,
  Bookmark,
  MousePointer,
  List,
  Info,
  MessageSquare,
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
import { toast } from "sonner";

/* ── Types ── */
export type ParticipantRole = "signer" | "reviewer" | "approver" | "cc";
export type SendingMethod = "email" | "sms" | "whatsapp";
export type VerificationMethodType = "sms" | "whatsapp" | "absher" | "nafath_only" | "nafath_digital";
export type VerificationSpecs = "without_id" | "with_id" | "with_id_biometrics";

export interface Participant {
  id: string;
  name: string;
  email: string;
  role: ParticipantRole;
  color: string;
  order: number;
  sendingMethod: SendingMethod;
  sendingPhone?: string;
  needsVerification: boolean;
  verificationMethod?: VerificationMethodType;
  verificationSpecs?: VerificationSpecs;
  phone?: string;
  nationalId?: string;
}

export type DocumentVisibility = Record<string, string[]>;

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

const VERIFICATION_METHOD_LABELS: Record<VerificationMethodType, string> = {
  sms: "SMS",
  whatsapp: "WhatsApp",
  absher: "Absher",
  nafath_only: "Nafath only",
  nafath_digital: "Nafath & Digital certificate",
};

const VERIFICATION_SPECS_LABELS: Record<VerificationSpecs, { label: string; tooltip: string }> = {
  without_id: { label: "Without national ID", tooltip: "Signer verifies via Nafath app without pre-filled ID" },
  with_id: { label: "With national ID", tooltip: "Signer's national ID is pre-validated before Nafath prompt" },
  with_id_biometrics: { label: "With national ID & Biometrics", tooltip: "Highest security — requires national ID plus biometric verification via Nafath" },
};

const SENDING_METHOD_LABELS: Record<SendingMethod, string> = {
  email: "Email",
  sms: "SMS",
  whatsapp: "WhatsApp",
};

/* ── Mock data ── */
const INITIAL_PARTICIPANTS: Participant[] = [
  { id: "p1", name: "Ahmed Al-Rashid", email: "ahmed@signit.sa", role: "signer", color: COLORS[0], order: 1, sendingMethod: "email", needsVerification: false },
  { id: "p2", name: "Sarah Johnson", email: "sarah@acme.com", role: "signer", color: COLORS[1], order: 2, sendingMethod: "email", needsVerification: true, verificationMethod: "sms" },
  { id: "p3", name: "Adel Al-Dossary", email: "adel@enterprise.sa", role: "signer", color: COLORS[3], order: 2, sendingMethod: "email", needsVerification: true, verificationMethod: "nafath_only", verificationSpecs: "with_id_biometrics", nationalId: "1087654321" },
  { id: "p4", name: "Mohammed Al-Faisal", email: "mohammed@legal.sa", role: "approver", color: COLORS[2], order: 3, sendingMethod: "sms", sendingPhone: "+966 50 123 4567", needsVerification: true, verificationMethod: "nafath_only", verificationSpecs: "with_id", nationalId: "1012345678" },
];

const MOCK_WORKFLOWS = [
  { id: "w1", name: "Standard 2-Signer Flow", desc: "2 signers, sequential" },
  { id: "w2", name: "Legal Review + Sign", desc: "1 approver → 2 signers parallel → 1 CC" },
];

/* ── Sortable signer item for signing order ── */
const SortableStepItem = ({
  participant,
  onOrderChange,
}: {
  participant: Participant;
  onOrderChange: (id: string, delta: number) => void;
}) => {
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
      <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: participant.color }} />
      <span className="truncate flex-1 text-xs">{participant.name}</span>
      <span className="text-[10px] text-muted-foreground">{participant.email}</span>
      <div className="flex items-center gap-0.5 ml-1">
        <button
          onClick={() => onOrderChange(participant.id, -1)}
          className="h-5 w-5 flex items-center justify-center rounded border text-muted-foreground hover:text-foreground hover:bg-accent"
        >
          <Minus size={10} />
        </button>
        <span className="text-[10px] font-bold w-4 text-center">{participant.order}</span>
        <button
          onClick={() => onOrderChange(participant.id, 1)}
          className="h-5 w-5 flex items-center justify-center rounded border text-muted-foreground hover:text-foreground hover:bg-accent"
        >
          <Plus size={10} />
        </button>
      </div>
    </div>
  );
};

/* ══════════ MAIN PANEL ══════════ */
const EditorParticipantsPanel = () => {
  const [participants, setParticipants] = useState<Participant[]>(INITIAL_PARTICIPANTS);
  const [nameInput, setNameInput] = useState("");
  const [roleInput, setRoleInput] = useState<ParticipantRole>("signer");
  const [sequential, setSequential] = useState(true);
  const [setWorkflow, setSetWorkflow] = useState(false);
  const [verificationOpen, setVerificationOpen] = useState(false);
  const [selectWorkflowOpen, setSelectWorkflowOpen] = useState(false);
  const [viewOrderOpen, setViewOrderOpen] = useState(false);
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
  const signers = participants.filter((p) => p.role === "signer" || p.role === "reviewer").sort((a, b) => a.order - b.order);
  const approvers = participants.filter((p) => p.role === "approver");
  const nextColor = COLORS[participants.length % COLORS.length];

  const addParticipant = useCallback(() => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    const isEmail = trimmed.includes("@");
    const email = isEmail ? trimmed : "";
    const name = isEmail ? trimmed.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : trimmed;

    const maxOrder = Math.max(0, ...participants.filter(p => p.role === "signer").map(p => p.order));
    const newP: Participant = {
      id: `p${Date.now()}`,
      name,
      email: email || `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
      role: roleInput,
      color: nextColor,
      order: roleInput === "signer" ? maxOrder + 1 : 0,
      sendingMethod: "email",
      needsVerification: false,
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
  }, [nameInput, roleInput, nextColor, participants]);

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

  const updateParticipant = (id: string, updates: Partial<Participant>) => {
    setParticipants((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const handleOrderChange = (id: string, delta: number) => {
    setParticipants((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const newOrder = Math.max(1, p.order + delta);
        return { ...p, order: newOrder };
      })
    );
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

  const handleSelfSign = () => {
    const selfSigner: Participant = {
      id: "p-self",
      name: "Ahmed Al-Rashid",
      email: "ahmed@signit.sa",
      role: "signer",
      color: COLORS[0],
      order: 1,
      sendingMethod: "email",
      needsVerification: false,
    };
    setParticipants([selfSigner]);
    setVisibility((prev) => {
      const next: DocumentVisibility = {};
      Object.keys(prev).forEach((docId) => {
        next[docId] = [selfSigner.id];
      });
      return next;
    });
    toast.success("Self-signing mode — you are the only signer");
  };

  const handleAddMe = () => {
    if (participants.some((p) => p.email === "ahmed@signit.sa")) {
      toast.error("You are already added as a participant");
      return;
    }
    const maxOrder = Math.max(0, ...participants.filter(p => p.role === "signer").map(p => p.order));
    const me: Participant = {
      id: `p${Date.now()}`,
      name: "Ahmed Al-Rashid",
      email: "ahmed@signit.sa",
      role: "signer",
      color: COLORS[participants.length % COLORS.length],
      order: maxOrder + 1,
      sendingMethod: "email",
      needsVerification: false,
    };
    setParticipants((prev) => [...prev, me]);
    setVisibility((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((docId) => {
        next[docId] = [...next[docId], me.id];
      });
      return next;
    });
    toast.success("Added you as a participant");
  };

  /* Build steps for signing order display */
  const buildSteps = () => {
    const allSignable = participants.filter((p) => p.role !== "cc");
    const stepMap = new Map<number, Participant[]>();
    allSignable.forEach((p) => {
      const order = p.role === "approver" ? 0 : p.order;
      if (!stepMap.has(order)) stepMap.set(order, []);
      stepMap.get(order)!.push(p);
    });
    return Array.from(stepMap.entries()).sort(([a], [b]) => a - b);
  };

  const needsVerificationPhone = (p: Participant) => {
    if (!p.needsVerification) return false;
    if (p.verificationMethod === "sms" || p.verificationMethod === "whatsapp") {
      return p.sendingMethod !== "sms" && p.sendingMethod !== "whatsapp";
    }
    return false;
  };

  const needsNationalId = (p: Participant) => {
    if (!p.needsVerification) return false;
    if (p.verificationMethod === "absher") return true;
    if (
      (p.verificationMethod === "nafath_only" || p.verificationMethod === "nafath_digital") &&
      (p.verificationSpecs === "with_id" || p.verificationSpecs === "with_id_biometrics")
    ) return true;
    return false;
  };

  const showNafathBanner = (p: Participant) => {
    if (!p.needsVerification) return false;
    return p.verificationMethod === "absher" || p.verificationMethod === "nafath_only" || p.verificationMethod === "nafath_digital";
  };

  const hasSpecs = (method?: VerificationMethodType) => {
    return method === "nafath_only" || method === "nafath_digital";
  };

  return (
    <div className="flex flex-col gap-4 pb-6">
      {/* Header text */}
      <p className="text-xs text-muted-foreground">
        Add people who need to sign, review, or receive this document
      </p>

      {/* ── Self-sign card ── */}
      <button
        onClick={handleSelfSign}
        className="flex items-center justify-between gap-2 border rounded-lg p-3 hover:bg-muted/50 cursor-pointer transition-colors text-left w-full"
      >
        <span className="text-sm font-medium">I will sign it by myself only</span>
        <ArrowRight size={16} className="text-muted-foreground flex-shrink-0" />
      </button>

      {/* ── Workflow settings row ── */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Switch checked={setWorkflow} onCheckedChange={setSetWorkflow} />
          <span className="text-sm font-medium">Set workflow</span>
        </div>
        {setWorkflow && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                Workflow settings
                <ChevronDown size={12} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => toast.success("Workflow saved")} className="gap-2 text-xs">
                <Bookmark size={14} />
                Save workflow
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectWorkflowOpen(true)} className="gap-2 text-xs">
                <MousePointer size={14} />
                Select workflow
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setViewOrderOpen(true)} className="gap-2 text-xs">
                <List size={14} />
                View order
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <Separator />

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
          return (
            <div key={p.id} className="border rounded-lg p-3 space-y-2.5">
              {/* Row 1: Name + actions */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
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

              {/* Row 2: Role, Sending method, Language */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-4 font-medium border", roleStyle.className)}>
                  {roleStyle.label}
                </Badge>
                <Select
                  value={p.sendingMethod}
                  onValueChange={(v) => updateParticipant(p.id, { sendingMethod: v as SendingMethod })}
                >
                  <SelectTrigger className="h-5 w-auto min-w-[80px] text-[10px] border-0 bg-transparent p-0 gap-1 text-[hsl(var(--brand-indigo))] font-medium [&>svg]:h-3 [&>svg]:w-3">
                    <Mail size={10} className="flex-shrink-0" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email" className="text-xs">Email</SelectItem>
                    <SelectItem value="sms" className="text-xs">SMS</SelectItem>
                    <SelectItem value="whatsapp" className="text-xs">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sending phone (for SMS/WhatsApp sending) */}
              {(p.sendingMethod === "sms" || p.sendingMethod === "whatsapp") && (
                <div className="flex items-center gap-1.5">
                  <Select defaultValue="+966">
                    <SelectTrigger className="h-7 w-[72px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="+966" className="text-xs">+966</SelectItem>
                      <SelectItem value="+1" className="text-xs">+1</SelectItem>
                      <SelectItem value="+44" className="text-xs">+44</SelectItem>
                      <SelectItem value="+971" className="text-xs">+971</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Phone number"
                    defaultValue={p.sendingPhone?.replace(/^\+\d+\s*/, "")}
                    className="h-7 text-xs flex-1"
                  />
                </div>
              )}

              {/* Signing order badge */}
              {p.role === "signer" && sequential && (
                <div className="flex items-center gap-1.5">
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                    Order: {p.order}
                  </Badge>
                </div>
              )}

              {/* ── Verification section ── */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium text-muted-foreground">Needs to verify</span>
                  <Switch
                    checked={p.needsVerification}
                    onCheckedChange={(checked) => updateParticipant(p.id, {
                      needsVerification: checked,
                      verificationMethod: checked ? "sms" : undefined,
                      verificationSpecs: undefined,
                    })}
                    className="scale-75 origin-right"
                  />
                </div>

                {p.needsVerification && (
                  <div className="space-y-2 pl-0">
                    {/* Method + Specs row */}
                    <div className="flex gap-2">
                      <div className={cn("flex-1", hasSpecs(p.verificationMethod) ? "w-1/2" : "w-full")}>
                        <label className="text-[9px] text-muted-foreground mb-0.5 block">Verification method</label>
                        <Select
                          value={p.verificationMethod}
                          onValueChange={(v) => {
                            const method = v as VerificationMethodType;
                            updateParticipant(p.id, {
                              verificationMethod: method,
                              verificationSpecs: hasSpecs(method) ? "without_id" : undefined,
                              nationalId: undefined,
                            });
                          }}
                        >
                          <SelectTrigger className="h-7 text-xs w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(Object.keys(VERIFICATION_METHOD_LABELS) as VerificationMethodType[]).map((m) => (
                              <SelectItem key={m} value={m} className="text-xs">{VERIFICATION_METHOD_LABELS[m]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {hasSpecs(p.verificationMethod) && (
                        <div className="flex-1 w-1/2">
                          <label className="text-[9px] text-muted-foreground mb-0.5 block">Verification specs</label>
                          <Select
                            value={p.verificationSpecs || "without_id"}
                            onValueChange={(v) => updateParticipant(p.id, { verificationSpecs: v as VerificationSpecs })}
                          >
                            <SelectTrigger className="h-7 text-xs w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(Object.keys(VERIFICATION_SPECS_LABELS) as VerificationSpecs[]).map((s) => (
                                <SelectItem key={s} value={s} className="text-xs">
                                  <div className="flex items-center gap-1">
                                    {VERIFICATION_SPECS_LABELS[s].label}
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Info size={10} className="text-muted-foreground" />
                                      </TooltipTrigger>
                                      <TooltipContent side="right" className="max-w-[200px] text-xs">
                                        {VERIFICATION_SPECS_LABELS[s].tooltip}
                                      </TooltipContent>
                                    </Tooltip>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    {/* National ID input */}
                    {needsNationalId(p) && (
                      <Input
                        placeholder="National ID number"
                        value={p.nationalId || ""}
                        onChange={(e) => updateParticipant(p.id, { nationalId: e.target.value })}
                        className="h-7 text-xs"
                      />
                    )}

                    {/* Phone for verification */}
                    {needsVerificationPhone(p) && (
                      <div className="flex items-center gap-1.5">
                        <Select defaultValue="+966">
                          <SelectTrigger className="h-7 w-[72px] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="+966" className="text-xs">+966</SelectItem>
                            <SelectItem value="+1" className="text-xs">+1</SelectItem>
                            <SelectItem value="+44" className="text-xs">+44</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          placeholder="Phone number for verification"
                          defaultValue={p.phone}
                          className="h-7 text-xs flex-1"
                        />
                      </div>
                    )}

                    {/* Info banner */}
                    {showNafathBanner(p) && (
                      <div className="flex items-start gap-2 rounded-lg p-2.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300">
                        <Info size={14} className="flex-shrink-0 mt-0.5" />
                        <p className="text-[10px] leading-relaxed">
                          {p.verificationMethod === "absher"
                            ? "Absher service is available only for Saudi citizens or expats with an active Absher account."
                            : "Nafath service is available only for Saudi citizens or expats with an active Nafath account."}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add participant button */}
      <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 w-full" onClick={() => document.querySelector<HTMLInputElement>('[placeholder="Name or email"]')?.focus()}>
        <Plus size={14} />
        Add new participant
      </Button>

      {/* Add me button */}
      <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5 w-full text-muted-foreground hover:text-foreground" onClick={handleAddMe}>
        <User size={14} />
        Add me as a participant
      </Button>

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
          <div className="space-y-3">
            {/* Approvers locked at step 0 */}
            {approvers.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Step 0 — Approval</p>
                {approvers.map((a) => (
                  <div key={a.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md border border-dashed bg-muted/30 text-sm opacity-70">
                    <Shield size={14} className="text-muted-foreground" />
                    <Badge variant="secondary" className="h-5 w-5 p-0 justify-center text-[10px] font-bold flex-shrink-0">0</Badge>
                    <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: a.color }} />
                    <span className="truncate flex-1 text-xs">{a.name}</span>
                    <span className="text-[10px] text-muted-foreground">Approver</span>
                  </div>
                ))}
              </div>
            )}

            {/* Grouped steps */}
            {(() => {
              const signersByOrder = new Map<number, Participant[]>();
              signers.forEach((s) => {
                if (!signersByOrder.has(s.order)) signersByOrder.set(s.order, []);
                signersByOrder.get(s.order)!.push(s);
              });
              const steps = Array.from(signersByOrder.entries()).sort(([a], [b]) => a - b);
              return steps.map(([stepNum, stepParticipants]) => (
                <div key={stepNum} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Step {stepNum}</p>
                    {stepParticipants.length > 1 && (
                      <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 text-[hsl(var(--brand-indigo))] border-[hsl(var(--brand-indigo))]/30">
                        Signing in parallel
                      </Badge>
                    )}
                  </div>
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={stepParticipants.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                      {stepParticipants.map((s) => (
                        <SortableStepItem key={s.id} participant={s} onOrderChange={handleOrderChange} />
                      ))}
                    </SortableContext>
                  </DndContext>
                </div>
              ));
            })()}

            {/* Add step button */}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1 text-muted-foreground w-full"
              onClick={() => {
                const maxOrder = Math.max(0, ...signers.map((s) => s.order));
                toast(`Step ${maxOrder + 1} created — drag participants into it`);
              }}
            >
              <Plus size={12} />
              Add step
            </Button>
          </div>
        )}
      </div>

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

      {/* ── Select Workflow Dialog ── */}
      <Dialog open={selectWorkflowOpen} onOpenChange={setSelectWorkflowOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Select Workflow</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {MOCK_WORKFLOWS.map((w) => (
              <button
                key={w.id}
                onClick={() => {
                  toast.success("Workflow applied");
                  setSelectWorkflowOpen(false);
                }}
                className="w-full text-left border rounded-lg p-3 hover:bg-muted/50 transition-colors space-y-0.5"
              >
                <p className="text-sm font-medium">{w.name}</p>
                <p className="text-xs text-muted-foreground">{w.desc}</p>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── View Order Dialog ── */}
      <Dialog open={viewOrderOpen} onOpenChange={setViewOrderOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Signing Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-0">
            {buildSteps().map(([stepNum, stepPs], idx, arr) => (
              <div key={stepNum}>
                <div className="flex items-center gap-3 py-2">
                  <div className="flex-shrink-0 h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                    {stepNum}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {stepPs.map((p) => p.name).join(" + ")}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {stepPs.map((p) => (
                        <Badge key={p.id} variant="outline" className={cn("text-[9px] px-1 py-0 h-3.5", ROLE_STYLES[p.role].className)}>
                          {ROLE_STYLES[p.role].label}
                        </Badge>
                      ))}
                      {stepPs.length > 1 && (
                        <span className="text-[9px] text-[hsl(var(--brand-indigo))]">Signing in parallel</span>
                      )}
                    </div>
                  </div>
                </div>
                {idx < arr.length - 1 && (
                  <div className="ml-3.5 h-4 w-px bg-border" />
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EditorParticipantsPanel;
